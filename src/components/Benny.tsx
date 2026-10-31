import { asset } from '../config'
import type { Expression } from '../data/dialogue'

/**
 * Benny artwork comes straight from the approved LOCATED. mascot sheet (cut out, not redrawn).
 * To upgrade later, drop higher-resolution files with the same names into public/benny/.
 */
const FILE: Record<Expression, string> = {
  happy: 'happy', curious: 'curious', thinking: 'thinking', surprised: 'surprised', skeptical: 'skeptical',
  excited: 'excited', proud: 'proud', confused: 'curious', celebration: 'celebration', sleepy: 'sleepy',
  explorer: 'explorer', maphelper: 'maphelper', travel: 'travel', lookaround: 'lookaround', hero: 'hero',
}

const MARK: Partial<Record<Expression, 'q' | 'bang' | 'spark' | 'zz'>> = {
  confused: 'q', curious: 'q', surprised: 'bang', excited: 'spark', celebration: 'spark', proud: 'spark', happy: 'spark', sleepy: 'zz',
}

export function Benny({ expr = 'happy', size = 120, className = '', alt, marks = true }: {
  expr?: Expression; size?: number; className?: string; alt?: string; marks?: boolean
}) {
  const mark = marks ? MARK[expr] : undefined
  return (
    <span className={`benny benny--${expr} ${className}`} style={{ width: size, height: size }}>
      <img src={asset(`benny/${FILE[expr]}.webp`)} alt={alt ?? `Benny looking ${expr}`} draggable={false} />
      {mark === 'q' && <svg className="benny__mark benny__mark--q" viewBox="0 0 24 32" aria-hidden><text x="2" y="26" fontSize="28" fontWeight="900">?</text></svg>}
      {mark === 'bang' && <svg className="benny__mark benny__mark--bang" viewBox="0 0 30 32" aria-hidden><text x="0" y="26" fontSize="28" fontWeight="900">!!</text></svg>}
      {mark === 'spark' && (
        <svg className="benny__mark benny__mark--spark" viewBox="0 0 40 40" aria-hidden>
          <path d="M6 14 L14 18" /><path d="M10 4 L16 13" /><path d="M22 2 L21 11" />
        </svg>
      )}
      {mark === 'zz' && <svg className="benny__mark benny__mark--zz" viewBox="0 0 40 30" aria-hidden><text x="2" y="26" fontSize="14" fontWeight="900">z</text><text x="14" y="18" fontSize="18" fontWeight="900">z</text><text x="27" y="12" fontSize="22" fontWeight="900">Z</text></svg>}
    </span>
  )
}
