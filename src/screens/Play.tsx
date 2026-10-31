import { Check, Info, Lock, Map as MapIcon, Maximize2, Minimize2, Radar, ScrollText, Grid2x2, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useApp } from '../app/AppContext'
import { BennyTalk } from '../components/BennyTalk'
import { GuessMap } from '../components/GuessMap'
import { PhotoViewer } from '../components/PhotoViewer'
import { StreetViewer } from '../components/StreetViewer'
import { BUILD_MAPILLARY_TOKEN, PROXIMITY_BANDS, SCORING, asset } from '../config'
import { LOADING_LINES, pickFrom } from '../data/dialogue'
import { countryName } from '../data/countries'
import { LOCATIONS, LOC_BY_ID } from '../data/locations'
import { cluesUsed } from '../game/clues'
import { advance, completedRounds, currentRound, endSession, isFinalRound, setRoundImagery, submitGuess, totalScore, applyClue } from '../game/engine'
import { applyRound, recordGame } from '../game/progress'
import type { ClueId, LatLng, RoundState, Session } from '../game/types'
import { countryAt, loadBorders } from '../lib/borders'
import { formatBandLimit } from '../lib/geo'
import { maxAvailable, tierFor } from '../lib/scoring'
import { findStreetImage } from '../imagery/mapillary'
import { Reveal } from './Reveal'

const MODE_LABEL = { worldtour: 'WORLD TOUR', oneshot: 'ONE SHOT', endless: 'ENDLESS EXPLORER' } as const

export function streetToken(settingsToken: string) {
  return (settingsToken || BUILD_MAPILLARY_TOKEN || '').trim()
}

function patchRound(s: Session, patch: Partial<RoundState>): Session {
  const r = s.rounds[s.rounds.length - 1]
  return { ...s, rounds: [...s.rounds.slice(0, -1), { ...r, ...patch }] }
}

