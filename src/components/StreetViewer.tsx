import { useEffect, useRef, useState } from 'react'

/**
 * Real street-level imagery through the official MapillaryJS viewer.
 * The (large) library is only downloaded when a street round actually starts.
 * Movement follows Mapillary's own connections between photos — where there are none,
 * we say so instead of pretending.
 */
export function StreetViewer({ token, imageId, onFail, onEndOfRoad }: {
  token: string
  imageId: string
  onFail: () => void
  onEndOfRoad: () => void
}) {
  const el = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)
  const cb = useRef({ onFail, onEndOfRoad })
  cb.current = { onFail, onEndOfRoad }

  useEffect(() => {
    let viewer: { remove: () => void; on: (e: string, f: (ev: unknown) => void) => void; moveTo: (id: string) => Promise<unknown> } | null = null
    let dead = false
    let edgeTimer: number | undefined
    const edges = { seq: -1, spa: -1 }
    ;(async () => {
      try {
        const [mod] = await Promise.all([import('mapillary-js'), import('mapillary-js/dist/mapillary.css')])
        if (dead || !el.current) return
        const V = (mod as unknown as { Viewer: new (o: unknown) => typeof viewer }).Viewer
        viewer = new V({
          accessToken: token,
          container: el.current,
          imageId,
          component: { cover: false, bearing: false, attribution: true, direction: true, sequence: { visible: true }, zoom: true, keyboard: true },
        })
        viewer!.on('image', () => {
          setReady(true)
          edges.seq = -1; edges.spa = -1
          window.clearTimeout(edgeTimer)
          edgeTimer = window.setTimeout(() => { if (edges.seq === 0 && edges.spa === 0) cb.current.onEndOfRoad() }, 1800)
        })
        viewer!.on('sequenceedges', (ev) => { edges.seq = (ev as { status?: { edges?: unknown[] } }).status?.edges?.length ?? 0 })
        viewer!.on('spatialedges', (ev) => { edges.spa = (ev as { status?: { edges?: unknown[] } }).status?.edges?.length ?? 0 })
        viewer!.moveTo(imageId).catch(() => { if (!dead) cb.current.onFail() })
      } catch {
        if (!dead) cb.current.onFail()
      }
    })()
    const failTimer = window.setTimeout(() => { if (!dead && !el.current?.querySelector('canvas')) cb.current.onFail() }, 15000)
    return () => {
      dead = true
      window.clearTimeout(failTimer)
      window.clearTimeout(edgeTimer)
      try { viewer?.remove() } catch { /* ignore */ }
    }
  }, [token, imageId])

  return (
    <div className={`street ${ready ? 'is-ready' : ''}`}>
      <div ref={el} className="street__viewer" />
    </div>
  )
}
