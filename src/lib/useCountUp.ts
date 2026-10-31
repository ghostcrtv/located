import { useEffect, useRef, useState } from 'react'

/** Short, skippable number count-up. Instant when reduced motion is on. */
export function useCountUp(target: number, ms = 900, reduced = false) {
  const [v, setV] = useState(reduced ? target : 0)
  const raf = useRef(0)
  const skip = useRef(false)
  useEffect(() => {
    if (reduced || skip.current) { setV(target); return }
    const t0 = performance.now()
    const from = 0
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / ms)
      const e = 1 - Math.pow(1 - k, 3)
      setV(Math.round(from + (target - from) * e))
      if (k < 1) raf.current = requestAnimationFrame(step)
    }
    raf.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf.current)
  }, [target, ms, reduced])
  const finish = () => { skip.current = true; cancelAnimationFrame(raf.current); setV(target) }
  return [v, finish] as const
}