export function Play() {
  const app = useApp()
  const { session: s, setSession, setProfile, say, sfx, settings, go, celebrate, reducedMotion } = app
  const round = s ? currentRound(s) : null
  const loc = round ? LOC_BY_ID[round.locationId] : null
  const token = streetToken(settings.mapillaryToken)

  const [guess, setGuess] = useState<LatLng | undefined>()
  const [mapOpen, setMapOpen] = useState(false)
  const [mapBig, setMapBig] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [panel, setPanel] = useState<null | ClueId | 'quit'>(null)
  const [probing, setProbing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [imgLoading, setImgLoading] = useState(true)
  const [loadLine] = useState(() => pickFrom(LOADING_LINES))
  const spoken = useRef<string>('')
  const idle = useRef<number | undefined>(undefined)
  const narrow = useNarrow()

  // Borders are needed to judge the guess; start loading immediately.
  useEffect(() => { loadBorders().catch(() => undefined) }, [])

  // Reset UI for each new round
  useEffect(() => {
    setGuess(undefined); setConfirming(false); setPanel(null); setProbing(false); setMapOpen(false); setImgLoading(true)
  }, [round?.locationId])

  // Benny's round-start line (once per round)
  useEffect(() => {
    if (!s || !round || s.phase !== 'playing' || spoken.current === s.id + round.locationId) return
    spoken.current = s.id + round.locationId
    const first = s.rounds.length === 1
    const t = window.setTimeout(() => {
      if (s.mode === 'oneshot') say(first ? 'oneShotIntro' : 'oneShotRound')
      else if (first) say(s.mode === 'endless' ? 'endlessIntro' : 'newGame')
      else if (s.mode === 'endless' && s.rounds.length % 10 === 1) say('endlessMilestone')
      else if (Math.random() < 0.6) say('roundStart')
    }, 600)
    return () => window.clearTimeout(t)
  }, [s, round, say])

  // Idle nudge — once per round, after a long quiet spell
  const poke = useCallback(() => {
    window.clearTimeout(idle.current)
    idle.current = window.setTimeout(() => say('idle'), 55000)
  }, [say])
  useEffect(() => { poke(); return () => window.clearTimeout(idle.current) }, [round?.locationId, poke])

  // Street imagery: find a real Mapillary image near this place (World Tour / Endless with a key)
  useEffect(() => {
    if (!s || !round || !loc || s.imageryMode !== 'street' || round.imagery.kind !== 'photo' || round.streetTried || round.score !== undefined) return
    if (!token) { setSession((cur) => (cur ? patchRound(cur, { streetTried: true }) : cur)); return }
    const ac = new AbortController()
    ;(async () => {
      let note: string | undefined
      try {
        const hit = await findStreetImage(token, loc.lat, loc.lng, ac.signal)
        if (hit) {
          const where = await countryAt(hit)
          if (!where || where.code === loc.countryCode) {
            setSession((cur) => cur && currentRound(cur).locationId === loc.id
              ? patchRound(setRoundImagery(cur, { kind: 'street', provider: 'mapillary', imageId: hit.id, isPano: hit.isPano }, hit), { streetTried: true })
              : cur)
            return
          }
        }
        note = 'No street-level imagery here, so this round uses a real photo of the spot.'
      } catch (e) {
        if (ac.signal.aborted) return
        note = (e as Error).message === 'mapillary-auth'
          ? 'Your Mapillary key was refused, so this round uses a photo. Check Settings.'
          : 'Street imagery couldn’t load, so this round uses a real photo of the spot.'
      }
      setSession((cur) => cur && currentRound(cur).locationId === loc.id ? patchRound(cur, { streetTried: true, note }) : cur)
    })()
    return () => ac.abort()
  }, [s, round, loc, token, setSession])

  // Safety net after a refresh mid-reveal: make sure the finished round was counted exactly once.
  useEffect(() => {
    if (!s || !round || !loc || round.score === undefined || round.applied) return
    const res = applyRound(app.profile, s, round, loc.countryCode)
    setProfile(res.profile)
    setSession(patchRound(s, res.round))
  }, [s, round, loc, setProfile, setSession, app.profile])

  const finishGame = useCallback((done: Session) => {
    const res = recordGame(app.profile, done)
    const earned = res.earned
    const pb = !!res.session.personalBest
    setProfile(res.profile)
    setSession(res.session)
    window.setTimeout(() => {
      celebrate(earned)
      if (pb) { sfx('record'); say('record') } else say(done.exhausted ? 'exhausted' : 'complete')
    }, 50)
    go('summary')
  }, [app.profile, setProfile, setSession, celebrate, sfx, say, go])

  const keyRef = useRef<(e: KeyboardEvent) => void>(() => undefined)
  useEffect(() => {
    const h = (e: KeyboardEvent) => keyRef.current(e)
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])

  if (!s || !round || !loc) {
    return (
      <div className="page page--center">
        <p>No game in progress.</p>
        <button className="btn btn--lime" onClick={() => go('home')}>BACK TO HOME</button>
      </div>
    )
  }

  const used = cluesUsed(round)
  const total = totalScore(s)
  const roundNo = s.rounds.length
  const len = s.mode === 'endless' ? null : SCORING.roundsPerGame

  function onClue(c: ClueId) {
    if (!s || !round || round.score !== undefined) return
    poke(); sfx('tap')
    if (c === 'proximity' && !round.clues.proximity) { setPanel('proximity'); return }
    if (c === 'corners' && !round.clues.corners) { setPanel('corners'); return }
    if (c === 'decode' && !round.clues.decode) { setPanel('decode'); return }
    setPanel(c)
  }

  function activate(c: ClueId) {
    if (!s || !loc || !round) return
    sfx('clue')
    if (c === 'proximity') {
      setPanel(null); setProbing(true); setMapOpen(true)
      say('clueProximity')
      return
    }
    const next = applyClue(s, c, loc, Math.random)
    setSession(next)
    if (cluesUsed(currentRound(next)) === 3) say('allClues')
    else say(c === 'corners' ? 'clueCorners' : 'clueDecode')
  }

  function pickCorner(code: string) {
    if (!s || !loc) return
    const next = applyClue(s, 'corners', loc, Math.random, { pick: code })
    setSession(next)
    sfx(code === loc.countryCode ? 'good' : 'meh')
  }

  function onProbe(p: LatLng) {
    if (!s || !loc || !round || round.clues.proximity) return
    const next = applyClue(s, 'proximity', loc, Math.random, { test: p })
    setSession(next)
    setProbing(false)
    sfx('pin')
    if (cluesUsed(currentRound(next)) === 3) say('allClues')
  }

  function onGuess(p: LatLng) {
    setGuess(p); setConfirming(false); sfx('pin'); poke()
  }

  async function confirmGuess() {
    if (!s || !loc || !guess || busy) return
    setBusy(true)
    sfx('submit')
    const hit = await countryAt(guess)
    const gc = hit ? (hit.code ?? `~${hit.name}`) : null
    const next = submitGuess(s, guess, gc, loc.countryCode)
    const r = currentRound(next)
    const res = applyRound(app.profile, next, r, loc.countryCode)
    const applied = res.round
    const earned = res.round.newAchievements ?? []
    setProfile(res.profile)
    setSession(patchRound(next, applied))
    setBusy(false); setConfirming(false); setMapOpen(false); setProbing(false)
    // Reaction
    const base = r.baseScore ?? 0
    const tier = tierFor(base).id
    window.setTimeout(() => {
      sfx(tier === 'incredible' || tier === 'target' ? 'great' : tier === 'far' ? 'meh' : 'good')
      if (tier === 'incredible') say('excellent')
      else if (r.guessCountry === null) say('ocean')
      else if (r.countryCorrect) say('rightCountry')
      else if (tier === 'target' || tier === 'close') say('good')
      else if (tier === 'notbad') say('average')
      else if (r.distanceKm && r.distanceKm > 5000 && Math.random() < 0.5) say('wrongContinent')
      else say('poor')
    }, 350)
    window.setTimeout(() => {
      if (applied.newStamp) { sfx('stamp'); say('stamp') }
      else if (earned.length) say('achievement')
      celebrate(earned)
    }, 1500)
  }

  function next() {
    if (!s) return
    sfx('whoosh')
    if (isFinalRound(s)) { finishGame({ ...s, phase: 'complete' }); return }
    const n = advance(s, LOCATIONS, app.profile.recent, Math.random)
    if (n.phase === 'complete') { finishGame(n); return }
    setSession(n)
  }

  function endEndless() {
    if (!s) return
    const done = endSession(s)
    if (completedRounds(done).length === 0) { setSession(null); go('home'); return }
    finishGame(done)
  }

  keyRef.current = (e: KeyboardEvent) => {
    const t = e.target as HTMLElement
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return
    if (t && t.tagName === 'BUTTON' && (e.key === 'Enter' || e.key === ' ')) return // the focused button handles it
    if (round.score !== undefined) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'n' || e.key === 'N') { e.preventDefault(); next() }
      return
    }
    if (panel) { if (e.key === 'Escape') setPanel(null); return }
    if (e.key === 'm' || e.key === 'M') setMapOpen((o) => !o)
    else if (e.key === '1') onClue('corners')
    else if (e.key === '2') onClue('decode')
    else if (e.key === '3') onClue('proximity')
    else if ((e.key === 'Enter' || e.key === ' ') && guess && !probing) {
      e.preventDefault()
      if (confirming) void confirmGuess(); else setConfirming(true)
    } else if (e.key === 'Escape') { setConfirming(false); setProbing(false) }
  }

  const proximity = round.clues.proximity
  const imagery = round.imagery
  const photoSrc = imagery.kind === 'photo' ? asset(`photos/${imagery.file}`) : ''
  const mapMode = round.score !== undefined ? 'view' : probing ? 'probe' : 'guess'
  const showPhotoModeChip = s.mode !== 'oneshot' && imagery.kind === 'photo'

  return (
    <div className={`play ${narrow ? 'play--narrow' : 'play--wide'}`} onPointerDown={poke}>
      {/* Imagery */}
      <div className="stage">
        {imagery.kind === 'photo' ? (
          <PhotoViewer src={photoSrc} alt="Where in the world is this?" onLoad={() => setImgLoading(false)} onError={() => setImgLoading(false)} />
        ) : (
          <StreetViewer
            token={token}
            imageId={imagery.imageId}
            onFail={() => setSession((cur) => cur ? patchRound(cur, {
              imagery: { kind: 'photo', file: loc.photo.file, credit: loc.photo.credit, width: loc.photo.width, height: loc.photo.height },
              answer: { lat: loc.lat, lng: loc.lng },
              note: 'Street imagery couldn’t load, so this round uses a real photo of the spot.',
            }) : cur)}
            onEndOfRoad={() => { say('endOfRoad', { force: true }); setNotice('End of the road. Literally.'); window.setTimeout(() => setNotice(null), 3000) }}
          />
        )}
        {imagery.kind === 'photo' && imgLoading && <div className="stage__loading"><span className="spinner" />{loadLine}</div>}
        {imagery.kind === 'photo' && (
          <div className="credit">
            Photo: {imagery.credit.author} · <a href={imagery.credit.licenseUrl} target="_blank" rel="noopener">{imagery.credit.license}</a>
          </div>
        )}
      </div>

      {/* HUD */}
      <header className="hud">
        <div className="hud__left">
          <span className="wordmark wordmark--sm">LOCATED<b>.</b></span>
          <span className="chip">{MODE_LABEL[s.mode]}</span>
          {showPhotoModeChip && (
            <button className="chip chip--ghost" onClick={() => setNotice(token
              ? 'This place has no usable street imagery, so it is shown as a real photo instead.'
              : 'Photo Tour: real photos of real places. Add a free Mapillary key in Settings to walk around streets instead.')}>
              <Info size={13} /> PHOTO MODE
            </button>
          )}
        </div>
        <div className="hud__center">
          <span className="hud__label">ROUND</span>
          <span className="hud__value">{roundNo}{len ? <small>/{len}</small> : null}</span>
        </div>
        <div className="hud__right">
          <div className="hud__score"><span className="hud__label">SCORE</span><span className="hud__value">{total.toLocaleString('en-US')}</span></div>
          <button className="iconbtn iconbtn--dark" onClick={() => setPanel('quit')} aria-label="Pause menu"><X size={20} /></button>
        </div>
      </header>

      {(notice || round.note) && (
        <div className="notice" role="status">
          <span>{notice ?? round.note}</span>
          <button onClick={() => (notice ? setNotice(null) : setSession((cur) => (cur ? patchRound(cur, { note: undefined }) : cur)))} aria-label="Dismiss"><X size={14} /></button>
        </div>
      )}

      {/* Bottom bar */}
      {round.score === undefined && (
        <div className="bottom">
          <BennyTalk size={narrow ? 64 : 84} className="bottom__benny" />
          <div className="clues" role="group" aria-label="Clues">
            <ClueButton id="corners" label="FOUR CORNERS" icon={<Grid2x2 size={20} />} used={!!round.clues.corners} onClick={() => onClue('corners')} />
            <ClueButton id="decode" label="DECODE" icon={<ScrollText size={20} />} used={!!round.clues.decode} onClick={() => onClue('decode')} />
            <ClueButton id="proximity" label="PROXIMITY" icon={<Radar size={20} />} used={!!proximity} active={probing} onClick={() => onClue('proximity')} />
            <div className="clues__max"><span>MAX</span><b>{maxAvailable(used).toLocaleString('en-US')}</b></div>
          </div>
          {narrow && (
            <button className="btn btn--lime mapfab" onClick={() => { setMapOpen(true); sfx('tap') }}>
              <MapIcon size={18} /> {guess ? 'MAP · PIN SET' : 'OPEN MAP'}
            </button>
          )}
        </div>
      )}

      {/* Map dock / sheet */}
      {round.score === undefined && (
        <section onScroll={(e) => { e.currentTarget.scrollTop = 0 }} className={`dock ${narrow ? 'dock--sheet' : 'dock--card'} ${mapOpen || !narrow ? 'is-open' : ''} ${mapBig ? 'is-big' : ''}`} aria-label="Guess map">
          <div className="dock__bar">
            {probing ? (
              <span className="dock__hint dock__hint--probe"><Radar size={14} /> Tap a TEST spot. It will <b>not</b> be your guess.</span>
            ) : proximity ? (
              <span className="dock__hint"><Radar size={14} /> Test pin: <b>{PROXIMITY_BANDS[proximity.band].label}</b>{' '}
                {proximity.band < PROXIMITY_BANDS.length - 1 ? `· under ${formatBandLimit(PROXIMITY_BANDS[proximity.band].maxKm, settings.units)}` : `· over ${formatBandLimit(5000, settings.units)}`}
              </span>
            ) : (
              <span className="dock__hint">{guess ? 'Drag the pin to adjust.' : 'Tap the map to drop your pin.'}</span>
            )}
            <div className="dock__tools">
              {!narrow && <button className="iconbtn" onClick={() => setMapBig((b) => !b)} aria-label={mapBig ? 'Shrink map' : 'Enlarge map'}>{mapBig ? <Minimize2 size={16} /> : <Maximize2 size={16} />}</button>}
              {narrow && <button className="iconbtn" onClick={() => { setMapOpen(false); setProbing(false) }} aria-label="Close map"><X size={18} /></button>}
              {probing && <button className="btn btn--sm btn--ghost" onClick={() => setProbing(false)}>CANCEL TEST</button>}
            </div>
          </div>
          <GuessMap
            mode={mapMode}
            guess={guess}
            probe={proximity ?? undefined}
            onGuess={onGuess}
            onProbe={onProbe}
            tiles={settings.mapDetail}
            fitKey={round.locationId}
            reducedMotion={reducedMotion}
          />
          <div className="dock__foot">
            {!confirming ? (
              <button className="btn btn--lime btn--block" disabled={!guess || probing} onClick={() => { setConfirming(true); sfx('tap') }}>
                <Lock size={16} /> {guess ? 'GUESS' : 'PLACE A PIN FIRST'}
              </button>
            ) : (
              <div className="confirm">
                <span>Lock it in?</span>
                <button className="btn btn--ghost" onClick={() => setConfirming(false)}>NOT YET</button>
                <button className="btn btn--lime" onClick={confirmGuess} disabled={busy}><Check size={16} /> CONFIRM</button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Clue panels */}
      {panel && panel !== 'quit' && round.score === undefined && (
        <ClueSheet
          clue={panel}
          round={round}
          decodeText={loc.decode}
          answer={loc.countryCode}
          onActivate={activate}
          onPick={pickCorner}
          onClose={() => setPanel(null)}
        />
      )}

      {panel === 'quit' && (
        <div className="modal" role="dialog" aria-modal="true" aria-label="Pause">
          <div className="modal__card">
            <h2 className="h2">PAUSED</h2>
            <p className="muted">Your game is saved on this device. You can pick it up from the home screen.</p>
            <div className="stack">
              <button className="btn btn--lime btn--block" onClick={() => setPanel(null)}>KEEP PLAYING</button>
              {s.mode === 'endless' && <button className="btn btn--dark btn--block" onClick={() => { setPanel(null); endEndless() }}>END SESSION &amp; SEE SUMMARY</button>}
              <button className="btn btn--ghost btn--block" onClick={() => { setPanel(null); go('home') }}>SAVE &amp; GO HOME</button>
              <button className="btn btn--text btn--block" onClick={() => { setPanel(null); setSession(null); go('home') }}>ABANDON GAME</button>
            </div>
          </div>
        </div>
      )}

      {/* Reveal */}
      {round.score !== undefined && (
        <Reveal
          session={s}
          round={round}
          loc={loc}
          isFinal={isFinalRound(s)}
          onNext={next}
          onEnd={s.mode === 'endless' ? endEndless : undefined}
        />
      )}
    </div>
  )
}

function ClueButton({ id, label, icon, used, active, onClick }: { id: string; label: string; icon: React.ReactNode; used: boolean; active?: boolean; onClick: () => void }) {
  return (
    <button type="button" className={`clue clue--${id} ${used ? 'is-used' : ''} ${active ? 'is-active' : ''}`} onClick={onClick} aria-pressed={used}>
      <span className="clue__icon">{used ? <Check size={18} /> : icon}</span>
      <span className="clue__label">{label}</span>
      <span className="clue__cost">{used ? 'USED' : '−500'}</span>
    </button>
  )
}

function ClueSheet({ clue, round, decodeText, answer, onActivate, onPick, onClose }: {
  clue: ClueId; round: RoundState; decodeText: string; answer: string
  onActivate: (c: ClueId) => void; onPick: (code: string) => void; onClose: () => void
}) {
  const c = round.clues
  const intro: Record<ClueId, { title: string; body: string; cta: string }> = {
    corners: { title: 'FOUR CORNERS', body: 'Four countries. One is right. Pick it and we’ll confirm the country — but not the exact spot.', cta: 'SHOW 4 COUNTRIES · −500' },
    decode: { title: 'DECODE', body: 'A short riddle about this place. Useful, but not a giveaway.', cta: 'REVEAL RIDDLE · −500' },
    proximity: { title: 'PROXIMITY', body: 'Drop ONE test pin anywhere. We’ll tell you how hot or cold it is — no exact distance. Your real guess is separate.', cta: 'DROP A TEST PIN · −500' },
  }
  const active = clue === 'corners' ? !!c.corners : clue === 'decode' ? !!c.decode : !!c.proximity
  return (
    <div className="modal modal--sheet" role="dialog" aria-modal="true" aria-label={intro[clue].title} onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal__card cluesheet">
        <div className="cluesheet__head">
          <span className="eyebrow">CLUE</span>
          <h2 className="h2">{intro[clue].title}</h2>
          <button className="iconbtn" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        {!active && (
          <>
            <p className="cluesheet__body">{intro[clue].body}</p>
            <button className="btn btn--lime btn--block" onClick={() => onActivate(clue)}>{intro[clue].cta}</button>
          </>
        )}
        {clue === 'corners' && c.corners && (
          <>
            <div className="corners">
              {c.corners.options.map((code, i) => {
                const picked = c.corners!.picked
                const state = picked === undefined ? '' : code === answer ? 'is-right' : code === picked ? 'is-wrong' : 'is-dim'
                return (
                  <button key={code} className={`corner ${state}`} disabled={picked !== undefined} onClick={() => onPick(code)}>
                    <span className="corner__n">0{i + 1}</span>
                    <span className="corner__name">{countryName(code)}</span>
                    {picked !== undefined && code === answer && <Check size={18} />}
                    {picked !== undefined && code === picked && code !== answer && <X size={18} />}
                  </button>
                )
              })}
            </div>
            {c.corners.picked !== undefined && (
              <p className="cluesheet__result">
                {c.corners.correct ? <>Correct — it’s <b>{countryName(answer)}</b>. Now find the exact spot.</> : <>Not quite. It’s <b>{countryName(answer)}</b>.</>}
              </p>
            )}
          </>
        )}
        {clue === 'decode' && c.decode && <blockquote className="riddle">{decodeText}</blockquote>}
        {clue === 'proximity' && c.proximity && (
          <p className="cluesheet__result">Your test pin is <b>{PROXIMITY_BANDS[c.proximity.band].label}</b>. {PROXIMITY_BANDS[c.proximity.band].hint}</p>
        )}
        {active && <button className="btn btn--dark btn--block" onClick={onClose}>BACK TO THE PHOTO</button>}
      </div>
    </div>
  )
}

function useNarrow() {
  const q = '(max-width: 899px), (orientation: portrait) and (max-width: 1100px)'
  const [n, setN] = useState(() => { try { return window.matchMedia(q).matches } catch { return false } })
  useEffect(() => {
    const mq = window.matchMedia(q)
    const on = () => setN(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return useMemo(() => n, [n])
}
