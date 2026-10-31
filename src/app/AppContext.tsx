import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { EXPRESSION_FOR, KEY_MOMENTS, LINES, pickLine, type Expression, type LineCategory } from '../data/dialogue'
import { LOCATIONS } from '../data/locations'
import { awardAchievements } from '../game/progress'
import type { ModeId, Profile, Session, Settings } from '../game/types'
import { play, setSoundEnabled, type Sfx } from '../lib/sound'
import { loadProfile, loadSession, loadSettings, saveProfile, saveSession, saveSettings } from '../lib/storage'

export type Screen = 'home' | 'play' | 'summary' | 'records' | 'passport' | 'achievements' | 'settings' | 'howto' | 'credits'
export interface BennyMsg { id: number; text: string; expr: Expression }
export interface Toast { id: number; achId: string }

interface AppApi {
  screen: Screen
  screenArg?: string
  go: (s: Screen, arg?: string) => void
  settings: Settings
  updateSettings: (patch: Partial<Settings>) => void
  profile: Profile
  setProfile: (p: Profile | ((p: Profile) => Profile)) => void
  session: Session | null
  setSession: (s: Session | null | ((s: Session | null) => Session | null)) => void
  say: (cat: LineCategory, opts?: { expr?: Expression; force?: boolean; text?: string }) => void
  benny: BennyMsg | null
  bennyMood: Expression
  setBennyMood: (e: Expression) => void
  dismissBenny: () => void
  toasts: Toast[]
  celebrate: (achIds: string[]) => void
  sfx: (s: Sfx) => void
  reducedMotion: boolean
  boop: () => void
  lastMode: ModeId | null
  setLastMode: (m: ModeId) => void
}

const Ctx = createContext<AppApi | null>(null)
export const useApp = () => {
  const c = useContext(Ctx)
  if (!c) throw new Error('useApp outside provider')
  return c
}

const KNOWN = new Set(LOCATIONS.map((l) => l.id))

export function AppProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(loadSettings)
  const [profile, setProfileState] = useState<Profile>(loadProfile)
  const [session, setSessionState] = useState<Session | null>(() => loadSession(KNOWN))
  const [screen, setScreen] = useState<Screen>('home')
  const [screenArg, setScreenArg] = useState<string | undefined>()
  const [benny, setBenny] = useState<BennyMsg | null>(null)
  const [bennyMood, setBennyMood] = useState<Expression>('happy')
  const [toasts, setToasts] = useState<Toast[]>([])
  const [lastMode, setLastMode] = useState<ModeId | null>(null)
  const idRef = useRef(1)
  const hideTimer = useRef<number | undefined>(undefined)
  const boopStreak = useRef<{ n: number; t: number }>({ n: 0, t: 0 })

  const [systemReduced, setSystemReduced] = useState(() => {
    try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches } catch { return false }
  })
  useEffect(() => {
    try {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
      const on = () => setSystemReduced(mq.matches)
      mq.addEventListener('change', on)
      return () => mq.removeEventListener('change', on)
    } catch { return undefined }
  }, [])
  const reducedMotion = settings.motion === 'reduced' || (settings.motion === 'system' && systemReduced)
  useEffect(() => { document.documentElement.dataset.motion = reducedMotion ? 'reduced' : 'full' }, [reducedMotion])

  useEffect(() => { setSoundEnabled(settings.sound); saveSettings(settings) }, [settings])
  useEffect(() => { saveProfile(profile) }, [profile])
  useEffect(() => { saveSession(session) }, [session])

  const updateSettings = useCallback((patch: Partial<Settings>) => setSettings((s) => ({ ...s, ...patch })), [])
  const setProfile = useCallback((p: Profile | ((p: Profile) => Profile)) => setProfileState(p), [])
  const setSession = useCallback((s: Session | null | ((s: Session | null) => Session | null)) => setSessionState(s), [])
  const sfx = useCallback((s: Sfx) => { if (settings.sound) play(s) }, [settings.sound])

  const go = useCallback((s: Screen, arg?: string) => {
    setScreen(s)
    setScreenArg(arg)
    try { window.scrollTo(0, 0) } catch { /* ignore */ }
  }, [])

  const dismissBenny = useCallback(() => setBenny(null), [])

  const say = useCallback((cat: LineCategory, opts?: { expr?: Expression; force?: boolean; text?: string }) => {
    const expr = opts?.expr ?? EXPRESSION_FOR[cat] ?? 'happy'
    setBennyMood(expr)
    if (settings.benny === 'off' && !opts?.force) return
    if (settings.benny === 'quiet' && !KEY_MOMENTS.includes(cat) && !opts?.force) return
    if (!LINES[cat]?.length && !opts?.text) return
    const text = opts?.text ?? pickLine(cat)
    const id = idRef.current++
    setBenny({ id, text, expr })
    window.clearTimeout(hideTimer.current)
    hideTimer.current = window.setTimeout(() => setBenny((b) => (b?.id === id ? null : b)), Math.min(7000, 2600 + text.length * 45))
  }, [settings.benny])

  const celebrate = useCallback((ids: string[]) => {
    if (!ids.length) return
    const add = ids.map((achId) => ({ id: idRef.current++, achId }))
    setToasts((t) => [...t, ...add])
    sfx('achievement')
    for (const a of add) window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== a.id)), 4200)
  }, [sfx])

  const boop = useCallback(() => {
    sfx('boop')
    const now = Date.now()
    const s = boopStreak.current
    s.n = now - s.t < 1500 ? s.n + 1 : 1
    s.t = now
    const next = { ...profile, counters: { ...profile.counters, boops: profile.counters.boops + 1 } }
    const res = awardAchievements({ profile: next, mode: 'worldtour', boops: next.counters.boops })
    setProfileState(res.profile)
    celebrate(res.earned)
    if (bennyMood === 'sleepy') say('wake', { force: true })
    else if (s.n === 7) say('pokeSecret', { force: true })
    else say('poke', { expr: (['happy', 'excited', 'curious', 'skeptical', 'surprised', 'proud'] as Expression[])[Math.floor(Math.random() * 6)] })
  }, [sfx, say, celebrate, profile, bennyMood])

  const value = useMemo<AppApi>(() => ({
    screen, screenArg, go, settings, updateSettings, profile, setProfile, session, setSession, say, benny, bennyMood,
    setBennyMood, dismissBenny, toasts, celebrate, sfx, reducedMotion, boop, lastMode, setLastMode,
  }), [screen, screenArg, go, settings, updateSettings, profile, setProfile, session, setSession, say, benny, bennyMood,
    dismissBenny, toasts, celebrate, sfx, reducedMotion, boop, lastMode])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
