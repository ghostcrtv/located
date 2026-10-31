import { PROXIMITY_BANDS, SCORING, TIERS } from '../config'

/** Accuracy score before clue penalties: 5000 × e^(−distance / 1500 km). */
export function baseScore(distanceKm: number): number {
  if (!Number.isFinite(distanceKm) || distanceKm < 0) return 0
  return Math.round(SCORING.maxPerRound * Math.exp(-distanceKm / SCORING.decayKm))
}

/** Final round score: base minus 500 per clue, never below 0 or above the maximum. */
export function roundScore(distanceKm: number, cluesUsed: number): number {
  const clues = Math.max(0, Math.min(3, Math.floor(cluesUsed || 0)))
  const s = baseScore(distanceKm) - SCORING.cluePenalty * clues
  return Math.max(0, Math.min(SCORING.maxPerRound, s))
}

export function maxAvailable(cluesUsed: number): number {
  return Math.max(0, SCORING.maxPerRound - SCORING.cluePenalty * cluesUsed)
}

export function tierFor(base: number) {
  return TIERS.find((t) => base >= t.min) ?? TIERS[TIERS.length - 1]
}

export function proximityBand(distanceKm: number): number {
  const i = PROXIMITY_BANDS.findIndex((b) => distanceKm < b.maxKm)
  return i === -1 ? PROXIMITY_BANDS.length - 1 : i
}

/** Safe running total for Endless — integers only, capped well below float precision limits. */
export function safeAdd(total: number, add: number): number {
  const t = Number.isFinite(total) ? Math.floor(total) : 0
  const a = Number.isFinite(add) ? Math.floor(add) : 0
  return Math.min(Number.MAX_SAFE_INTEGER, Math.max(0, t + a))
}
