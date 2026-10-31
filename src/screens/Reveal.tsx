import { ArrowRight, Flag } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useApp } from '../app/AppContext'
import { Benny } from '../components/Benny'
import { Confetti } from '../components/Confetti'
import { GuessMap } from '../components/GuessMap'
import { countryName } from '../data/countries'
import { TIER_QUIPS, bennys, pickFrom } from '../data/dialogue'
import { cluesUsed } from '../game/clues'
import type { LocationEntry, RoundState, Session } from '../game/types'
import { formatDistance } from '../lib/geo'
import { tierFor } from '../lib/scoring'
import { useCountUp } from '../lib/useCountUp'

const TIER_EXPR = { incredible: 'surprised', target: 'excited', close: 'happy', notbad: 'thinking', far: 'confused' } as const

export function Reveal({ session, round, loc, isFinal, onNext, onEnd }: {
  session: Session; round: RoundState; loc: LocationEntry; isFinal: boolean; onNext: () => void; onEnd?: () => void
}) {
  const { settings, reducedMotion } = useApp()
  const tier = tierFor(round.baseScore ?? 0)
  const [pts, finish] = useCountUp(round.score ?? 0, 1000, reducedMotion)
  const [quip] = useState(() => pickFrom(TIER_QUIPS[tier.id]))
  const pairs = useMemo(() => [{ answer: round.answer, guess: round.guess }], [round.answer, round.guess])
  const used = cluesUsed(round)
  const gc = round.guessCountry
  const guessedName = gc === null ? 'the open sea' : gc?.startsWith('~') ? gc.slice(1) : countryName(gc)
  const credit = loc.photo.credit
  const big = tier.id === 'incredible' || tier.id === 'target'

  return (
    <div className="reveal" role="dialog" aria-label="Round result">
      <div className="reveal__map">
        <GuessMap mode="view" pairs={pairs} tiles={settings.mapDetail} reducedMotion={reducedMotion} />
      </div>
      <div className="reveal__card" onClick={finish}>
        {big && <Confetti reduced={reducedMotion} />}
        <div className="reveal__top">
          <div>
            <span className="eyebrow">ROUND {session.rounds.length}{session.mode !== 'endless' ? ' / 5' : ''}</span>
            <h2 className={`tier tier--${tier.id}`}>{tier.label}</h2>
            <p className="tier__quip">{quip}</p>
          </div>
          <Benny expr={TIER_EXPR[tier.id]} size={96} className="reveal__benny" />
        </div>

        <div className="reveal__nums">
          <div className="num">
            <span className="num__v">{pts.toLocaleString('en-US')}</span>
            <span className="num__l">POINTS{used ? ` · ${used} CLUE${used > 1 ? 'S' : ''} (−${(used * 500).toLocaleString('en-US')})` : ''}</span>
          </div>
          <div className="num">
            <span className="num__v num__v--sm">{formatDistance(round.distanceKm ?? 0, settings.units)}</span>
            <span className="num__l">OFF · ≈ {bennys(round.distanceKm ?? 0)}</span>
          </div>
        </div>

        <div className="reveal__answer">
          <p className="reveal__place"><span className="dot" />{loc.place}</p>
          <p className="muted small">
            You guessed in <b>{guessedName}</b>.{' '}
            {round.countryCorrect ? 'Right country!' : round.clues.corners?.correct ? 'You nailed the country in Four Corners.' : ''}
          </p>
          {loc.fact && <p className="reveal__fact">{loc.fact}</p>}
          {round.newStamp && (
            <div className="newstamp" role="status">
              <span className="newstamp__ring"><Flag size={18} /></span>
              <span>NEW PASSPORT STAMP · <b>{countryName(loc.countryCode)}</b></span>
            </div>
          )}
        </div>

        <div className="reveal__actions">
          {onEnd && <button className="btn btn--ghost" onClick={(e) => { e.stopPropagation(); onEnd() }}>END SESSION</button>}
          <button className="btn btn--lime btn--grow" autoFocus onClick={(e) => { e.stopPropagation(); onNext() }}>
            {isFinal ? 'SEE RESULTS' : 'NEXT ROUND'} <ArrowRight size={18} />
          </button>
        </div>
        {round.imagery.kind === 'photo' ? (
          <p className="credit credit--inline">
            {credit.title ? <>“{credit.title}” — </> : null}Photo: {credit.author} · <a href={credit.licenseUrl} target="_blank" rel="noopener">{credit.license}</a> ·{' '}
            <a href={credit.sourceUrl} target="_blank" rel="noopener">Source</a>{credit.note ? ` · ${credit.note}` : ''}
          </p>
        ) : (
          <p className="credit credit--inline">Street imagery: Mapillary contributors · CC BY-SA 4.0</p>
        )}
      </div>
    </div>
  )
}
