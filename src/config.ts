/**
 * Every tunable number in one place.
 * Change these to make the game easier/harder — nothing else needs to be touched.
 */
export const SCORING = {
  maxPerRound: 5000,
  /** Bigger = more forgiving. 1500 km means a guess 1,500 km off earns ~37% of the points. */
  decayKm: 1500,
  cluePenalty: 500,
  roundsPerGame: 5,
}

/** Score-based feedback tiers, judged on accuracy alone (before clue penalties). */
export const TIERS = [
  { min: 4750, id: 'incredible', label: 'INCREDIBLE GUESS' },
  { min: 4000, id: 'target', label: 'RIGHT ON TARGET' },
  { min: 3000, id: 'close', label: 'VERY CLOSE' },
  { min: 1500, id: 'notbad', label: 'NOT BAD' },
  { min: 0, id: 'far', label: 'LONG WAY FROM HOME' },
] as const

/** PROXIMITY clue bands (km). The player only ever sees the band, never the exact distance. */
export const PROXIMITY_BANDS = [
  { maxKm: 50, label: 'Scorching', hint: 'You are practically standing on it.' },
  { maxKm: 250, label: 'Hot', hint: 'Same neighbourhood of the map.' },
  { maxKm: 1000, label: 'Warm', hint: 'Right region, keep narrowing.' },
  { maxKm: 2500, label: 'Cool', hint: 'In the general direction.' },
  { maxKm: 5000, label: 'Cold', hint: 'Wrong region entirely.' },
  { maxKm: Infinity, label: 'Freezing', hint: 'Probably the wrong continent.' },
] as const

/**
 * Guess-map tiles. The vector world map (Natural Earth, public domain) is always drawn
 * and works offline. When "Detailed map" is on, OpenStreetMap tiles are drawn on top,
 * shown in greyscale to fit the brand. Swap the URL here to change provider later
 * (e.g. before an App Store release, where a dedicated tile host is the polite choice).
 */
export const TILES = {
  url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
  maxZoom: 18,
  minZoomForTiles: 0,
}

/** Mapillary key can come from the build (optional) or from Settings on the device. */
export const BUILD_MAPILLARY_TOKEN: string = (import.meta.env.VITE_MAPILLARY_TOKEN as string | undefined) ?? ''

export const STORAGE_KEYS = {
  profile: 'located.profile.v1',
  settings: 'located.settings.v1',
  session: 'located.session.v1',
}

export const CREDITS = {
  createdBy: 'Steve R.',
  year: 2026,
}

export const asset = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`
