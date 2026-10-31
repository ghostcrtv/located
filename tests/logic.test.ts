import { readFileSync } from 'node:fs'
import { feature } from 'topojson-client'
import { beforeAll, describe, expect, it } from 'vitest'
import { ACHIEVEMENTS } from '../src/data/achievements'
import { COUNTRIES } from '../src/data/countries'
import { LINES, bennys, pickLine } from '../src/data/dialogue'
import { cluesUsed, cornersOptions, proximityProbe } from '../src/game/clues'
import { advance, applyClue, createSession, currentRound, endSession, isFinalRound, replaceRoundLocation, sessionStats, setRoundImagery, submitGuess } from '../src/game/engine'
import { applyRound, awardAchievements, recordGame } from '../src/game/progress'
import { pickNext } from '../src/game/selection'
import type { LocationEntry, Session } from '../src/game/types'
import { countryAtSync } from '../src/lib/borders'
import { formatDistance, haversineKm, nearestCopy, normalizeLng } from '../src/lib/geo'
import { baseScore, maxAvailable, roundScore, safeAdd, tierFor } from '../src/lib/scoring'
import { defaultProfile, defaultSettings, sanitizeProfile, sanitizeSession, sanitizeSettings } from '../src/lib/storage'

// --- deterministic RNG for repeatable tests ---
function rng(seed = 42) {
  let s = seed >>> 0
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 2 ** 32 }
}

// --- small test catalog (test-only fixtures, real coordinates) ---
const mk = (id: string, cc: string, lat: number, lng: number, decoys: [string, string, string]): LocationEntry => ({
  id, countryCode: cc, lat, lng, place: id, decode: 'riddle', decoys,
  photo: { file: `${id}.jpg`, width: 1600, height: 1067, credit: { author: 'x', license: 'CC BY 4.0', licenseUrl: '', sourceUrl: '' } },
  modes: ['worldtour', 'oneshot', 'endless'], verification: { status: 'verified', checked: '2026-10-30' },
})
const CAT: LocationEntry[] = [
  mk('a', 'JP', 35.0, 135.78, ['KR', 'CN', 'TW']), mk('b', 'NO', 67.93, 13.09, ['IS', 'SE', 'FI']),
  mk('c', 'PE', -13.52, -71.97, ['BO', 'EC', 'CL']), mk('d', 'MA', 35.17, -5.26, ['TN', 'DZ', 'ES']),
  mk('e', 'AU', -25.34, 131.04, ['NA', 'ZA', 'US']), mk('f', 'US', 36.99, -110.1, ['MX', 'AU', 'CA']),
  mk('g', 'IT', 41.89, 12.47, ['ES', 'GR', 'PT']), mk('h', 'VN', 21.03, 105.85, ['TH', 'LA', 'KH']),
  mk('i', 'FJ', -17.7, 178.0, ['PG', 'NZ', 'AU']), mk('j', 'NZ', -44.67, 167.93, ['NO', 'CL', 'CA']),
]

describe('distance (Haversine)', () => {
  it('is zero for the same point', () => expect(haversineKm({ lat: 10, lng: 20 }, { lat: 10, lng: 20 })).toBe(0))
  it('London → Paris ≈ 344 km', () => {
    expect(haversineKm({ lat: 51.5074, lng: -0.1278 }, { lat: 48.8566, lng: 2.3522 })).toBeCloseTo(343.6, 0)
  })
  it('New York → Los Angeles ≈ 3936 km', () => {
    expect(haversineKm({ lat: 40.7128, lng: -74.006 }, { lat: 34.0522, lng: -118.2437 })).toBeGreaterThan(3925)
    expect(haversineKm({ lat: 40.7128, lng: -74.006 }, { lat: 34.0522, lng: -118.2437 })).toBeLessThan(3945)
  })
  it('crosses the date line the short way', () => {
    // 179.5°E to 179.5°W at the equator is ~111 km, not ~40,000 km
    expect(haversineKm({ lat: 0, lng: 179.5 }, { lat: 0, lng: -179.5 })).toBeCloseTo(111.2, 0)
  })
  it('handles map clicks on wrapped world copies', () => {
    expect(normalizeLng(190)).toBeCloseTo(-170)
    expect(normalizeLng(-190)).toBeCloseTo(170)
    expect(normalizeLng(540)).toBeCloseTo(-180 + 0 === -180 ? 180 : 180)
    expect(haversineKm({ lat: 0, lng: 370 }, { lat: 0, lng: 10 })).toBeCloseTo(0, 5)
  })
  it('antipodes ≈ half the circumference', () => {
    expect(haversineKm({ lat: 0, lng: 0 }, { lat: 0, lng: 180 })).toBeCloseTo(20015, -1)
  })
  it('draws lines to the nearest copy', () => {
    expect(nearestCopy({ lat: 0, lng: 179 }, { lat: 0, lng: -179 }).lng).toBe(181)
  })
  it('formats distances in miles and km', () => {
    expect(formatDistance(1609.344, 'mi')).toBe('1,000 mi')
    expect(formatDistance(5, 'km')).toBe('5.0 km')
    expect(formatDistance(0.5, 'km')).toBe('500 m')
  })
})

