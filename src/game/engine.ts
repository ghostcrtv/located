import { SCORING } from '../config'
import { haversineKm, normalize } from '../lib/geo'
import { baseScore, roundScore } from '../lib/scoring'
import { cluesUsed, cornersOptions, proximityProbe } from './clues'
import { pickNext, type Rng } from './selection'
import type { ClueId, Imagery, LatLng, LocationEntry, ModeId, RoundState, Session } from './types'

export const MODE_LENGTH: Record<ModeId, number | null> = {
  worldtour: SCORING.roundsPerGame,
  oneshot: SCORING.roundsPerGame,
  endless: null,
}

export function photoImagery(loc: LocationEntry): Imagery {
  return { kind: 'photo', file: loc.photo.file, credit: loc.photo.credit, width: loc.photo.width, height: loc.photo.height }
}

export function newRound(loc: LocationEntry, imagery?: Imagery, answer?: LatLng): RoundState {
  return { locationId: loc.id, imagery: imagery ?? photoImagery(loc), answer: answer ?? { lat: loc.lat, lng: loc.lng }, clues: {} }
}

export function createSession(
  mode: ModeId,
  catalog: LocationEntry[],
  recent: string[],
  rng: Rng,
  imageryMode: 'photo' | 'street' = 'photo',
): Session | null {
  const first = pickNext(catalog, mode, [], recent, rng)
  if (!first) return null
  return {
    v: 1,
    id: `${Date.now().toString(36)}${Math.floor(rng() * 1e6).toString(36)}`,
    mode,
    startedAt: new Date().toISOString(),
    rounds: [newRound(first)],
    phase: 'playing',
    imageryMode: mode === 'oneshot' ? 'photo' : imageryMode,
    newAchievements: [],
  }
}

export const currentRound = (s: Session) => s.rounds[s.rounds.length - 1]
export const totalScore = (s: Session) => s.rounds.reduce((t, r) => t + (r.score ?? 0), 0)
export const completedRounds = (s: Session) => s.rounds.filter((r) => r.score !== undefined)

function replaceCurrent(s: Session, r: RoundState): Session {
  return { ...s, rounds: [...s.rounds.slice(0, -1), r] }
}

/** Swap in different imagery for the current round (e.g. a street-level image was found nearby). */
export function setRoundImagery(s: Session, imagery: Imagery, answer: LatLng): Session {
  const r = currentRound(s)
  if (r.score !== undefined) return s
  return replaceCurrent(s, { ...r, imagery, answer: normalize(answer) })
}

/** Replace the current round's location (used when imagery fails to load). */
export function replaceRoundLocation(s: Session, loc: LocationEntry): Session {
  const r = currentRound(s)
  if (r.score !== undefined || cluesUsed(r) > 0) return s
  return replaceCurrent(s, newRound(loc))
}

export function applyClue(
  s: Session,
  clue: ClueId,
  loc: LocationEntry,
  rng: Rng,
  payload?: { pick?: string; test?: LatLng },
): Session {
  if (s.phase !== 'playing') return s
  const r = currentRound(s)
  if (r.score !== undefined) return s
  const clues = { ...r.clues }
  if (clue === 'corners') {
    if (!clues.corners) clues.corners = { options: cornersOptions(loc, rng) }
    else if (payload?.pick && clues.corners.picked === undefined && clues.corners.options.includes(payload.pick)) {
      clues.corners = { ...clues.corners, picked: payload.pick, correct: payload.pick === loc.countryCode }
    } else return s
  } else if (clue === 'decode') {
    if (clues.decode) return s
    clues.decode = true
  } else if (clue === 'proximity') {
    if (clues.proximity || !payload?.test) return s
    const t = normalize(payload.test)
    clues.proximity = { ...t, band: proximityProbe(t, r.answer) }
  }
  return replaceCurrent(s, { ...r, clues })
}

export function submitGuess(s: Session, guess: LatLng, guessCountry: string | null, answerCountry: string): Session {
  if (s.phase !== 'playing') return s
  const r = currentRound(s)
  if (r.score !== undefined) return s
  const g = normalize(guess)
  const distanceKm = haversineKm(g, r.answer)
  const done: RoundState = {
    ...r,
    guess: g,
    distanceKm,
    baseScore: baseScore(distanceKm),
    score: roundScore(distanceKm, cluesUsed(r)),
    guessCountry,
    countryCorrect: guessCountry === answerCountry,
  }
  return { ...replaceCurrent(s, done), phase: 'reveal' }
}

export function isFinalRound(s: Session): boolean {
  const len = MODE_LENGTH[s.mode]
  return len !== null && completedRounds(s).length >= len
}

/** Move on. Returns a completed session when a fixed-length game is over or the catalog runs out. */
export function advance(s: Session, catalog: LocationEntry[], recent: string[], rng: Rng): Session {
  if (s.phase !== 'reveal') return s
  if (isFinalRound(s)) return { ...s, phase: 'complete' }
  const next = pickNext(catalog, s.mode, s.rounds.map((r) => r.locationId), recent, rng)
  if (!next) return { ...s, phase: 'complete', exhausted: true }
  return { ...s, rounds: [...s.rounds, newRound(next)], phase: 'playing' }
}

/** Endless: player chooses to stop. Unfinished round is discarded. */
export function endSession(s: Session): Session {
  const rounds = s.rounds.filter((r) => r.score !== undefined)
  return { ...s, rounds: rounds.length ? rounds : s.rounds, phase: 'complete' }
}

export function sessionStats(s: Session) {
  const done = completedRounds(s)
  const total = done.reduce((t, r) => t + (r.score ?? 0), 0)
  const dist = done.reduce((t, r) => t + (r.distanceKm ?? 0), 0)
  const clues = done.reduce((t, r) => t + cluesUsed(r), 0)
  const best = done.reduce((b, r) => Math.max(b, r.score ?? 0), 0)
  return {
    rounds: done.length,
    total,
    totalKm: dist,
    avgKm: done.length ? dist / done.length : 0,
    clues,
    best,
    avgScore: done.length ? total / done.length : 0,
    countriesRight: done.filter((r) => r.countryCorrect).length,
  }
}
