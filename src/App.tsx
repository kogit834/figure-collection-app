import { useState } from 'react'
import type { Figure, PriceRecord, PurchasePlan } from './types'
import { useLocalStorage } from './hooks/useLocalStorage'
import { BottomNav, type Tab } from './components/BottomNav'
import { FiguresPage } from './pages/FiguresPage'
import { PurchasesPage } from './pages/PurchasesPage'
import { PricesPage } from './pages/PricesPage'

export default function App() {
  const [tab, setTab] = useState<Tab>('figures')
  const [figures, setFigures] = useLocalStorage<Figure[]>('fc:figures', [])
  const [plans, setPlans] = useLocalStorage<PurchasePlan[]>('fc:plans', [])
  const [records, setRecords] = useLocalStorage<PriceRecord[]>('fc:prices', [])

  return (
    <div className="mx-auto min-h-dvh max-w-[480px] px-4 pt-4 pb-24">
      {tab === 'figures' && (
        <FiguresPage figures={figures} setFigures={setFigures} />
      )}
      {tab === 'purchases' && (
        <PurchasesPage plans={plans} setPlans={setPlans} figures={figures} />
      )}
      {tab === 'prices' && (
        <PricesPage records={records} setRecords={setRecords} figures={figures} />
      )}
      <BottomNav active={tab} onChange={setTab} />
    </div>
  )
}
