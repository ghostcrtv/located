import { STORAGE_KEYS } from '../config'
import type { GameRecord, ModeId, Profile, Session, Settings } from '../game/types'

/** localStorage can throw (private mode, storage full, blocked). Every access goes through these. */
export function readJSON(key: string): unknown {
  try {
    const raw = globalThis.localStorage?.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}
export function writeJSON(key: string, value: unknown): boolean {
  try {
    globalThis.localStorage?.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}
export function removeKey(key: string) {
  try {
    globalThis.localStorage?.removeItem(key)
  } catch {
    /* ignore */
  }
}

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)
const num = (v: unknown, d = 0) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : d)
const str = (v: unknown, d = '') => (typeof v === 'string' ? v : d)
const MODES: ModeId[] = ['worldtour', 'oneshot', 'endless']

// ---------- Settings ----------
export const defaultSettings = (): Settings => ({
  v: 1, sound: true, benny: 'full', motion: 'system', units: 'mi', mapDetail: true, mapillaryToken: '',
})
export function sanitizeSettings(raw: unknown): Settings {
  const d = defaultSettings()
  if (!isObj(raw)) return d
  return {
    v: 1,
    sound: typeof raw.sound === 'boolean' ? raw.sound : d.sound,
    benny: raw.benny === 'quiet' || raw.benny === 'off' || raw.benny === 'full' ? raw.benny : d.benny,
    motion: raw.motion === 'reduced' || raw.motion === 'full' || raw.motion === 'system' ? raw.motion : d.motion,
    units: raw.units === 'km' || raw.units === 'mi' ? raw.units : d.units,
    mapDetail: typeof raw.mapDetail === 'boolean' ? raw.mapDetail : d.mapDetail,
    mapillaryToken: str(raw.mapillaryToken).trim().slice(0, 200),
  }
}
export const loadSettings = () => sanitizeSettings(readJSON(STORAGE_KEYS.settings))
export const saveSettings = (s: Settings) => writeJSON(STORAGE_KEYS.settings, s)

// ---------- Profile ----------
export const defaultProfile = (): Profile => ({
  v: 1,
  gamesPlayed: { worldtour: 0, oneshot: 0, endless: 0 },
  roundsPlayed: 0,
  records: { worldtour: [], oneshot: [], endless: [] },
  passport: {},
  countryStats: {},
  achievements: {},
  counters: { cluesUsed: 0, roundsNoClue: 0, bullseyes: 0, boops: 0 },
  recent: [],
})
function sanitizeRecord(r: unknown, mode: ModeId): GameRecord | null {
  if (!isObj(r)) return null
  const score = num(r.score, -1)
  if (score < 0) return null
  return { score: Math.floor(score), date: str(r.date), mode, rounds: Math.floor(num(r.rounds)), avgKm: num(r.avgKm), clues: Math.floor(num(r.clues)) }
}
export function sanitizeProfile(raw: unknown): Profile {
  const p = defaultProfile()
  if (!isObj(raw) || raw.v !== 1) return p
  if (isObj(raw.gamesPlayed)) for (const m of MODES) p.gamesPlayed[m] = Math.floor(num(raw.gamesPlayed[m]))
  p.roundsPlayed = Math.floor(num(raw.roundsPlayed))
  if (isObj(raw.records))
    for (const m of MODES) {
      const list = raw.records[m]
      if (Array.isArray(list)) p.records[m] = list.map((r) => sanitizeRecord(r, m)).filter((r): r is GameRecord => !!r).slice(0, 10)
    }
  if (isObj(raw.passport))
    for (const [k, v] of Object.entries(raw.passport))
      if (/^[A-Z]{2}$/.test(k) && isObj(v)) p.passport[k] = { first: str(v.first), found: Math.max(1, Math.floor(num(v.found, 1))) }
  if (isObj(raw.countryStats))
    for (const [k, v] of Object.entries(raw.countryStats))
      if (/^[A-Z]{2}$/.test(k) && isObj(v)) p.countryStats[k] = { seen: Math.floor(num(v.seen)), found: Math.floor(num(v.found)), best: Math.floor(num(v.best)) }
  if (isObj(raw.achievements)) for (const [k, v] of Object.entries(raw.achievements)) if (typeof v === 'string') p.achievements[k] = v
  if (isObj(raw.counters)) {
    p.counters.cluesUsed = Math.floor(num(raw.counters.cluesUsed))
    p.counters.roundsNoClue = Math.floor(num(raw.counters.roundsNoClue))
    p.counters.bullseyes = Math.floor(num(raw.counters.bullseyes))
    p.counters.boops = Math.floor(num(raw.counters.boops))
  }
  if (Array.isArray(raw.recent)) p.recent = raw.recent.filter((x): x is string => typeof x === 'string').slice(-40)
  if (typeof raw.lastVisit === 'string') p.lastVisit = raw.lastVisit
  return p
}
export const loadProfile = () => sanitizeProfile(readJSON(STORAGE_KEYS.profile))
export const saveProfile = (p: Profile) => writeJSON(STORAGE_KEYS.profile, p)

// ---------- Active session ----------
/** Returns a saved game only if it still makes sense against the current location catalog. */
export function sanitizeSession(raw: unknown, knownIds: Set<string>): Session | null {
  if (!isObj(raw) || raw.v !== 1 || !MODES.includes(raw.mode as ModeId) || !Array.isArray(raw.rounds)) return null
  if (raw.phase !== 'playing' && raw.phase !== 'reveal' && raw.phase !== 'complete') return null
  if (raw.rounds.length === 0) return null
  for (const r of raw.rounds) {
    if (!isObj(r) || typeof r.locationId !== 'string' || !knownIds.has(r.locationId)) return null
    if (!isObj(r.answer) || typeof r.answer.lat !== 'number' || typeof r.answer.lng !== 'number') return null
    if (!isObj(r.imagery) || (r.imagery.kind !== 'photo' && r.imagery.kind !== 'street')) return null
    if (!isObj(r.clues)) return null
    if (r.score !== undefined && (typeof r.score !== 'number' || r.score < 0 || r.score > 5000)) return null
  }
  const ids = raw.rounds.map((r) => (r as { locationId: string }).locationId)
  if (new Set(ids).size !== ids.length) return null
  return raw as unknown as Session
}
export const saveSession = (s: Session | null) => (s ? writeJSON(STORAGE_KEYS.session, s) : removeKey(STORAGE_KEYS.session))
export const loadSession = (knownIds: Set<string>) => sanitizeSession(readJSON(STORAGE_KEYS.session), knownIds)

export function resetAll() {
  removeKey(STORAGE_KEYS.profile)
  removeKey(STORAGE_KEYS.session)
}