describe('scoring', () => {
  it('perfect guess = 5000', () => expect(roundScore(0, 0)).toBe(5000))
  it('follows 5000·e^(−d/1500)', () => {
    expect(baseScore(1500)).toBe(Math.round(5000 / Math.E))
    expect(baseScore(300)).toBe(Math.round(5000 * Math.exp(-0.2)))
  })
  it('subtracts 500 per clue', () => {
    expect(roundScore(0, 1)).toBe(4500)
    expect(roundScore(0, 3)).toBe(3500)
  })
  it('never goes negative', () => {
    expect(roundScore(20000, 3)).toBe(0)
    expect(roundScore(Infinity, 0)).toBe(0)
    expect(roundScore(NaN, 0)).toBe(0)
    expect(roundScore(-5, 0)).toBe(0)
  })
  it('never exceeds 5000', () => expect(roundScore(0, -3)).toBe(5000))
  it('max available tracks clues', () => expect(maxAvailable(2)).toBe(4000))
  it('tiers', () => {
    expect(tierFor(5000).id).toBe('incredible')
    expect(tierFor(4200).id).toBe('target')
    expect(tierFor(10).id).toBe('far')
  })
  it('safe add for endless totals', () => {
    expect(safeAdd(Number.MAX_SAFE_INTEGER, 5000)).toBe(Number.MAX_SAFE_INTEGER)
    expect(safeAdd(NaN, 10)).toBe(10)
  })
})

describe('selection', () => {
  it('never repeats a location in a session, and spreads continents', () => {
    const r = rng(7)
    const used: string[] = []
    for (let i = 0; i < CAT.length; i++) {
      const n = pickNext(CAT, 'worldtour', used, [], r)!
      expect(used).not.toContain(n.id)
      used.push(n.id)
    }
    expect(pickNext(CAT, 'worldtour', used, [], r)).toBeNull()
    // first 6 picks should hit 6 different continents (catalog has all six)
    const conts = used.slice(0, 6).map((id) => COUNTRIES[CAT.find((l) => l.id === id)!.countryCode].continent)
    expect(new Set(conts).size).toBe(6)
  })
  it('respects supported modes', () => {
    const only = [{ ...CAT[0], modes: ['oneshot'] as LocationEntry['modes'] }]
    expect(pickNext(only, 'worldtour', [], [], rng())).toBeNull()
    expect(pickNext(only, 'oneshot', [], [], rng())?.id).toBe('a')
  })
})

