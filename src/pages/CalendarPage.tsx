import { useMemo, useState } from 'react'
import type { Figure, PurchasePlan } from '../types'

interface CalendarPageProps {
  figures: Figure[]
  plans: PurchasePlan[]
}

type EventType = 'release' | 'wanted' | 'preordered' | 'purchased'

interface CalendarEvent {
  date: string
  title: string
  type: EventType
  imageUrl?: string
}

const EVENT_COLORS: Record<EventType, string> = {
  release: 'bg-indigo-500',
  wanted: 'bg-pink-500',
  preordered: 'bg-amber-500',
  purchased: 'bg-green-500',
}

const EVENT_LABELS: Record<EventType, string> = {
  release: '発売',
  wanted: '欲しい',
  preordered: '予約済み',
  purchased: '購入済み',
}

const EVENT_BADGE_COLORS: Record<EventType, string> = {
  release: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
  wanted: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
  preordered: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  purchased: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
}

export function CalendarPage({ figures, plans }: CalendarPageProps) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const [year, month] = currentMonth.split('-').map(Number)

  const prevMonth = () => {
    const d = new Date(year, month - 2, 1)
    setCurrentMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
    setSelectedDate(null)
  }

  const nextMonth = () => {
    const d = new Date(year, month, 1)
    setCurrentMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
    setSelectedDate(null)
  }

  const figureMap = useMemo(
    () => new Map(figures.map((f) => [f.id, f])),
    [figures],
  )

  const events = useMemo<CalendarEvent[]>(() => {
    const result: CalendarEvent[] = []
    const figuresWithPlan = new Set(plans.map((p) => p.figureId).filter(Boolean))

    // 計画がない発売予定の figure
    for (const figure of figures) {
      if (!figure.releaseDate?.startsWith(currentMonth)) continue
      if (figuresWithPlan.has(figure.id)) continue
      result.push({
        date: figure.releaseDate,
        title: figure.name,
        type: 'release',
        imageUrl: figure.imageUrl || undefined,
      })
    }

    // 購入予定プラン
    for (const plan of plans) {
      if (plan.status === 'skipped') continue

      if (plan.status === 'purchased') {
        if (!plan.purchaseDate?.startsWith(currentMonth)) continue
        const fig = plan.figureId ? figureMap.get(plan.figureId) : undefined
        result.push({
          date: plan.purchaseDate,
          title: fig?.name || plan.name,
          type: 'purchased',
          imageUrl: fig?.imageUrl || undefined,
        })
        continue
      }

      // preordered / wanted: 紐付き figure の発売日を使用
      if (plan.figureId) {
        const fig = figureMap.get(plan.figureId)
        if (!fig?.releaseDate?.startsWith(currentMonth)) continue
        result.push({
          date: fig.releaseDate,
          title: fig.name,
          type: plan.status,
          imageUrl: fig.imageUrl || undefined,
        })
      }
    }

    return result.sort((a, b) => a.date.localeCompare(b.date))
  }, [currentMonth, figures, plans, figureMap])

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>()
    for (const event of events) {
      const list = map.get(event.date) ?? []
      list.push(event)
      map.set(event.date, list)
    }
    return map
  }, [events])

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month - 1, 1)
    const lastDay = new Date(year, month, 0)
    const daysInMonth = lastDay.getDate()
    const startDow = firstDay.getDay()

    const days: (string | null)[] = []
    for (let i = 0; i < startDow; i++) days.push(null)
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(
        `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      )
    }
    return days
  }, [year, month])

  const now = new Date()
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

  const displayEvents = selectedDate
    ? (eventsByDate.get(selectedDate) ?? [])
    : events

  return (
    <div className="space-y-3">
      {/* 月ナビゲーション */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={prevMonth}
          className="rounded-lg p-2 text-slate-600 active:bg-slate-100 dark:text-slate-300 dark:active:bg-slate-800"
          aria-label="前の月"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h1 className="text-lg font-bold">{year}年{month}月</h1>
        <button
          type="button"
          onClick={nextMonth}
          className="rounded-lg p-2 text-slate-600 active:bg-slate-100 dark:text-slate-300 dark:active:bg-slate-800"
          aria-label="次の月"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>

      {/* カレンダーグリッド */}
      <div className="card overflow-hidden">
        <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800">
          {['日', '月', '火', '水', '木', '金', '土'].map((day, i) => (
            <div
              key={day}
              className={`py-2 text-center text-xs font-medium ${
                i === 0
                  ? 'text-rose-500'
                  : i === 6
                    ? 'text-blue-500'
                    : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {calendarDays.map((dateStr, i) => {
            if (!dateStr) {
              return (
                <div
                  key={`empty-${i}`}
                  className="h-14 border-b border-r border-slate-100 dark:border-slate-800"
                />
              )
            }

            const dayNum = parseInt(dateStr.split('-')[2], 10)
            const dow = i % 7
            const dayEvents = eventsByDate.get(dateStr) ?? []
            const hasEvents = dayEvents.length > 0
            const isToday = dateStr === todayStr
            const isSelected = dateStr === selectedDate

            return (
              <button
                key={dateStr}
                type="button"
                onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                className={`relative flex h-14 flex-col items-center border-b border-r border-slate-100 pt-1 transition-colors dark:border-slate-800 ${
                  isSelected
                    ? 'bg-indigo-50 dark:bg-indigo-950/40'
                    : 'active:bg-slate-50 dark:active:bg-slate-800/50'
                }`}
              >
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                    isToday
                      ? 'bg-indigo-600 font-bold text-white'
                      : dow === 0
                        ? 'text-rose-500'
                        : dow === 6
                          ? 'text-blue-500'
                          : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {dayNum}
                </span>
                {hasEvents && (
                  <div className="mt-0.5 flex flex-wrap justify-center gap-0.5 px-0.5">
                    {dayEvents.slice(0, 3).map((ev, idx) => (
                      <span
                        key={idx}
                        className={`h-1.5 w-1.5 rounded-full ${EVENT_COLORS[ev.type]}`}
                      />
                    ))}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* 凡例 */}
      <div className="flex flex-wrap gap-3 text-xs text-slate-600 dark:text-slate-400">
        {(Object.entries(EVENT_LABELS) as [EventType, string][]).map(([type, label]) => (
          <span key={type} className="flex items-center gap-1">
            <span className={`h-2 w-2 rounded-full ${EVENT_COLORS[type]}`} />
            {label}
          </span>
        ))}
      </div>

      {/* イベントリスト */}
      {selectedDate && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-400">
            {selectedDate.replace(/-/g, '/')} のスケジュール
          </h2>
          {displayEvents.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              この日のイベントはありません
            </p>
          ) : (
            <EventList events={displayEvents} />
          )}
        </section>
      )}

      {!selectedDate && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-400">
            {year}年{month}月 のスケジュール（{events.length}件）
          </h2>
          {events.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-500 dark:text-slate-400">
              この月のスケジュールはありません
            </p>
          ) : (
            <EventList events={events} showDate />
          )}
        </section>
      )}
    </div>
  )
}

function EventList({
  events,
  showDate = false,
}: {
  events: CalendarEvent[]
  showDate?: boolean
}) {
  return (
    <ul className="space-y-2">
      {events.map((event, idx) => {
        const [, , d] = event.date.split('-')
        return (
          <li key={idx} className="card flex items-center gap-3 p-3">
            {showDate && (
              <div className="flex w-8 shrink-0 flex-col items-center">
                <span className="text-sm font-bold tabular-nums text-slate-700 dark:text-slate-300">
                  {parseInt(d, 10)}
                </span>
                <span className="text-xs text-slate-400">日</span>
              </div>
            )}
            {event.imageUrl ? (
              <img
                src={event.imageUrl}
                alt={event.title}
                className="h-12 w-12 shrink-0 rounded-lg bg-slate-200 object-cover dark:bg-slate-700"
                onError={(e) => {
                  e.currentTarget.style.visibility = 'hidden'
                }}
              />
            ) : (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-slate-400 dark:bg-slate-700 dark:text-slate-500">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 19.5h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5z"
                  />
                </svg>
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold leading-snug">{event.title}</p>
              <span
                className={`mt-0.5 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${EVENT_BADGE_COLORS[event.type]}`}
              >
                {EVENT_LABELS[event.type]}
              </span>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
