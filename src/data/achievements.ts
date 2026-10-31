import type { ModeId } from '../game/types'

/**
 * Achievements are data. Add a new one by adding an entry — the evaluator in
 * game/progress.ts understands each `rule.type` below.
 */
export type Rule =
  | { type: 'passportCount'; min: number }
  | { type: 'continents'; min: number }
  | { type: 'roundNoClues' }
  | { type: 'roundDistanceUnder'; km: number; mode?: ModeId }
  | { type: 'roundDistanceOver'; km: number }
  | { type: 'roundAllClues' }
  | { type: 'roundOcean' }
  | { type: 'gameAllRoundsAtLeast'; score: number }
  | { type: 'gameScoreAtLeast'; score: number; mode?: ModeId }
  | { type: 'gameNoClues' }
  | { type: 'personalRecord' }
  | { type: 'endlessRounds'; min: number }
  | { type: 'boops'; min: number }
  | { type: 'gamesPlayed'; min: number }

export interface Achievement { id: string; title: string; desc: string; icon: string; rule: Rule; secret?: boolean }

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first-stamp', title: 'FIRST STAMP', desc: 'Discover your first country.', icon: 'Stamp', rule: { type: 'passportCount', min: 1 } },
  { id: 'no-help', title: 'NO HELP NEEDED', desc: 'Finish a round without using a clue.', icon: 'Eye', rule: { type: 'roundNoClues' } },
  { id: 'sharp-eyes', title: 'SHARP EYES', desc: 'In One Shot, land within 50 km.', icon: 'ScanEye', rule: { type: 'roundDistanceUnder', km: 50, mode: 'oneshot' } },
  { id: 'five-for-five', title: 'FIVE FOR FIVE', desc: 'Score 3,500+ in all five rounds of a game.', icon: 'Flame', rule: { type: 'gameAllRoundsAtLeast', score: 3500 } },
  { id: 'world-wanderer', title: 'WORLD WANDERER', desc: 'Discover countries on 3 continents.', icon: 'Globe2', rule: { type: 'continents', min: 3 } },
  { id: 'bennys-favorite', title: "BENNY'S FAVORITE", desc: 'Set a new personal record.', icon: 'Trophy', rule: { type: 'personalRecord' } },
  { id: 'bullseye', title: 'BULLSEYE', desc: 'Guess within 10 km of the spot.', icon: 'Crosshair', rule: { type: 'roundDistanceUnder', km: 10 } },
  { id: 'collector', title: 'STAMP COLLECTOR', desc: 'Discover 10 countries.', icon: 'BookOpen', rule: { type: 'passportCount', min: 10 } },
  { id: 'globetrotter', title: 'GLOBETROTTER', desc: 'Discover countries on all 6 inhabited continents.', icon: 'Plane', rule: { type: 'continents', min: 6 } },
  { id: 'pure-instinct', title: 'PURE INSTINCT', desc: 'Finish a 5-round game without a single clue.', icon: 'Sparkles', rule: { type: 'gameNoClues' } },
  { id: 'big-tour', title: 'GRAND TOUR', desc: 'Score 20,000+ in World Tour.', icon: 'Medal', rule: { type: 'gameScoreAtLeast', score: 20000, mode: 'worldtour' } },
  { id: 'marathon', title: 'MARATHON PAWS', desc: 'Play 20 rounds in one Endless session.', icon: 'Footprints', rule: { type: 'endlessRounds', min: 20 } },
  { id: 'regular', title: 'FREQUENT FLYER', desc: 'Finish 10 games.', icon: 'Ticket', rule: { type: 'gamesPlayed', min: 10 } },
  // The weird ones
  { id: 'antipode', title: 'OTHER SIDE OF THE PLANET', desc: 'Miss by more than 15,000 km. Impressive, in a way.', icon: 'Orbit', rule: { type: 'roundDistanceOver', km: 15000 } },
  { id: 'wet-paws', title: 'WET PAWS', desc: 'Drop your guess in the middle of the sea.', icon: 'Waves', rule: { type: 'roundOcean' } },
  { id: 'all-help', title: 'SHOULD I DRIVE?', desc: 'Use all three clues in one round.', icon: 'CarFront', rule: { type: 'roundAllClues' } },
  { id: 'boop', title: 'PROFESSIONAL BOOPER', desc: 'Boop Benny 10 times.', icon: 'Hand', rule: { type: 'boops', min: 10 }, secret: true },
]

export const ACH_BY_ID = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a]))
