import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect, useRef } from 'react'
import { TILES } from '../config'
import { loadBorderLines, loadBorders } from '../lib/borders'
import { nearestCopy } from '../lib/geo'
import type { LatLng } from '../game/types'

export interface Pair { guess?: LatLng; answer: LatLng; label?: string }

interface Props {
  mode: 'guess' | 'probe' | 'view'
  guess?: LatLng
  probe?: LatLng
  onGuess?: (p: LatLng) => void
  onProbe?: (p: LatLng) => void
  pairs?: Pair[]
  tiles: boolean
  className?: string
  /** Changing this re-fits the view (new round, results). */
  fitKey?: string
  reducedMotion?: boolean
}

/** Make each ring/line continuous in longitude (no 360° jumps), so shapes crossing the date line draw cleanly. */
function unwrap<T>(geo: T): T {
  const fixLine = (pts: number[][]) => {
    const out = pts.map((p) => p.slice())
    for (let i = 1; i < out.length; i++) {
      while (out[i][0] - out[i - 1][0] > 180) out[i][0] -= 360
      while (out[i][0] - out[i - 1][0] < -180) out[i][0] += 360
    }
    return out
  }
  const fixGeom = (g: { type: string; coordinates: unknown } | null): unknown => {
    if (!g) return g
    switch (g.type) {
      case 'LineString': return { ...g, coordinates: fixLine(g.coordinates as number[][]) }
      case 'MultiLineString': case 'Polygon': return { ...g, coordinates: (g.coordinates as number[][][]).map(fixLine) }
      case 'MultiPolygon': return { ...g, coordinates: (g.coordinates as number[][][][]).map((poly) => poly.map(fixLine)) }
      default: return g
    }
  }
  const any = geo as unknown as { type: string; features?: { geometry: never }[] }
  if (any.type === 'FeatureCollection') return { ...any, features: any.features!.map((f) => ({ ...f, geometry: fixGeom(f.geometry) })) } as T
  return fixGeom(geo as never) as T
}

const pinSvg = (fill: string, dot: string) =>
  `<svg viewBox="0 0 32 44" width="32" height="44"><path d="M16 1.5C8 1.5 2 7.6 2 15.4 2 26 16 42.5 16 42.5S30 26 30 15.4C30 7.6 24 1.5 16 1.5z" fill="${fill}" stroke="#111" stroke-width="2.4"/><circle cx="16" cy="15.5" r="5.4" fill="${dot}"/></svg>`

const ICONS = {
  guess: L.divIcon({ className: 'pin pin--guess', html: pinSvg('#111', '#C7FF00'), iconSize: [32, 44], iconAnchor: [16, 43] }),
  answer: L.divIcon({ className: 'pin pin--answer', html: pinSvg('#C7FF00', '#111'), iconSize: [32, 44], iconAnchor: [16, 43] }),
  probe: L.divIcon({ className: 'pin pin--probe', html: '<span></span>', iconSize: [36, 36], iconAnchor: [18, 18] }),
  num: (n: number) => L.divIcon({ className: 'pin pin--num', html: `<span>${n}</span>`, iconSize: [24, 24], iconAnchor: [12, 12] }),
}

