/**
 * Mapillary street-level imagery (free; images are CC BY-SA 4.0 by their contributors).
 * Uses the official Graph API (v4) to find a real image near a catalog location.
 * The client token is designed by Mapillary to be used in browsers, so it is fine for it
 * to live on the player's device. Nothing here costs money.
 */
export interface StreetHit { id: string; lat: number; lng: number; isPano: boolean }

const GRAPH = 'https://graph.mapillary.com/images'

type Img = { id: string; is_pano?: boolean; computed_geometry?: { coordinates: [number, number] }; geometry?: { coordinates: [number, number] } }

export async function findStreetImage(token: string, lat: number, lng: number, signal?: AbortSignal): Promise<StreetHit | null> {
  // Search outward in small boxes (the API limits box size). Panoramas preferred — they let you look all around.
  for (const d of [0.0025, 0.008, 0.025]) {
    const bbox = [lng - d, lat - d, lng + d, lat + d].map((v) => v.toFixed(6)).join(',')
    const url = `${GRAPH}?access_token=${encodeURIComponent(token)}&fields=id,is_pano,computed_geometry,geometry&bbox=${bbox}&limit=60`
    const res = await fetch(url, { signal })
    if (res.status === 401 || res.status === 403) throw new Error('mapillary-auth')
    if (!res.ok) continue
    const body = (await res.json()) as { data?: Img[] }
    const imgs = (body.data ?? [])
      .map((i) => {
        const c = i.computed_geometry?.coordinates ?? i.geometry?.coordinates
        return c ? { id: String(i.id), lng: c[0], lat: c[1], isPano: !!i.is_pano } : null
      })
      .filter((x): x is StreetHit => !!x && Number.isFinite(x.lat) && Number.isFinite(x.lng))
    if (!imgs.length) continue
    const dist = (h: StreetHit) => (h.lat - lat) ** 2 + (h.lng - lng) ** 2
    const panos = imgs.filter((i) => i.isPano)
    const pool = panos.length ? panos : imgs
    pool.sort((a, b) => dist(a) - dist(b))
    return pool[0]
  }
  return null
}

/** Quick check from Settings: does this key work? */
export async function testToken(token: string): Promise<'ok' | 'invalid' | 'network'> {
  if (!/^MLY\|/.test(token.trim())) return 'invalid'
  try {
    // A tiny box in central Stockholm, which has dense Mapillary coverage.
    const url = `${GRAPH}?access_token=${encodeURIComponent(token.trim())}&fields=id&bbox=18.068,59.329,18.072,59.331&limit=1`
    const res = await fetch(url)
    if (res.status === 401 || res.status === 403 || res.status === 400) return 'invalid'
    return res.ok ? 'ok' : 'network'
  } catch {
    return 'network'
  }
}