describe('clues', () => {
  it('Four Corners has 4 unique options including the answer', () => {
    for (const loc of CAT) {
      const o = cornersOptions(loc, rng(3))
      expect(o).toHaveLength(4)
      expect(new Set(o).size).toBe(4)
      expect(o).toContain(loc.countryCode)
    }
  })
  it('Four Corners fills in if decoys are bad', () => {
    const o = cornersOptions({ ...CAT[0], decoys: ['JP', 'ZZ', 'JP'] }, rng(1))
    expect(o).toHaveLength(4)
    expect(o).toContain('JP')
  })
  it('Proximity returns a band, never a distance', () => {
    expect(proximityProbe({ lat: 35.01, lng: 135.79 }, { lat: 35, lng: 135.78 })).toBe(0)
    expect(proximityProbe({ lat: 0, lng: 0 }, { lat: 35, lng: 135.78 })).toBe(5)
  })
  it('each clue costs 500, once, and only once per round', () => {
    let s = createSession('worldtour', CAT, [], rng(1))!
    const loc = CAT.find((l) => l.id === currentRound(s).locationId)!
    s = applyClue(s, 'decode', loc, rng())
    s = applyClue(s, 'decode', loc, rng()) // second use ignored
    s = applyClue(s, 'corners', loc, rng())
    s = applyClue(s, 'corners', loc, rng(), { pick: loc.countryCode })
    s = applyClue(s, 'corners', loc, rng(), { pick: 'XX' }) // can't re-pick
    expect(currentRound(s).clues.corners?.correct).toBe(true)
    s = applyClue(s, 'proximity', loc, rng(), { test: { lat: 0, lng: 0 } })
    s = applyClue(s, 'proximity', loc, rng(), { test: { lat: 1, lng: 1 } })
    expect(currentRound(s).clues.proximity?.lat).toBe(0)
    expect(cluesUsed(currentRound(s))).toBe(3)
    s = submitGuess(s, loc, loc.countryCode, loc.countryCode)
    expect(currentRound(s).score).toBe(3500)
  })
  it('the proximity test pin does not become the guess', () => {
    let s = createSession('oneshot', CAT, [], rng(2))!
    const loc = CAT.find((l) => l.id === currentRound(s).locationId)!
    s = applyClue(s, 'proximity', loc, rng(), { test: { lat: loc.lat, lng: loc.lng } })
    expect(currentRound(s).guess).toBeUndefined()
    expect(currentRound(s).score).toBeUndefined()
  })
})

describe('five-round progression', () => {
  it('plays exactly five rounds then completes', () => {
    const r = rng(11)
    let s = createSession('worldtour', CAT, [], r)!
    for (let i = 0; i < 5; i++) {
      const loc = CAT.find((l) => l.id === currentRound(s).locationId)!
      expect(s.phase).toBe('playing')
      s = submitGuess(s, { lat: loc.lat + 1, lng: loc.lng }, loc.countryCode, loc.countryCode)
      expect(s.phase).toBe('reveal')
      // can't double-submit
      expect(submitGuess(s, { lat: 0, lng: 0 }, null, loc.countryCode)).toBe(s)
      expect(isFinalRound(s)).toBe(i === 4)
      s = advance(s, CAT, [], r)
    }
    expect(s.phase).toBe('complete')
    expect(s.rounds).toHaveLength(5)
    expect(new Set(s.rounds.map((x) => x.locationId)).size).toBe(5)
    const st = sessionStats(s)
    expect(st.total).toBeGreaterThan(0)
    expect(st.total).toBeLessThanOrEqual(25000)
  })
})

describe('endless progression', () => {
  it('keeps going past five and stops when the catalog runs out', () => {
    const r = rng(5)
    let s = createSession('endless', CAT, [], r)!
    let rounds = 0
    while (s.phase !== 'complete' && rounds < 100) {
      const loc = CAT.find((l) => l.id === currentRound(s).locationId)!
      s = submitGuess(s, loc, loc.countryCode, loc.countryCode)
      s = advance(s, CAT, [], r)
      rounds++
    }
    expect(rounds).toBe(CAT.length)
    expect(s.exhausted).toBe(true)
    expect(sessionStats(s).total).toBe(5000 * CAT.length)
  })
  it('ending mid-round drops the unfinished round', () => {
    const r = rng(9)
    let s = createSession('endless', CAT, [], r)!
    const loc = CAT.find((l) => l.id === currentRound(s).locationId)!
    s = submitGuess(s, loc, loc.countryCode, loc.countryCode)
    s = advance(s, CAT, [], r)
    expect(s.rounds).toHaveLength(2)
    s = endSession(s)
    expect(s.rounds).toHaveLength(1)
    expect(s.phase).toBe('complete')
  })
})

