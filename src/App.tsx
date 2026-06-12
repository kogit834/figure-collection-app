import { useState } from 'react'
import type { FavoriteWork, FavoriteSeries, Figure, PurchasePlan } from './types'
import { useLocalStorage } from './hooks/useLocalStorage'
import { BottomNav, type Tab } from './components/BottomNav'
import { SearchPage } from './pages/SearchPage'
import { FiguresPage } from './pages/FiguresPage'
import { PurchasesPage } from './pages/PurchasesPage'
import { CalendarPage } from './pages/CalendarPage'
import { SettingsPage } from './pages/SettingsPage'

export default function App() {
  const [tab, setTab] = useState<Tab>('search')
  const [works, setWorks] = useLocalStorage<FavoriteWork[]>('fc:works', [])
  const [favoriteSeries, setFavoriteSeries] = useLocalStorage<FavoriteSeries[]>('fc:series', [])
  const [figures, setFigures] = useLocalStorage<Figure[]>('fc:figures', [])
  const [plans, setPlans] = useLocalStorage<PurchasePlan[]>('fc:plans', [])

  return (
    <div className="mx-auto min-h-dvh max-w-[480px] px-4 pt-4 pb-24">
      {tab === 'search' && (
        <SearchPage
          works={works}
          favoriteSeries={favoriteSeries}
          figures={figures}
          setFigures={setFigures}
          plans={plans}
          setPlans={setPlans}
        />
      )}
      {tab === 'figures' && (
        <FiguresPage
          figures={figures}
          setFigures={setFigures}
          plans={plans}
          setPlans={setPlans}
        />
      )}
      {tab === 'purchases' && (
        <PurchasesPage plans={plans} setPlans={setPlans} figures={figures} />
      )}
      {tab === 'calendar' && (
        <CalendarPage figures={figures} plans={plans} />
      )}
      {tab === 'settings' && (
        <SettingsPage
          works={works}
          setWorks={setWorks}
          favoriteSeries={favoriteSeries}
          setFavoriteSeries={setFavoriteSeries}
        />
      )}
      <BottomNav active={tab} onChange={setTab} />
    </div>
  )
}
