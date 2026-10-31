import { Award, BookOpen, CarFront, ChevronLeft, Crosshair, Eye, Flame, Footprints, Globe2, Hand, Lock, Medal, Orbit, Plane, ScanEye, Sparkles, Stamp, Ticket, Trophy, Waves, type LucideIcon } from 'lucide-react'

const ACH_ICONS: Record<string, LucideIcon> = { Stamp, Eye, ScanEye, Flame, Globe2, Trophy, Crosshair, BookOpen, Plane, Sparkles, Medal, Footprints, Ticket, Orbit, Waves, CarFront, Hand }
import { useState, type ReactNode } from 'react'
import { useApp } from '../app/AppContext'
import { Benny } from '../components/Benny'
import { ACHIEVEMENTS } from '../data/achievements'
import { CONTINENTS, COUNTRIES, countryName } from '../data/countries'
import { LOCATIONS } from '../data/locations'
import { endlessBests } from '../game/progress'
import type { ModeId } from '../game/types'
import { formatDistance } from '../lib/geo'

export function Page({ title, kicker, children, wide }: { title: string; kicker?: string; children: ReactNode; wide?: boolean }) {
  const { go, sfx } = useApp()
  return (
    <div className={`page ${wide ? 'page--wide' : ''}`}>
      <header className="page__head">
        <button className="iconbtn iconbtn--back" onClick={() => { sfx('tap'); go('home') }} aria-label="Back to home"><ChevronLeft size={22} /></button>
        <div>
          {kicker && <span className="eyebrow">{kicker}</span>}
          <h1 className="h1">{title}</h1>
        </div>
      </header>
      {children}
    </div>
  )
}

const fmtDate = (iso: string) => { try { return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) } catch { return '' } }

// ---------------- Leaderboards ----------------
export function Records() {
  const { profile, screenArg, settings } = useApp()
  const [tab, setTab] = useState<ModeId>((screenArg as ModeId) || 'worldtour')
  const list = profile.records[tab]
  const eb = endlessBests(profile)
  return (
    <Page title="LEADERBOARDS" kicker="YOUR PERSONAL RECORDS">
      <div className="tabs" role="tablist">
        {(['worldtour', 'oneshot', 'endless'] as ModeId[]).map((m) => (
          <button key={m} role="tab" aria-selected={tab === m} className={tab === m ? 'is-on' : ''} onClick={() => setTab(m)}>
            {m === 'worldtour' ? 'WORLD TOUR' : m === 'oneshot' ? 'ONE SHOT' : 'ENDLESS'}
          </button>
        ))}
      </div>
      {tab === 'endless' && (
        <div className="bests">
          <div className="stat"><span className="stat__v">{eb.score ? eb.score.toLocaleString('en-US') : '—'}</span><span className="stat__l">HIGHEST SCORE</span></div>
          <div className="stat"><span className="stat__v">{eb.rounds || '—'}</span><span className="stat__l">MOST ROUNDS</span></div>
          <div className="stat"><span className="stat__v">{eb.avg ? eb.avg.toLocaleString('en-US') : '—'}</span><span className="stat__l">BEST AVG / ROUND (5+)</span></div>
        </div>
      )}
      {list.length === 0 ? (
        <div className="empty"><Benny expr="sleepy" size={120} /><p>No finished games yet. Benny is napping until you set a record.</p></div>
      ) : (
        <ol className="board">
          {list.map((r, i) => (
            <li key={r.date + i} className={i === 0 ? 'is-top' : ''}>
              <span className="board__rank">{String(i + 1).padStart(2, '0')}</span>
              <span className="board__score">{r.score.toLocaleString('en-US')}</span>
              <span className="board__meta">{fmtDate(r.date)} · {r.rounds} rounds · avg {formatDistance(r.avgKm, settings.units)} · {r.clues} clue{r.clues === 1 ? '' : 's'}</span>
            </li>
          ))}
        </ol>
      )}
      <p className="note">Records are saved only in this browser on this device. No accounts, no online rankings, no strangers.</p>
    </Page>
  )
}

// ---------------- Passport ----------------
export function Passport() {
  const { profile } = useApp()
  const supported = [...new Set(LOCATIONS.map((l) => l.countryCode))]
  const found = supported.filter((c) => profile.passport[c])
  return (
    <Page title="PASSPORT" kicker={`${found.length} OF ${supported.length} COUNTRIES IN THE CATALOG`} wide>
      <p className="note">A stamp is earned only by actually identifying a country: your guess lands inside its real borders, or you pick it correctly in Four Corners.</p>
      <div className="progressbar" aria-label={`${found.length} of ${supported.length}`}><span style={{ width: `${supported.length ? (100 * found.length) / supported.length : 0}%` }} /></div>
      {CONTINENTS.map((cont) => {
        const list = supported.filter((c) => COUNTRIES[c]?.continent === cont).sort((a, b) => countryName(a).localeCompare(countryName(b)))
        if (!list.length) return null
        const got = list.filter((c) => profile.passport[c]).length
        return (
          <section key={cont} className="pp">
            <h2 className="pp__head"><span>{cont.toUpperCase()}</span><span className="muted">{got}/{list.length}</span></h2>
            <div className="stamps">
              {list.map((c, i) => {
                const p = profile.passport[c]
                const st = profile.countryStats[c]
                return (
                  <div key={c} className={`stamp ${p ? 'is-got' : ''}`} style={{ ['--rot' as string]: `${((c.charCodeAt(0) * 7 + c.charCodeAt(1) * 13 + i) % 17) - 8}deg` }}>
                    <svg viewBox="0 0 100 100" className="stamp__svg" aria-hidden>
                      <circle cx="50" cy="50" r="44" className="stamp__o" />
                      <circle cx="50" cy="50" r="36" className="stamp__i" />
                      <text x="50" y="58" textAnchor="middle" className="stamp__code">{p ? c : '?'}</text>
                    </svg>
                    <span className="stamp__name">{p ? countryName(c) : 'Undiscovered'}</span>
                    {st && <span className="stamp__meta">{st.found}/{st.seen} found · best {st.best.toLocaleString('en-US')}</span>}
                  </div>
                )
              })}
            </div>
          </section>
        )
      })}
    </Page>
  )
}

// ---------------- Achievements ----------------
export function Achievements() {
  const { profile } = useApp()
  const got = ACHIEVEMENTS.filter((a) => profile.achievements[a.id]).length
  return (
    <Page title="ACHIEVEMENTS" kicker={`${got} OF ${ACHIEVEMENTS.length} UNLOCKED`} wide>
      <div className="achs">
        {ACHIEVEMENTS.map((a) => {
          const on = !!profile.achievements[a.id]
          const Icon = ACH_ICONS[a.icon] ?? Award
          const hidden = a.secret && !on
          return (
            <div key={a.id} className={`ach ${on ? 'is-on' : ''}`}>
              <span className="ach__icon">{hidden ? <Lock size={22} /> : <Icon size={24} />}</span>
              <span className="ach__title">{hidden ? 'SECRET' : a.title}</span>
              <span className="ach__desc">{hidden ? 'Benny knows. Benny isn’t telling.' : a.desc}</span>
              {on && <span className="ach__date">{fmtDate(profile.achievements[a.id])}</span>}
            </div>
          )
        })}
      </div>
    </Page>
  )
}
