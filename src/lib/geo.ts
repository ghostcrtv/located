import type { LatLng } from '../game/types'

const R = 6371.0088 // mean Earth radius, km
const toRad = (d: number) => (d * Math.PI) / 180

/** Wrap any longitude into [-180, 180). Handles map clicks on "world copies" past the date line. */
export function normalizeLng(lng: number): number {
  if (!Number.isFinite(lng)) return 0
  const x = ((((lng + 180) % 360) + 360) % 360) - 180
  return x === -180 && lng > 0 ? 180 : x
}

export function clampLat(lat: number): number {
  return Math.max(-90, Math.min(90, lat))
}

export function normalize(p: LatLng): LatLng {
  return { lat: clampLat(p.lat), lng: normalizeLng(p.lng) }
}

/** Great-circle distance (Haversine). Correct across the date line and at the poles. */
export function haversineKm(a: LatLng, b: LatLng): number {
  const p = normalize(a)
  const q = normalize(b)
  const dLat = toRad(q.lat - p.lat)
  const dLng = toRad(q.lng - p.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(p.lat)) * Math.cos(toRad(q.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)))
}

/** For drawing a line between two points on a flat map: pick the copy of `b` closest to `a`. */
export function nearestCopy(a: LatLng, b: LatLng): LatLng {
  let lng = b.lng
  while (lng - a.lng > 180) lng -= 360
  while (lng - a.lng < -180) lng += 360
  return { lat: b.lat, lng }
}

export const KM_PER_MI = 1.609344

export function formatDistance(km: number, units: 'mi' | 'km'): string {
  const v = units === 'mi' ? km / KM_PER_MI : km
  const u = units === 'mi' ? 'mi' : 'km'
  if (v < 1) return `${(v * (units === 'mi' ? 5280 : 1000)).toFixed(0)} ${units === 'mi' ? 'ft' : 'm'}`
  if (v < 10) return `${v.toFixed(1)} ${u}`
  return `${Math.round(v).toLocaleString('en-US')} ${u}`
}

export function formatBandLimit(km: number, units: 'mi' | 'km'): string {
  if (units === 'km') return `${km.toLocaleString('en-US')} km`
  const mi = km / KM_PER_MI
  const nice = mi < 100 ? Math.round(mi / 5) * 5 : Math.round(mi / 50) * 50
  return `${nice.toLocaleString('en-US')} mi`
}
