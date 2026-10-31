import type { LocationEntry } from '../game/types'
import { CATALOG } from './catalog'

/**
 * The location catalog. Each entry is a real place with a real, individually checked,
 * openly licensed photo (Wikimedia Commons). Add new places in catalog.ts.
 */
export const LOCATIONS: LocationEntry[] = CATALOG.filter((l) => l.verification.status === 'verified')
export const LOC_BY_ID: Record<string, LocationEntry> = Object.fromEntries(LOCATIONS.map((l) => [l.id, l]))