describe('missing imagery fallback', () => {
  it('can swap a failed location for another (before any clue is used)', () => {
    let s = createSession('worldtour', CAT, [], rng(4))!
    const other = CAT.find((l) => l.id !== currentRound(s).locationId)!
    s = replaceRoundLocation(s, other)
    expect(currentRound(s).locationId).toBe(other.id)
  })
  it('street imagery swaps the answer to the real image position', () => {
    let s = createSession('worldtour', CAT, [], rng(4), 'street')!
    s = setRoundImagery(s, { kind: 'street', provider: 'mapillary', imageId: '123', isPano: true }, { lat: 1, lng: 361 })
    expect(currentRound(s).answer).toEqual({ lat: 1, lng: 1 })
  })
})

describe('passport borders', () => {
  let fc: ReturnType<typeof feature>
  beforeAll(() => {
    const topo = JSON.parse(readFileSync('public/geo/countries-50m.json', 'utf8'))
    fc = feature(topo, topo.objects.countries)
  })
  it('finds the right country for points inside it', () => {
    const f = fc as never
    expect(countryAtSync(f, { lat: 48.8566, lng: 2.3522 })?.code).toBe('FR')
    expect(countryAtSync(f, { lat: 35.68, lng: 139.69 })?.code).toBe('JP')
    expect(countryAtSync(f, { lat: -33.87, lng: 151.21 })?.code).toBe('AU')
    expect(countryAtSync(f, { lat: 40.71, lng: -74.0 })?.code).toBe('US')
    expect(countryAtSync(f, { lat: -17.75, lng: 178.0 })?.code).toBe('FJ') // Fiji straddles the date line
  })
  it('returns null in the middle of the ocean', () => {
    expect(countryAtSync(fc as never, { lat: 0, lng: -140 })).toBeNull()
  })
})

describe('records, passport & achievements', () => {
  function playGame(seed: number, perfect: boolean) {
    const r = rng(seed)
    let s = createSession('worldtour', CAT, [], r)!
    let p = defaultProfile()
    for (let i = 0; i < 5; i++) {
      const loc = CAT.find((l) => l.id === currentRound(s).locationId)!
      const g = perfect ? loc : { lat: -loc.lat, lng: loc.lng + 170 }
      s = submitGuess(s, g, perfect ? loc.countryCode : null, loc.countryCode)
      const res = applyRound(p, s, currentRound(s), loc.countryCode)
      p = res.profile
      s = { ...s, rounds: [...s.rounds.slice(0, -1), res.round] }
      // applying twice never double-counts (refresh safety)
      expect(applyRound(p, s, currentRound(s), loc.countryCode).profile).toBe(p)
      s = advance(s, CAT, p.recent, r)
    }
    return { s, p }
  }
  it('stamps only on correct identification; achievements awarded once', () => {
    const { s, p } = playGame(21, true)
    expect(Object.keys(p.passport)).toHaveLength(5)
    expect(p.achievements['first-stamp']).toBeTruthy()
    expect(p.achievements['no-help']).toBeTruthy()
    expect(p.achievements['bullseye']).toBeTruthy()
    const rec = recordGame(p, s)
    expect(rec.session.personalBest).toBe(true)
    expect(rec.profile.records.worldtour[0].score).toBe(25000)
    expect(rec.profile.achievements['five-for-five']).toBeTruthy()
    expect(rec.profile.achievements['pure-instinct']).toBeTruthy()
    expect(rec.profile.achievements['big-tour']).toBeTruthy()
    expect(rec.profile.achievements['bennys-favorite']).toBeTruthy()
    // recording again does nothing
    const again = recordGame(rec.profile, rec.session)
    expect(again.profile.records.worldtour).toHaveLength(1)
  })
  it('bad guesses earn no stamps but can earn the weird ones', () => {
    const { p } = playGame(22, false)
    expect(Object.keys(p.passport)).toHaveLength(0)
    expect(p.achievements['wet-paws']).toBeTruthy()
  })
  it('a correct Four Corners pick also earns the stamp', () => {
    let s = createSession('oneshot', CAT, [], rng(8))!
    const loc = CAT.find((l) => l.id === currentRound(s).locationId)!
    s = applyClue(s, 'corners', loc, rng())
    s = applyClue(s, 'corners', loc, rng(), { pick: loc.countryCode })
    s = submitGuess(s, { lat: 0, lng: -140 }, null, loc.countryCode)
    const { profile } = applyRound(defaultProfile(), s, currentRound(s), loc.countryCode)
    expect(profile.passport[loc.countryCode]).toBeTruthy()
  })
  it('keeps only the top 10 records', () => {
    let p = defaultProfile()
    for (let i = 0; i < 14; i++) {
      const s: Session = { ...createSession('oneshot', CAT, [], rng(i))!, phase: 'complete' }
      s.rounds[0] = { ...s.rounds[0], score: 100 * i, distanceKm: 1 }
      p = recordGame(p, s).profile
    }
    expect(p.records.oneshot).toHaveLength(10)
    expect(p.records.oneshot[0].score).toBe(1300)
  })
  it('boop achievement is data-driven', () => {
    const r = awardAchievements({ profile: defaultProfile(), mode: 'worldtour', boops: 10 })
    expect(r.earned).toContain('boop')
  })
  it('every achievement has a known rule type', () => {
    for (const a of ACHIEVEMENTS) expect(a.rule.type).toBeTruthy()
  })
})

