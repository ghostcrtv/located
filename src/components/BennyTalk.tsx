import { useApp } from '../app/AppContext'
import { Benny } from './Benny'

/** Benny + his speech bubble. Tap him for a random thought. */
export function BennyTalk({ size = 84, className = '', side = 'right' }: { size?: number; className?: string; side?: 'right' | 'left' | 'top' }) {
  const { benny, bennyMood, boop, dismissBenny, settings } = useApp()
  return (
    <div className={`btalk btalk--${side} ${className}`}>
      <button type="button" className="btalk__dog" onClick={boop} aria-label="Boop Benny">
        <Benny expr={benny?.expr ?? bennyMood} size={size} key={benny?.id ?? bennyMood} />
      </button>
      {benny && settings.benny !== 'off' && (
        <button type="button" key={benny.id} className="bubble" onClick={dismissBenny} aria-live="polite">
          {benny.text}
        </button>
      )}
    </div>
  )
}
