import { COUNTRIES } from '../data/countries'
import { haversineKm } from '../lib/geo'
import { proximityBand } from '../lib/scoring'
import { shuffle, type Rng } from './selection'
import type { LatLng, LocationEntry, RoundState } from './types'

export const CLUE_ORDER = ['corners', 'decode', 'proximity'] as const

export function cluesUsed(r: RoundState): number {
  return (r.clues.corners ? 1 : 0) + (r.clues.decode ? 1 : 0) + (r.clues.proximity ? 1 : 0)
}

/** FOUR CORNERS — the correct country plus three hand-picked look-alike decoys, shuffled. */
export function cornersOptions(loc: LocationEntry, rng: Rng): string[] {
  const decoys = loc.decoys.filter((c) => c !== loc.countryCode && COUNTRIES[c])
  // Safety net if a catalog entry ever has bad decoys: fill from the same continent.
  const cont = COUNTRIES[loc.countryCode]?.continent
  const fill = shuffle(
    Object.values(COUNTRIES).filter((c) => c.continent === cont && c.code !== loc.countryCode && !decoys.includes(c.code)),
    rng,
  ).map((c) => c.code)
  const set = [...new Set(decoys)].slice(0, 3)
  while (set.length < 3 && fill.length) set.push(fill.shift()!)
  return shuffle([loc.countryCode, ...set], rng)
}

/** PROXIMITY — only the band index is returned; the exact distance never reaches the UI. */
export function proximityProbe(test: LatLng, answer: LatLng): number {
  return proximityBand(haversineKm(test, answer))
}