export function GuessMap({ mode, guess, probe, onGuess, onProbe, pairs, tiles, className = '', fitKey, reducedMotion }: Props) {
  const el = useRef<HTMLDivElement>(null)
  const map = useRef<L.Map | null>(null)
  const tileLayer = useRef<L.TileLayer | null>(null)
  const guessM = useRef<L.Marker | null>(null)
  const probeM = useRef<L.Marker | null>(null)
  const overlay = useRef<L.LayerGroup | null>(null)
  const svgR = useRef<L.Renderer | null>(null)
  const handlers = useRef({ mode, onGuess, onProbe })
  handlers.current = { mode, onGuess, onProbe }

  // Create the map once
  useEffect(() => {
    if (!el.current) return
    const m = L.map(el.current, {
      center: [20, 10], zoom: 1.5, minZoom: 1, maxZoom: TILES.maxZoom, zoomSnap: 0.25,
      worldCopyJump: true, maxBounds: [[-85, -400], [85, 400]], maxBoundsViscosity: 0.8,
      attributionControl: true, zoomControl: false, preferCanvas: true, tapTolerance: 12,
    } as L.MapOptions)
    L.control.zoom({ position: 'topright' }).addTo(m)
    m.attributionControl.setPrefix('<a href="https://leafletjs.com" target="_blank" rel="noopener">Leaflet</a>')
    map.current = m
    overlay.current = L.layerGroup().addTo(m)
    svgR.current = L.svg({ padding: 0.5 })

    const renderer = L.canvas({ padding: 0.5 })
    let alive = true
    Promise.all([loadBorders(), loadBorderLines()]).then(([rawFc, rawLines]) => {
      if (!alive) return
      const fc = unwrap(rawFc)
      const lines = unwrap(rawLines)
      for (const off of [-360, 0, 360]) {
        const opts = (style: L.PathOptions) => ({ renderer, interactive: false, coordsToLatLng: (c: number[]) => L.latLng(c[1], c[0] + off), style }) as L.GeoJSONOptions
        L.geoJSON(fc, opts({ stroke: false, fillColor: '#FFFFFF', fillOpacity: 1 })).addTo(m).bringToBack()
        L.geoJSON(lines as never, opts({ color: '#B9B9B1', weight: 0.8, fill: false })).addTo(m)
      }
      m.attributionControl.addAttribution('Borders: <a href="https://www.naturalearthdata.com" target="_blank" rel="noopener">Natural Earth</a>')
    }).catch(() => { /* map still works, just without the vector layer */ })

    m.on('click', (e: L.LeafletMouseEvent) => {
      const p = { lat: e.latlng.lat, lng: e.latlng.lng }
      if (handlers.current.mode === 'guess') handlers.current.onGuess?.(p)
      else if (handlers.current.mode === 'probe') handlers.current.onProbe?.(p)
    })

    const ro = new ResizeObserver(() => m.invalidateSize({ animate: false }))
    ro.observe(el.current)
    return () => {
      alive = false; ro.disconnect()
      try { m.stop(); m.off(); m.eachLayer((l) => { m.removeLayer(l) }); m.remove() } catch { /* already gone */ }
      map.current = null
    }
  }, [])

  // Optional detailed tiles (OpenStreetMap), shown in greyscale
  useEffect(() => {
    const m = map.current
    if (!m) return
    if (tiles && !tileLayer.current) {
      tileLayer.current = L.tileLayer(TILES.url, {
        attribution: TILES.attribution, maxZoom: TILES.maxZoom, className: 'tiles-mono',
        crossOrigin: false, referrerPolicy: 'strict-origin-when-cross-origin',
      } as L.TileLayerOptions).addTo(m)
    } else if (!tiles && tileLayer.current) {
      tileLayer.current.remove(); tileLayer.current = null
    }
  }, [tiles])

  // Guess marker (draggable to adjust)
  useEffect(() => {
    const m = map.current
    if (!m) return
    if (guess && mode !== 'view') {
      if (!guessM.current) {
        guessM.current = L.marker([guess.lat, guess.lng], { icon: ICONS.guess, draggable: true, keyboard: false, autoPan: true }).addTo(m)
        guessM.current.on('dragend', () => {
          const ll = guessM.current!.getLatLng()
          handlers.current.onGuess?.({ lat: ll.lat, lng: ll.lng })
        })
      } else guessM.current.setLatLng([guess.lat, guess.lng])
      guessM.current.dragging?.[mode === 'guess' ? 'enable' : 'disable']()
    } else if (guessM.current) { guessM.current.remove(); guessM.current = null }
  }, [guess, mode])

  // Proximity test pin
  useEffect(() => {
    const m = map.current
    if (!m) return
    if (probe && mode !== 'view') {
      if (!probeM.current) probeM.current = L.marker([probe.lat, probe.lng], { icon: ICONS.probe, interactive: false, keyboard: false }).addTo(m)
      else probeM.current.setLatLng([probe.lat, probe.lng])
    } else if (probeM.current) { probeM.current.remove(); probeM.current = null }
  }, [probe, mode])

  // Reveal pairs: answer, guess and the line between them
  useEffect(() => {
    const m = map.current
    const g = overlay.current
    if (!m || !g) return
    g.clearLayers()
    if (!pairs?.length) return
    const pts: L.LatLngExpression[] = []
    pairs.forEach((p, i) => {
      L.marker([p.answer.lat, p.answer.lng], { icon: ICONS.answer, keyboard: false, zIndexOffset: 500 }).addTo(g)
      pts.push([p.answer.lat, p.answer.lng])
      if (p.guess) {
        const gg = nearestCopy(p.answer, p.guess)
        L.polyline([[p.answer.lat, p.answer.lng], [gg.lat, gg.lng]], { color: '#111', weight: 2.5, dashArray: '6 7', className: 'reveal-line', renderer: svgR.current ?? undefined, interactive: false }).addTo(g)
        L.marker([gg.lat, gg.lng], { icon: pairs.length > 1 ? ICONS.num(i + 1) : ICONS.guess, keyboard: false }).addTo(g)
        pts.push([gg.lat, gg.lng])
      }
    })
    const b = L.latLngBounds(pts)
    m.fitBounds(b.pad(0.25), { maxZoom: 7, animate: !reducedMotion, padding: [30, 30] })
  }, [pairs, reducedMotion])

  // Reset view for a new round
  useEffect(() => {
    if (!map.current || pairs?.length) return
    map.current.setView([20, 10], map.current.getSize().x > 700 ? 2 : 1.25, { animate: false })
  }, [fitKey]) // eslint-disable-line react-hooks/exhaustive-deps

  return <div ref={el} className={`gmap gmap--${mode} ${className}`} role="application" aria-label="World map" />
}