describe('saved data', () => {
  it('survives garbage', () => {
    expect(sanitizeProfile('nope')).toEqual(defaultProfile())
    expect(sanitizeProfile({ v: 2 })).toEqual(defaultProfile())
    expect(sanitizeSettings(null)).toEqual(defaultSettings())
    expect(sanitizeSettings({ units: 'furlongs', sound: 'yes' })).toEqual(defaultSettings())
  })
  it('cleans bad values inside an otherwise valid profile', () => {
    const p = sanitizeProfile({ v: 1, roundsPlayed: -4, passport: { JP: { first: 'x', found: 2 }, bad: {} }, records: { worldtour: [{ score: 'lots' }, { score: 100, date: 'd' }] } })
    expect(p.roundsPlayed).toBe(0)
    expect(Object.keys(p.passport)).toEqual(['JP'])
    expect(p.records.worldtour).toHaveLength(1)
  })
  it('restores a valid saved game and rejects stale ones', () => {
    const known = new Set(CAT.map((l) => l.id))
    const s = createSession('worldtour', CAT, [], rng(1))!
    const roundTrip = JSON.parse(JSON.stringify(s))
    expect(sanitizeSession(roundTrip, known)).toEqual(s)
    expect(sanitizeSession({ ...roundTrip, rounds: [{ ...roundTrip.rounds[0], locationId: 'gone' }] }, known)).toBeNull()
    expect(sanitizeSession({ ...roundTrip, rounds: [roundTrip.rounds[0], roundTrip.rounds[0]] }, known)).toBeNull()
    expect(sanitizeSession({ ...roundTrip, rounds: [{ ...roundTrip.rounds[0], score: 99999 }] }, known)).toBeNull()
    expect(sanitizeSession('{', known)).toBeNull()
  })
  it('settings keep valid choices', () => {
    expect(sanitizeSettings({ v: 1, units: 'km', benny: 'quiet', sound: false, mapillaryToken: ' MLY|abc ' })).toMatchObject({ units: 'km', benny: 'quiet', sound: false, mapillaryToken: 'MLY|abc' })
  })
})

describe('Benny', () => {
  it('has at least five lines for common moments', () => {
    for (const c of ['welcome', 'returning', 'newGame', 'roundStart', 'clueCorners', 'clueDecode', 'excellent', 'good', 'average', 'poor', 'complete', 'poke'] as const)
      expect(LINES[c].length, c).toBeGreaterThanOrEqual(5)
  })
  it('does not repeat the same line back-to-back', () => {
    let last = ''
    for (let i = 0; i < 50; i++) { const l = pickLine('poke'); expect(l).not.toBe(last); last = l }
  })
  it('measures in Bennys', () => {
    expect(bennys(0.3)).toBe('1.0 thousand Bennys')
    expect(bennys(3000)).toMatch(/million Bennys/)
  })
})
