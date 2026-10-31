import { geoContains } from 'd3-geo'
import { feature, mesh } from 'topojson-client'
import type { FeatureCollection, Feature, Geometry } from 'geojson'
import { asset } from '../config'
import { BY_NUM } from '../data/countries'
import { normalize } from './geo'
import type { LatLng } from '../game/types'

export type CountryFeature = Feature<Geometry, { name: string }> & { id?: string | number }

let cache: Promise<FeatureCollection<Geometry, { name: string }>> | null = null
let topoCache: Promise<any> | null = null // eslint-disable-line @typescript-eslint/no-explicit-any

function loadTopo() {
  if (!topoCache) {
    topoCache = fetch(asset('geo/countries-50m.json')).then((r) => {
      if (!r.ok) throw new Error('borders ' + r.status)
      return r.json()
    }).catch((e) => { topoCache = null; throw e })
  }
  return topoCache
}

/** Only the lines BETWEEN countries (no coastlines, no date-line cut edges) — for drawing. */
export async function loadBorderLines(): Promise<Geometry> {
  const topo = await loadTopo()
  return mesh(topo, topo.objects.countries, (a, b) => a !== b) as unknown as Geometry
}

/** Natural Earth 1:50m country borders (public domain), bundled with the game — no network service needed. */
export function loadBorders(): Promise<FeatureCollection<Geometry, { name: string }>> {
  if (!cache) {
    cache = loadTopo()
      .then((topo) => feature(topo, topo.objects.countries) as unknown as FeatureCollection<Geometry, { name: string }>)
      .catch((e) => {
        cache = null
        throw e
      })
  }
  return cache
}

export function setBordersForTests(fc: FeatureCollection<Geometry, { name: string }>) {
  cache = Promise.resolve(fc)
}

export interface CountryHit { code: string | null; name: string }

function containing(fc: FeatureCollection<Geometry, { name: string }>, q: LatLng): CountryHit | null {
  for (const f of fc.features as CountryFeature[]) {
    if (!f.geometry) continue
    if (geoContains(f, [q.lng, q.lat])) {
      const num = String(f.id ?? '')
      return { code: BY_NUM[num]?.code ?? null, name: BY_NUM[num]?.name ?? f.properties?.name ?? 'Unknown' }
    }
  }
  return null
}

/** Coastal tolerance: border data is simplified, so a pin within this distance of a shore counts as on land. */
export const COAST_TOLERANCE_KM = 15

/**
 * Which country is this point in? Spherical test, so it's correct near the date line.
 * If the point is just offshore (within COAST_TOLERANCE_KM), the nearest coast's country counts.
 * Returns null only for genuinely open water.
 */
export function countryAtSync(fc: FeatureCollection<Geometry, { name: string }>, p: LatLng): CountryHit | null {
  const q = normalize(p)
  const direct = containing(fc, q)
  if (direct) return direct
  const latKm = 111.32
  for (const km of [4, 9, COAST_TOLERANCE_KM]) {
    for (let a = 0; a < 360; a += 30) {
      const r = (a * Math.PI) / 180
      const dLat = (km * Math.cos(r)) / latKm
      const dLng = (km * Math.sin(r)) / (latKm * Math.max(0.05, Math.cos((q.lat * Math.PI) / 180)))
      const hit = containing(fc, normalize({ lat: q.lat + dLat, lng: q.lng + dLng }))
      if (hit) return hit
    }
  }
  return null
}

export async function countryAt(p: LatLng): Promise<CountryHit | null> {
  try {
    return countryAtSync(await loadBorders(), p)
  } catch {
    return null
  }
}
