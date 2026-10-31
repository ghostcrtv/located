import { ArrowRight, BookOpen, Camera, CircleHelp, Compass, Infinity as InfinityIcon, Settings as Cog, Trophy, Award, Play as PlayIcon } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useApp } from '../app/AppContext'
import { BennyTalk } from '../components/BennyTalk'
import { LOCATIONS } from '../data/locations'
import { createSession, completedRounds } from '../game/engine'
import { endlessBests } from '../game/progress'
import type { ModeId } from '../game/types'
import { streetToken } from './Play'

const MODES: { id: ModeId; n: string; title: string; sub: string; blurb: string; icon: React.ReactNode }[] = [
  { id: 'worldtour', n: '01', title: 'WORLD TOUR', sub: 'Explore real locations.', blurb: '5 rounds · look around · 25,000 max', icon: <Compass size={26} /> },
  { id: 'oneshot', n: '02', title: 'ONE SHOT', sub: 'One photo. One guess.', blurb: '5 rounds · no moving · pure instinct', icon: <Camera size={26} /> },
  { id: 'endless', n: '03', title: 'ENDLESS EXPLORER', sub: 'The world doesn’t stop.', blurb: 'Keep going · stop any time', icon: <InfinityIcon size={26} /> },
]

export function Home() {
  const app = useApp()
  const { profile, setProfile, session, setSession, go, say, sfx, settings, setLastMode } = app
  const greeted = useRef(false)

  useEffect(() => {
    if (greeted.current) return
    greeted.current = true
    const returning = !!profile.lastVisit
    const t = window.setTimeout(() => say(returning ? 'returning' : 'welcome'), 500)
    setProfile((p) => ({ ...p, lastVisit: new Date().toISOString() }))
    return () => window.clearTimeout(t)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Leave Benny alone long enough and he dozes off.
  useEffect(() => {
    let t: number
    const arm = () => { window.clearTimeout(t); t = window.setTimeout(() => say('homeIdle', { force: true }), 45000) }
    arm()
    window.addEventListener('pointerdown', arm)
    return () => { window.clearTimeout(t); window.removeEventListener('pointerdown', arm) }
  }, [say])

  const best = Math.max(0, ...profile.records.worldtour.map((r) => r.score), ...profile.records.oneshot.map((r) => r.score))
  const games = Object.values(profile.gamesPlayed).reduce((a, b) => a + b, 0)
  const stamps = Object.keys(profile.passport).length
  const catalogCountries = new Set(LOCATIONS.map((l) => l.countryCode)).size
  const resumable = session && session.phase !== 'complete' ? session : null

  function start(mode: ModeId) {
    sfx('tap')
    const imagery = streetToken(settings.mapillaryToken) ? 'street' : 'photo'
    const s = createSession(mode, LOCATIONS, profile.recent, Math.random, imagery)
    if (!s) return
    setSession(s)
    setLastMode(mode)
    go('play')
  }

  return (
    <div className="home">
      <header className="home__top">
        <div className="home__brand">
          <h1 className="wordmark">LOCATED<b>.</b></h1>
          <p className="home__tag">HOW WELL DO YOU KNOW THE WORLD?</p>
          <p className="home__line">Explore. Guess. Discover.</p>
        </div>
        <div className="home__benny">
          <BennyTalk size={190} side="left" />
        </div>
      </header>

      {resumable && (
        <button className="resume" onClick={() => { sfx('tap'); go('play') }}>
          <PlayIcon size={18} />
          <span><b>RESUME</b> {resumable.mode === 'oneshot' ? 'ONE SHOT' : resumable.mode === 'endless' ? 'ENDLESS EXPLORER' : 'WORLD TOUR'} · round {resumable.rounds.length}
            {' '}· {completedRounds(resumable).reduce((t, r) => t + (r.score ?? 0), 0).toLocaleString('en-US')} pts</span>
          <ArrowRight size={18} />
        </button>
      )}

      <section className="modes" aria-label="Game modes">
        {MODES.map((m) => (
          <button key={m.id} className={`mode mode--${m.id}`} onClick={() => start(m.id)}>
            <span className="mode__n">{m.n}</span>
            <span className="mode__icon">{m.icon}</span>
            <span className="mode__title">{m.title}</span>
            <span className="mode__sub">{m.sub}</span>
            <span className="mode__blurb">{m.blurb}</span>
            <span className="mode__play">PLAY <ArrowRight size={18} /></span>
          </button>
        ))}
      </section>

      <section className="stats" aria-label="Your stats">
        <div className="stat"><span className="stat__v">{best ? best.toLocaleString('en-US') : '—'}</span><span className="stat__l">PERSONAL BEST</span></div>
        <div className="stat"><span className="stat__v">{games}</span><span className="stat__l">GAMES PLAYED</span></div>
        <div className="stat"><span className="stat__v">{stamps}<small>/{catalogCountries}</small></span><span className="stat__l">COUNTRIES DISCOVERED</span></div>
        <div className="stat"><span className="stat__v">{endlessBests(profile).rounds || '—'}</span><span className="stat__l">LONGEST ENDLESS RUN</span></div>
      </section>

      <nav className="homenav" aria-label="More">
        <button onClick={() => go('records')}><Trophy size={20} /> LEADERBOARDS</button>
        <button onClick={() => go('passport')}><BookOpen size={20} /> PASSPORT</button>
        <button onClick={() => go('achievements')}><Award size={20} /> ACHIEVEMENTS</button>
        <button onClick={() => go('howto')}><CircleHelp size={20} /> HOW TO PLAY</button>
        <button onClick={() => go('settings')}><Cog size={20} /> SETTINGS</button>
      </nav>

      <footer className="home__foot">
        <span>{LOCATIONS.length} real places in {catalogCountries} countries so far · more coming</span>
        <button className="linkbtn" onClick={() => go('credits')}>Credits &amp; licenses</button>
      </footer>
    </div>
  )
}
