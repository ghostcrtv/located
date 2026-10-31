import { Minus, Plus, RotateCcw } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

/** Full-bleed photo with pinch / wheel / double-tap zoom and drag-to-pan. No rotation — it's one fixed photo. */
export function PhotoViewer({ src, alt, onError, onLoad }: { src: string; alt: string; onError?: () => void; onLoad?: () => void }) {
  const box = useRef<HTMLDivElement>(null)
  const [t, setT] = useState({ s: 1, x: 0, y: 0 })
  const [loaded, setLoaded] = useState(false)
  const ptrs = useRef(new Map<number, { x: number; y: number }>())
  const pinch = useRef<{ d: number; s: number } | null>(null)
  const lastTap = useRef(0)

  useEffect(() => { setT({ s: 1, x: 0, y: 0 }); setLoaded(false) }, [src])

  const clamp = useCallback((s: number, x: number, y: number) => {
    const r = box.current?.getBoundingClientRect()
    const w = r?.width ?? 0, h = r?.height ?? 0
    const mx = ((s - 1) * w) / 2, my = ((s - 1) * h) / 2
    s = Math.max(1, Math.min(5, s))
    return { s, x: s === 1 ? 0 : Math.max(-mx, Math.min(mx, x)), y: s === 1 ? 0 : Math.max(-my, Math.min(my, y)) }
  }, [])

  const zoomAt = useCallback((factor: number, cx?: number, cy?: number) => {
    setT((p) => {
      const r = box.current!.getBoundingClientRect()
      const ox = (cx ?? r.left + r.width / 2) - (r.left + r.width / 2)
      const oy = (cy ?? r.top + r.height / 2) - (r.top + r.height / 2)
      const s = Math.max(1, Math.min(5, p.s * factor))
      const k = s / p.s
      return clamp(s, ox - (ox - p.x) * k, oy - (oy - p.y) * k)
    })
  }, [clamp])

  const onWheel = (e: React.WheelEvent) => { zoomAt(e.deltaY < 0 ? 1.18 : 1 / 1.18, e.clientX, e.clientY) }
  const onDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId)
    ptrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (ptrs.current.size === 2) {
      const [a, b] = [...ptrs.current.values()]
      pinch.current = { d: Math.hypot(a.x - b.x, a.y - b.y), s: t.s }
    } else if (e.pointerType !== 'mouse' || e.button === 0) {
      const now = Date.now()
      if (now - lastTap.current < 280) { t.s > 1 ? setT({ s: 1, x: 0, y: 0 }) : zoomAt(2.5, e.clientX, e.clientY); lastTap.current = 0 }
      else lastTap.current = now
    }
  }
  const onMove = (e: React.PointerEvent) => {
    const prev = ptrs.current.get(e.pointerId)
    if (!prev) return
    const cur = { x: e.clientX, y: e.clientY }
    ptrs.current.set(e.pointerId, cur)
    if (ptrs.current.size === 2 && pinch.current) {
      const [a, b] = [...ptrs.current.values()]
      const d = Math.hypot(a.x - b.x, a.y - b.y)
      setT((p) => clamp(pinch.current!.s * (d / pinch.current!.d), p.x, p.y))
    } else if (ptrs.current.size === 1) {
      setT((p) => (p.s > 1 ? clamp(p.s, p.x + cur.x - prev.x, p.y + cur.y - prev.y) : p))
    }
  }
  const onUp = (e: React.PointerEvent) => {
    ptrs.current.delete(e.pointerId)
    if (ptrs.current.size < 2) pinch.current = null
  }

  return (
    <div className={`photo ${loaded ? 'is-loaded' : ''}`}>
      <div className="photo__backdrop" style={{ backgroundImage: `url("${src}")` }} aria-hidden />
      <div
        ref={box}
        className="photo__box"
        onWheel={onWheel}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        style={{ cursor: t.s > 1 ? 'grab' : 'zoom-in' }}
      >
        <img
          src={src}
          alt={alt}
          draggable={false}
          onLoad={() => { setLoaded(true); onLoad?.() }}
          onError={() => onError?.()}
          style={{ transform: `translate3d(${t.x}px, ${t.y}px, 0) scale(${t.s})` }}
        />
      </div>
      <div className="photo__zoom" role="group" aria-label="Zoom">
        <button type="button" onClick={() => zoomAt(1.5)} aria-label="Zoom in"><Plus size={18} /></button>
        <button type="button" onClick={() => zoomAt(1 / 1.5)} aria-label="Zoom out" disabled={t.s <= 1}><Minus size={18} /></button>
        <button type="button" onClick={() => setT({ s: 1, x: 0, y: 0 })} aria-label="Reset zoom" disabled={t.s <= 1}><RotateCcw size={16} /></button>
      </div>
    </div>
  )
}
