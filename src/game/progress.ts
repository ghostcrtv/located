import { ACHIEVEMENTS, type Rule } from '../data/achievements'
import { COUNTRIES } from '../data/countries'
import { cluesUsed } from './clues'
import { MODE_LENGTH, sessionStats } from './engine'
import type { GameRecord, ModeId, Profile, RoundState, Session } from './types'

export interface Ctx {
  profile: Profile
  mode: ModeId
  round?: RoundState
  session?: Session
  personalRecord?: boolean
  boops?: number
}

function continentsDiscovered(p: Profile): number {
  return new Set(Object.keys(p.passport).map((c) => COUNTRIES[c]?.continent).filter(Boolean)).size
}

export function ruleMet(rule: Rule, c: Ctx): boolean {
  const r = c.round
  const done = c.session ? c.session.rounds.filter((x) => x.score !== undefined) : []
  const fixedLen = c.session ? MODE_LENGTH[c.session.mode] : null
  const gameComplete = !!c.session && c.session.phase === 'complete' && fixedLen !== null && done.length >= fixedLen
  switch (rule.type) {
    case 'passportCount': return Object.keys(c.profile.passport).length >= rule.min
    case 'continents': return continentsDiscovered(c.profile) >= rule.min
    case 'roundNoClues': return !!r && r.score !== undefined && cluesUsed(r) === 0
    case 'roundAllClues': return !!r && cluesUsed(r) === 3
    case 'roundOcean': return !!r && r.guess !== undefined && r.guessCountry === null
    case 'roundDistanceUnder': return !!r && r.distanceKm !== undefined && r.distanceKm < rule.km && (!rule.mode || rule.mode === c.mode)
    case 'roundDistanceOver': return !!r && r.distanceKm !== undefined && r.distanceKm > rule.km
    case 'gameAllRoundsAtLeast': return gameComplete && done.every((x) => (x.score ?? 0) >= rule.score)
    case 'gameScoreAtLeast': return gameComplete && (!rule.mode || rule.mode === c.mode) && sessionStats(c.session!).total >= rule.score
    case 'gameNoClues': return gameComplete && done.every((x) => cluesUsed(x) === 0)
    case 'personalRecord': return !!c.personalRecord
    case 'endlessRounds': return c.mode === 'endless' && done.length >= rule.min
    case 'boops': return (c.boops ?? 0) >= rule.min
    case 'gamesPlayed': return Object.values(c.profile.gamesPlayed).reduce((a, b) => a + b, 0) >= rule.min
  }
}

/** Returns ids of achievements newly earned in this context, and the updated profile. */
export function awardAchievements(c: Ctx, now = new Date().toISOString()): { profile: Profile; earned: string[] } {
  const earned: string[] = []
  const achievements = { ...c.profile.achievements }
  for (const a of ACHIEVEMENTS) {
    if (achievements[a.id]) continue
    if (ruleMet(a.rule, { ...c, profile: { ...c.profile, achievements } })) {
      achievements[a.id] = now
      earned.push(a.id)
    }
  }
  return { profile: { ...c.profile, achievements }, earned }
}

/**
 * Write one finished round into the profile. Called exactly once per round
 * (the round is marked `applied` afterwards, so a page refresh can't double-count).
 */
export function applyRound(
  profile: Profile,
  session: Session,
  round: RoundState,
  answerCountry: string,
  now = new Date().toISOString(),
): { profile: Profile; round: RoundState } {
  if (round.applied || round.score === undefined) return { profile, round }
  const p: Profile = structuredClone(profile)
  p.roundsPlayed += 1
  const used = cluesUsed(round)
  p.counters.cluesUsed += used
  if (used === 0) p.counters.roundsNoClue += 1
  if ((round.distanceKm ?? Infinity) < 10) p.counters.bullseyes += 1

  const stats = p.countryStats[answerCountry] ?? { seen: 0, found: 0, best: 0 }
  stats.seen += 1
  stats.best = Math.max(stats.best, round.score)

  // A country is "identified" ONLY by a correct Four Corners pick or a guess inside its real borders.
  const identified = round.countryCorrect === true || round.clues.corners?.correct === true
  let newStamp = false
  if (identified) {
    stats.found += 1
    if (!p.passport[answerCountry]) {
      p.passport[answerCountry] = { first: now, found: 1 }
      newStamp = true
    } else p.passport[answerCountry].found += 1
  }
  p.countryStats[answerCountry] = stats
  p.recent = [...p.recent.filter((id) => id !== round.locationId), round.locationId].slice(-40)

  const res = awardAchievements({ profile: p, mode: session.mode, round, session }, now)
  return { profile: res.profile, round: { ...round, applied: true, newStamp, newAchievements: res.earned } }
}

export function isPersonalBest(profile: Profile, mode: ModeId, score: number): boolean {
  const list = profile.records[mode]
  return score > 0 && (list.length === 0 || score > Math.max(...list.map((r) => r.score)))
}

/** Add a completed game to the leaderboard (top 10 per mode). Called once per session. */
export function recordGame(profile: Profile, session: Session, now = new Date().toISOString()) {
  if (session.recorded) return { profile, session, earned: [] as string[] }
  const st = sessionStats(session)
  if (st.rounds === 0) return { profile, session: { ...session, recorded: true }, earned: [] as string[] }
  const p: Profile = structuredClone(profile)
  const rec: GameRecord = { score: st.total, date: now, mode: session.mode, rounds: st.rounds, avgKm: Math.round(st.avgKm), clues: st.clues }
  const pb = isPersonalBest(p, session.mode, st.total)
  p.records[session.mode] = [...p.records[session.mode], rec].sort((a, b) => b.score - a.score || a.date.localeCompare(b.date)).slice(0, 10)
  p.gamesPlayed[session.mode] += 1
  const res = awardAchievements({ profile: p, mode: session.mode, session, personalRecord: pb }, now)
  return {
    profile: res.profile,
    session: { ...session, recorded: true, personalBest: pb, newAchievements: [...session.newAchievements, ...res.earned] },
    earned: res.earned,
  }
}

/** Endless "best" stats: highest score, most rounds, best per-round average (min 5 rounds). */
export function endlessBests(profile: Profile) {
  const list = profile.records.endless
  const eligible = list.filter((r) => r.rounds >= 5)
  return {
    score: list.reduce((m, r) => Math.max(m, r.score), 0),
    rounds: list.reduce((m, r) => Math.max(m, r.rounds), 0),
    avg: eligible.reduce((m, r) => Math.max(m, Math.round(r.score / r.rounds)), 0),
  }
}
