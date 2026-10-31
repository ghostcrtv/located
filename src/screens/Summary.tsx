import { ArrowRight, Home as HomeIcon, RotateCcw, Trophy } from 'lucide-react'
import { useMemo } from 'react'
import { useApp } from '../app/AppContext'
import { BennyTalk } from '../components/BennyTalk'
import { Confetti } from '../components/Confetti'
import { GuessMap } from '../components/GuessMap'
import { ACH_BY_ID } from '../data/achievements'
import { countryName } from '../data/countries'
import { bennys } from '../data/dialogue'
import { LOCATIONS, LOC_BY_ID } from '../data/locations'
import { cluesUsed } from '../game/clues'
import { createSession, sessionStats } from '../game/engine'
import { formatDistance } from '../lib/geo'
import { useCountUp } from '../lib/useCountUp'
import { streetToken } from './Play'

const LABEL = { worldtour: 'WORLD TOUR', oneshot: 'ONE SHOT', endless: 'ENDLESS EXPLORER' } as const

export function Summary() {
  const app = useApp()
  const { session: s, settings, reducedMotion, go, setSession, profile, sfx } = app
  const done = useMemo(() => (s ? s.rounds.filter((r) => r.score !== undefined) : []), [s])
  const st = s ? sessionStats(s) : null
  const [total, finish] = useCountUp(st?.total ?? 0, 1400, reducedMotion)
  const pairs = useMemo(() => done.map((r) => ({ answer: r.answer, guess: r.guess })), [done])

  if (!s || !st) {
    return <div className="page page--center"><button className="btn btn--lime" onClick={() => go('home')}>BACK TO HOME</button></div>
  }
  const stamps = done.filter((r) => r.newStamp).map((r) => LOC_BY_ID[r.locationId]?.countryCode)
  const achs = [...new Set([...done.flatMap((r) => r.newAchievements ?? []), ...s.newAchievements])]
  const max = s.mode === 'endless' ? null : 25000

  function again() {
    if (!s) return
    sfx('tap')
    const n = createSession(s.mode, LOCATIONS, profile.recent, Math.random, streetToken(settings.mapillaryToken) ? 'street' : 'photo')
    setSession(n)
    go('play')
  }

  return (
    <div className="summary" onClick={finish}>
      {s.personalBest && <Confetti count={60} reduced={reducedMotion} />}
      <header className="summary__head">
        <span className="eyebrow">{LABEL[s.mode]} · COMPLETE</span>
        <div className="summary__total">
          <span className="summary__score">{total.toLocaleString('en-US')}</span>
          {max && <span className="summary__max">/ {max.toLocaleString('en-US')}</span>}
        </div>
        {s.personalBest && <span className="pb"><Trophy size={16} /> NEW PERSONAL BEST</span>}
        {s.exhausted && <p className="muted">You’ve explored every place in the current catalog. More are on the way.</p>}
      </header>

      <div className="summary__grid">
        <div className="summary__map">
          <GuessMap mode="view" pairs={pairs} tiles={settings.mapDetail} reducedMotion={reducedMotion} />
        </div>

        <div className="summary__side">
          <BennyTalk size={110} side="right" className="summary__benny" />
          <dl className="kv">
            <div><dt>ROUNDS</dt><dd>{st.rounds}</dd></div>
            <div><dt>AVG DISTANCE</dt><dd>{formatDistance(st.avgKm, settings.units)}</dd></div>
            <div><dt>BEST ROUND</dt><dd>{st.best.toLocaleString('en-US')}</dd></div>
            <div><dt>CLUES USED</dt><dd>{st.clues}</dd></div>
            <div><dt>RIGHT COUNTRY</dt><dd>{st.countriesRight}/{st.rounds}</dd></div>
            <div><dt>TOTAL TRAVEL</dt><dd title={bennys(st.totalKm)}>{formatDistance(st.totalKm, settings.units)}</dd></div>
          </dl>
          {(stamps.length > 0 || achs.length > 0) && (
            <div className="unlocks">
              {stamps.map((c) => <span key={c} className="tag tag--lime">STAMP · {countryName(c)}</span>)}
              {achs.map((a) => ACH_BY_ID[a] && <span key={a} className="tag">★ {ACH_BY_ID[a].title}</span>)}
            </div>
          )}
        </div>
      </div>

      <ol className="rounds">
        {done.map((r, i) => {
          const loc = LOC_BY_ID[r.locationId]
          return (
            <li key={r.locationId} className="roundrow">
              <span className="roundrow__n">{i + 1}</span>
              <span className="roundrow__place">{loc?.place}<small>{countryName(loc?.countryCode)}</small></span>
              <span className="roundrow__d">{formatDistance(r.distanceKm ?? 0, settings.units)}</span>
              <span className="roundrow__c">{cluesUsed(r) ? `${cluesUsed(r)} clue${cluesUsed(r) > 1 ? 's' : ''}` : 'no clues'}</span>
              <span className="roundrow__s">{(r.score ?? 0).toLocaleString('en-US')}</span>
            </li>
          )
        })}
      </ol>

      <div className="summary__actions">
        <button className="btn btn--lime btn--lg" onClick={again}><RotateCcw size={18} /> PLAY AGAIN</button>
        <button className="btn btn--dark btn--lg" onClick={() => { setSession(null); go('records', s.mode) }}><Trophy size={18} /> VIEW LEADERBOARD</button>
        <button className="btn btn--ghost btn--lg" onClick={() => { setSession(null); go('home') }}><HomeIcon size={18} /> BACK TO HOME <ArrowRight size={16} /></button>
      </div>
    </div>
  )
}
