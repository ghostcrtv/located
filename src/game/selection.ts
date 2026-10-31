import { COUNTRIES } from '../data/countries'
import type { LocationEntry, ModeId } from './types'

export type Rng = () => number

export function shuffle<T>(arr: T[], rng: Rng): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * Pick the next location for a session.
 * - never repeats a location inside a session
 * - spreads rounds across continents (so countries with lots of photos can't dominate)
 * - avoids countries already used this session when possible
 * - prefers places the player hasn't seen in their last few games
 */
export function pickNext(
  catalog: LocationEntry[],
  mode: ModeId,
  usedIds: string[],
  recent: string[],
  rng: Rng,
): LocationEntry | null {
  const used = new Set(usedIds)
  const pool = catalog.filter((l) => l.modes.includes(mode) && !used.has(l.id))
  if (!pool.length) return null

  const usedEntries = catalog.filter((l) => used.has(l.id))
  const contCount = new Map<string, number>()
  const usedCountries = new Set(usedEntries.map((l) => l.countryCode))
  for (const l of usedEntries) {
    const c = COUNTRIES[l.countryCode]?.continent ?? '?'
    contCount.set(c, (contCount.get(c) ?? 0) + 1)
  }
  const recentSet = new Set(recent)

  // Least-used continent first
  const byCont = new Map<string, LocationEntry[]>()
  for (const l of pool) {
    const c = COUNTRIES[l.countryCode]?.continent ?? '?'
    byCont.set(c, [...(byCont.get(c) ?? []), l])
  }
  const minUse = Math.min(...[...byCont.keys()].map((c) => contCount.get(c) ?? 0))
  const conts = shuffle([...byCont.keys()].filter((c) => (contCount.get(c) ?? 0) === minUse), rng)
  const candidates = byCont.get(conts[0])!

  // Weight: fresh countries and not-recently-seen places are much more likely
  const weights = candidates.map((l) => (usedCountries.has(l.countryCode) ? 0.15 : 1) * (recentSet.has(l.id) ? 0.2 : 1))
  const total = weights.reduce((a, b) => a + b, 0)
  let r = rng() * total
  for (let i = 0; i < candidates.length; i++) {
    r -= weights[i]
    if (r <= 0) return candidates[i]
  }
  return candidates[candidates.length - 1]
}
