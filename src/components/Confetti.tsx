import { useMemo } from 'react'

/** Tiny confetti burst in brand colours. Skipped entirely with reduced motion. */
export function Confetti({ count = 36, reduced }: { count?: number; reduced?: boolean }) {
  const bits = useMemo(() => Array.from({ length: count }, (_, i) => ({
    left: 50 + (Math.random() - 0.5) * 30,
    dx: (Math.random() - 0.5) * 560,
    dy: -(160 + Math.random() * 260),
    r: Math.random() * 720 - 360,
    d: 900 + Math.random() * 700,
    c: ['#C7FF00', '#111111', '#FFFFFF', '#C7FF00'][i % 4],
    w: 6 + Math.random() * 6,
  })), [count])
  if (reduced) return null
  return (
    <div className="confetti" aria-hidden>
      {bits.map((b, i) => (
        <i key={i} style={{
          left: `${b.left}%`, background: b.c, width: b.w, height: b.w * 0.45,
          ['--dx' as string]: `${b.dx}px`, ['--dy' as string]: `${b.dy}px`, ['--r' as string]: `${b.r}deg`, animationDuration: `${b.d}ms`,
        }} />
      ))}
    </div>
  )
}
