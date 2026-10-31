import { CircleHelp, ExternalLink, KeyRound, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useApp } from '../app/AppContext'
import { Benny } from '../components/Benny'
import { BUILD_MAPILLARY_TOKEN } from '../config'
import { testToken } from '../imagery/mapillary'
import { defaultProfile, resetAll } from '../lib/storage'
import { Page } from './Pages'

function Seg<T extends string>({ value, options, onChange, label }: { value: T; options: [T, string][]; onChange: (v: T) => void; label: string }) {
  return (
    <div className="seg" role="radiogroup" aria-label={label}>
      {options.map(([v, l]) => (
        <button key={v} role="radio" aria-checked={value === v} className={value === v ? 'is-on' : ''} onClick={() => onChange(v)}>{l}</button>
      ))}
    </div>
  )
}

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button role="switch" aria-checked={on} aria-label={label} className={`toggle ${on ? 'is-on' : ''}`} onClick={() => onChange(!on)}>
      <span className="toggle__knob" /><span className="toggle__txt">{on ? 'ON' : 'OFF'}</span>
    </button>
  )
}

export function Settings() {
  const { settings, updateSettings, go, setProfile, setSession, sfx, say } = useApp()
  const [key, setKey] = useState(settings.mapillaryToken)
  const [keyState, setKeyState] = useState<'idle' | 'testing' | 'ok' | 'invalid' | 'network'>('idle')
  const [confirmReset, setConfirmReset] = useState(0)

  async function saveKey() {
    const k = key.trim()
    if (!k) { updateSettings({ mapillaryToken: '' }); setKeyState('idle'); return }
    setKeyState('testing')
    const r = await testToken(k)
    setKeyState(r)
    if (r === 'ok') { updateSettings({ mapillaryToken: k }); sfx('great') }
  }

  return (
    <Page title="SETTINGS" kicker="MAKE IT YOURS">
      <div className="settings">
        <div className="row">
          <div><b>Sound</b><span>Little blips and boops. All made from scratch.</span></div>
          <Toggle on={settings.sound} label="Sound" onChange={(v) => { updateSettings({ sound: v }); if (v) window.setTimeout(() => sfx('tap'), 30) }} />
        </div>
        <div className="row">
          <div><b>Benny’s commentary</b><span>Quiet = only big moments. Off = Benny still reacts with his face.</span></div>
          <Seg label="Benny commentary" value={settings.benny} options={[['full', 'CHATTY'], ['quiet', 'QUIET'], ['off', 'OFF']]}
            onChange={(v) => { updateSettings({ benny: v }); if (v !== 'off') window.setTimeout(() => say('poke', { force: true }), 50) }} />
        </div>
        <div className="row">
          <div><b>Motion</b><span>Reduce animations and confetti.</span></div>
          <Seg label="Motion" value={settings.motion} options={[['system', 'AUTO'], ['reduced', 'REDUCED'], ['full', 'FULL']]} onChange={(v) => updateSettings({ motion: v })} />
        </div>
        <div className="row">
          <div><b>Distance units</b><span>Benny measures in Bennys regardless.</span></div>
          <Seg label="Units" value={settings.units} options={[['mi', 'MILES'], ['km', 'KILOMETERS']]} onChange={(v) => updateSettings({ units: v })} />
        </div>
        <div className="row">
          <div><b>Detailed map</b><span>Adds OpenStreetMap streets and place names when you zoom in. Off = clean borders only (works offline).</span></div>
          <Toggle on={settings.mapDetail} label="Detailed map" onChange={(v) => updateSettings({ mapDetail: v })} />
        </div>

        <div className="row row--col">
          <div>
            <b><KeyRound size={16} /> Street-level imagery (optional)</b>
            <span>
              World Tour and Endless can use real street imagery you can look around and move through, from Mapillary — free, no credit card.
              Paste your free Mapillary <i>client token</i> (starts with <code>MLY|</code>). It’s saved only on this device.
              Without it, those modes use real photos of each place instead.
              {BUILD_MAPILLARY_TOKEN && ' A key is already built into this copy of the game.'}
            </span>
          </div>
          <div className="keyrow">
            <input type="text" inputMode="text" autoComplete="off" spellCheck={false} placeholder="MLY|1234…" value={key} onChange={(e) => { setKey(e.target.value); setKeyState('idle') }} aria-label="Mapillary client token" />
            <button className="btn btn--dark" onClick={saveKey} disabled={keyState === 'testing'}>{keyState === 'testing' ? 'CHECKING…' : 'SAVE & TEST'}</button>
          </div>
          {keyState === 'ok' && <p className="ok">Key works. New World Tour and Endless games will use street imagery where it exists.</p>}
          {keyState === 'invalid' && <p className="bad">That key was refused. Double-check you copied the <b>client token</b> (MLY|…), not the client secret.</p>}
          {keyState === 'network' && <p className="bad">Couldn’t reach Mapillary right now. Check your connection and try again.</p>}
          <a className="linkbtn" href="https://www.mapillary.com/dashboard/developers" target="_blank" rel="noopener">Get a free key at mapillary.com <ExternalLink size={14} /></a>
        </div>

        <div className="row">
          <div><b>How to play</b><span>Clues, scoring and the passport, explained in about a minute.</span></div>
          <button className="btn btn--ghost" onClick={() => go('howto')}><CircleHelp size={16} /> OPEN</button>
        </div>
        <div className="row">
          <div><b>Credits, attribution &amp; licenses</b><span>Every photo, map and library, credited.</span></div>
          <button className="btn btn--ghost" onClick={() => go('credits')}>OPEN</button>
        </div>

        <div className="row row--danger">
          <div><b>Reset progress</b><span>Deletes records, passport stamps, achievements and any saved game on this device. Settings are kept.</span></div>
          {confirmReset === 0 ? (
            <button className="btn btn--ghost" onClick={() => setConfirmReset(1)}><Trash2 size={16} /> RESET</button>
          ) : (
            <div className="confirm">
              <Benny expr="surprised" size={44} />
              <button className="btn btn--ghost" onClick={() => setConfirmReset(0)}>KEEP IT</button>
              <button className="btn btn--danger" onClick={() => { resetAll(); setProfile(defaultProfile()); setSession(null); setConfirmReset(0); say('welcome', { force: true }) }}>YES, ERASE EVERYTHING</button>
            </div>
          )}
        </div>
      </div>
    </Page>
  )
}
