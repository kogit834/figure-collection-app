import { useRef, useState } from 'react'
import type { AmiAmiItem, FavoriteWork, FavoriteSeries, Figure, PurchasePlan } from '../types'
import { newId, today } from '../utils'
import { parseAmiAmiDate, resolveThumbUrl, searchAmiAmiFigures } from '../utils/amiami'
import { EmptyState } from '../components/EmptyState'

interface SearchPageProps {
  works: FavoriteWork[]
  favoriteSeries: FavoriteSeries[]
  figures: Figure[]
  setFigures: (update: (prev: Figure[]) => Figure[]) => void
  plans: PurchasePlan[]
  setPlans: (update: (prev: PurchasePlan[]) => PurchasePlan[]) => void
}

type SearchState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'done'; items: AmiAmiItem[] }
  | { status: 'error'; message: string }

export function SearchPage({
  works,
  favoriteSeries,
  figures,
  setFigures,
  plans,
  setPlans,
}: SearchPageProps) {
  const [workInput, setWorkInput] = useState('')
  const [seriesInput, setSeriesInput] = useState('')
  const [searchState, setSearchState] = useState<SearchState>({ status: 'idle' })
  const abortRef = useRef<AbortController | null>(null)

  const handleSearch = async () => {
    const keyword = [workInput.trim(), seriesInput.trim()].filter(Boolean).join(' ')
    if (!keyword) return

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setSearchState({ status: 'loading' })

    try {
      const items = await searchAmiAmiFigures(keyword, controller.signal)
      const sorted = [...items].sort((a, b) => {
        if (!a.releasedate) return 1
        if (!b.releasedate) return -1
        return b.releasedate.localeCompare(a.releasedate)
      })
      setSearchState({ status: 'done', items: sorted })
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      setSearchState({
        status: 'error',
        message: 'フィギュア情報の取得に失敗しました。ネットワークを確認してください。',
      })
    }
  }

  const handleAddFigure = (item: AmiAmiItem) => {
    const releaseDate = parseAmiAmiDate(item.releasedate)
    const imageUrl = resolveThumbUrl(item.thumb_url)
    setFigures((prev) => [
      ...prev,
      {
        id: newId(),
        name: item.gname,
        manufacturer: item.maker_name ?? '',
        series: item.sname ?? '',
        releaseDate,
        price: item.min_price ?? null,
        scale: '',
        imageUrl,
        status: 'upcoming',
        createdAt: today(),
      },
    ])
  }

  const handleAddPlan = (item: AmiAmiItem) => {
    const linked = figures.find((f) => f.name === item.gname)
    setPlans((prev) => [
      ...prev,
      {
        id: newId(),
        figureId: linked?.id ?? null,
        name: item.gname,
        status: 'wanted',
        purchaseDate: '',
        purchasePrice: null,
        purchasePlace: '',
        memo: '',
        createdAt: today(),
      },
    ])
  }

  const isFigureAdded = (item: AmiAmiItem) => figures.some((f) => f.name === item.gname)
  const isPlanAdded = (item: AmiAmiItem) => plans.some((p) => p.name === item.gname)

  return (
    <div className="space-y-3">
      <h1 className="text-xl font-bold">商品検索</h1>

      <div className="card space-y-2 p-3">
        <div>
          <label className="label" htmlFor="search-work">作品名</label>
          <input
            id="search-work"
            list="work-options"
            className="input"
            value={workInput}
            onChange={(e) => setWorkInput(e.target.value)}
            placeholder="例: 鬼滅の刃（フリー入力可）"
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); handleSearch() }
            }}
          />
          {works.length > 0 && (
            <datalist id="work-options">
              {works.map((w) => (
                <option key={w.id} value={w.title} />
              ))}
            </datalist>
          )}
        </div>
        <div>
          <label className="label" htmlFor="search-series">商品シリーズ</label>
          <input
            id="search-series"
            list="series-options"
            className="input"
            value={seriesInput}
            onChange={(e) => setSeriesInput(e.target.value)}
            placeholder="例: ねんどろいど（フリー入力可）"
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); handleSearch() }
            }}
          />
          {favoriteSeries.length > 0 && (
            <datalist id="series-options">
              {favoriteSeries.map((s) => (
                <option key={s.id} value={s.name} />
              ))}
            </datalist>
          )}
        </div>
        <button
          type="button"
          className="btn-primary w-full"
          onClick={handleSearch}
          disabled={searchState.status === 'loading'}
        >
          {searchState.status === 'loading' ? (
            <span className="flex items-center justify-center gap-2">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              検索中…
            </span>
          ) : (
            '検索'
          )}
        </button>
      </div>

      {searchState.status === 'idle' && (
        <EmptyState
          message="作品名やシリーズ名で検索"
          hint="設定から好きな作品・シリーズを登録すると入力候補が表示されます"
        />
      )}

      {searchState.status === 'error' && (
        <div className="card p-3 text-sm text-rose-600 dark:text-rose-400">
          {searchState.message}
        </div>
      )}

      {searchState.status === 'done' && searchState.items.length === 0 && (
        <EmptyState
          message="商品が見つかりませんでした"
          hint="別のキーワードで試してみてください"
        />
      )}

      {searchState.status === 'done' && searchState.items.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {searchState.items.length} 件見つかりました（AmiAmi · 発売日新しい順）
          </p>
          <ul className="space-y-2">
            {searchState.items.map((item) => {
              const figAdded = isFigureAdded(item)
              const planAdded = isPlanAdded(item)
              const thumb = resolveThumbUrl(item.thumb_url)
              return (
                <li key={item.gcode} className="card overflow-hidden">
                  <div className="flex gap-3 p-3">
                    {thumb ? (
                      <img
                        src={thumb}
                        alt={item.gname}
                        className="h-20 w-20 shrink-0 rounded-lg bg-slate-200 object-cover dark:bg-slate-700"
                        onError={(e) => {
                          e.currentTarget.style.visibility = 'hidden'
                        }}
                      />
                    ) : (
                      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-slate-400 dark:bg-slate-700 dark:text-slate-500">
                        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 19.5h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5z" />
                        </svg>
                      </div>
                    )}
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="text-sm font-semibold leading-snug">{item.gname}</p>
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                        {[item.maker_name, item.sname].filter(Boolean).join(' / ') || '詳細不明'}
                      </p>
                      <div className="flex flex-wrap gap-x-2 text-xs text-slate-500 dark:text-slate-400">
                        {item.releasedate && <span>{item.releasedate}</span>}
                        {item.min_price != null && (
                          <span>¥{item.min_price.toLocaleString()}</span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        <button
                          type="button"
                          onClick={() => handleAddFigure(item)}
                          disabled={figAdded}
                          className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                            figAdded
                              ? 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                              : 'bg-indigo-100 text-indigo-700 active:bg-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-300'
                          }`}
                        >
                          {figAdded ? '発売情報に追加済み' : '＋ 発売情報に追加'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddPlan(item)}
                          disabled={planAdded}
                          className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                            planAdded
                              ? 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                              : 'bg-emerald-100 text-emerald-700 active:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300'
                          }`}
                        >
                          {planAdded ? '購入予定に追加済み' : '＋ 購入予定に追加'}
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
