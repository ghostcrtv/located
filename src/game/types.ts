export type ModeId = 'worldtour' | 'oneshot' | 'endless'
export type Continent = 'Africa' | 'Asia' | 'Europe' | 'North America' | 'South America' | 'Oceania'
export type ClueId = 'corners' | 'decode' | 'proximity'
export type LatLng = { lat: number; lng: number }

export interface PhotoCredit {
  author: string
  license: string
  licenseUrl: string
  sourceUrl: string
  /** Original title on Commons (shown on the reveal and in Credits — never during play, as it can name the place). */
  title?: string
  note?: string
}

export interface LocationEntry {
  /** Opaque id — never contains the place name, so file names don't give the answer away. */
  id: string
  countryCode: string
  region?: string
  /** Where the photo was taken (camera position from the photo's Commons record). */
  lat: number
  lng: number
  photo: { file: string; width: number; height: number; credit: PhotoCredit }
  modes: ModeId[]
  /** Short riddle for the DECODE clue. Written in advance, never generated at runtime. */
  decode: string
  /** Three plausible wrong answers for FOUR CORNERS (ISO alpha-2 codes). */
  decoys: [string, string, string]
  /** Shown on the reveal screen. */
  place: string
  fact?: string
  verification: { status: 'verified' | 'demo'; checked: string; notes?: string }
}

export type Imagery =
  | { kind: 'photo'; file: string; credit: PhotoCredit; width: number; height: number }
  | { kind: 'street'; provider: 'mapillary'; imageId: string; isPano: boolean }

export interface CornersState { options: string[]; picked?: string; correct?: boolean }
export interface ProximityState { lat: number; lng: number; band: number }

export interface RoundState {
  locationId: string
  imagery: Imagery
  answer: LatLng
  clues: { corners?: CornersState; decode?: boolean; proximity?: ProximityState }
  guess?: LatLng
  distanceKm?: number
  baseScore?: number
  score?: number
  guessCountry?: string | null
  countryCorrect?: boolean
  /** True once this round's result has been written to the player's profile — prevents double-awarding after a refresh. */
  applied?: boolean
  newStamp?: boolean
  newAchievements?: string[]
  /** Street imagery lookup already attempted for this round (so a refresh doesn't re-query). */
  streetTried?: boolean
  /** Honest notice shown to the player, e.g. when street imagery wasn't available here. */
  note?: string
}

export interface Session {
  v: 1
  id: string
  mode: ModeId
  startedAt: string
  rounds: RoundState[]
  phase: 'playing' | 'reveal' | 'complete'
  /** When street imagery is not available, World Tour/Endless run on the photo catalog and say so. */
  imageryMode: 'photo' | 'street'
  exhausted?: boolean
  /** Set once the finished game has been added to records. */
  recorded?: boolean
  personalBest?: boolean
  newAchievements: string[]
}

export interface GameRecord {
  score: number
  date: string
  mode: ModeId
  rounds: number
  avgKm: number
  clues: number
}

export interface Profile {
  v: 1
  gamesPlayed: Record<ModeId, number>
  roundsPlayed: number
  records: { worldtour: GameRecord[]; oneshot: GameRecord[]; endless: GameRecord[] }
  passport: Record<string, { first: string; found: number }>
  countryStats: Record<string, { seen: number; found: number; best: number }>
  achievements: Record<string, string>
  counters: { cluesUsed: number; roundsNoClue: number; bullseyes: number; boops: number }
  recent: string[]
  lastVisit?: string
}

export interface Settings {
  v: 1
  sound: boolean
  benny: 'full' | 'quiet' | 'off'
  motion: 'system' | 'reduced' | 'full'
  units: 'mi' | 'km'
  mapDetail: boolean
  mapillaryToken: string
}
