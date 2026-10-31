import { Award } from 'lucide-react'
import { AppProvider, useApp, type Screen } from './app/AppContext'
import { ACH_BY_ID } from './data/achievements'
import { Home } from './screens/Home'
import { Credits, HowTo } from './screens/Info'
import { Achievements, Passport, Records } from './screens/Pages'
import { Play } from './screens/Play'
import { Settings } from './screens/Settings'
import { Summary } from './screens/Summary'

const SCREENS: Record<Screen, () => React.ReactElement> = {
  home: Home, play: Play, summary: Summary, records: Records, passport: Passport,
  achievements: Achievements, settings: Settings, howto: HowTo, credits: Credits,
}

function Toasts() {
  const { toasts } = useApp()
  return (
    <div className="toasts" aria-live="polite">
      {toasts.map((t) => {
        const a = ACH_BY_ID[t.achId]
        if (!a) return null
        return (
          <div key={t.id} className="toast">
            <span className="toast__icon"><Award size={20} /></span>
            <span><small>ACHIEVEMENT UNLOCKED</small><b>{a.title}</b></span>
          </div>
        )
      })}
    </div>
  )
}

function Shell() {
  const { screen } = useApp()
  const View = SCREENS[screen]
  return (
    <div className={`app app--${screen}`}>
      <main key={screen} className="screen">
        <View />
      </main>
      <Toasts />
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  )
}
