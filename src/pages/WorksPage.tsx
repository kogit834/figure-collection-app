import { useRef, useState } from 'react'
import type { AmiAmiItem, FavoriteWork, Figure, PurchasePlan, WorkType } from '../types'
import { WORK_TYPE_LABELS } from '../types'
import { newId, today } from '../utils'
import { parseAmiAmiDate, resolveThumbUrl, searchAmiAmiFigures } from '../utils/amiami'
import { Modal } from '../components/Modal'
import { EmptyState } from '../components/EmptyState'

interface WorksPageProps {
  works: FavoriteWork[]
  setWorks: (update: (prev: FavoriteWork[]) => FavoriteWork[]) => void
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

const WORK_TYPE_COLORS: Record<WorkType, string> = {
  anime: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  manga: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
  game: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  other: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
}

export function WorksPage({
  works,
  setWorks,
  figures,
  setFigures,
  plans,
  setPlans,
}: WorksPageProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [formTitle, setFormTitle] = useState('')
  const [formType, setFormType] = useState<WorkType>('anime')

  // 現在検索対象の作品
  const [searchWork, setSearchWork] = useState<FavoriteWork | null>(null)
  const [searchState, setSearchState] = useState<SearchState>({ status: 'idle' })
  const abortRef = useRef<AbortController | null>(null)

  const openAdd = () => {
    setFormTitle('')
    setFormType('anime')
    setModalOpen(true)
  }

  const handleAddWork = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formTitle.trim()) return
    setWorks((prev) => [
      ...prev,
      { id: newId(), title: formTitle.trim(), type: formType, createdAt: today() },
    ])
    setModalOpen(false)
  }

  const handleDeleteWork = (work: FavoriteWork) => {
    if (!window.confirm(`「${work.title}」を削除しますか？`)) return
    setWorks((prev) => prev.filter((w) => w.id !== work.id))
    if (searchWork?.id === work.id) {
      setSearchWork(null)
      setSearchState({ status: 'idle' })
    }
  }

  const handleSearch = async (work: FavoriteWork) => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setSearchWork(work)
    setSearchState({ status: 'loading' })

    try {
      const items = await searchAmiAmiFigures(work.title, controller.signal)
      setSearchState({ status: 'done', items })
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
    // 既に発売情報にあれば figureId を紐付ける
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
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">好きな作品</h1>
        <button type="button" className="btn-primary text-sm" onClick={openAdd}>
          ＋ 追加
        </button>
      </div>

      {works.length === 0 ? (
        <EmptyState
          message="作品が登録されていません"
          hint="「＋ 追加」から好きな漫画・アニメを登録すると、関連フィギュアを検索できます"
        />
      ) : (
        <ul className="space-y-3">
          {works.map((work) => (
            <li key={work.id} className="card overflow-hidden">
              <div className="flex items-center gap-3 p-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${WORK_TYPE_COLORS[work.type]}`}
                    >
                      {WORK_TYPE_LABELS[work.type]}
                    </span>
                  </div>
                  <p className="mt-1 font-semibold">{work.title}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleSearch(work)}
                  className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    searchWork?.id === work.id && searchState.status !== 'idle'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-indigo-50 text-indigo-700 active:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300'
                  }`}
                >
                  {searchWork?.id === work.id && searchState.status === 'loading'
                    ? '検索中…'
                    : 'フィギュアを探す'}
                </button>
              </div>

              {/* 検索結果（この作品が選択中の場合のみ表示） */}
              {searchWork?.id === work.id && searchState.status !== 'idle' && (
                <div className="border-t border-slate-200 dark:border-slate-800">
                  {searchState.status === 'loading' && (
                    <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-500 dark:text-slate-400">
                      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                      AmiAmi で検索中…
                    </div>
                  )}

                  {searchState.status === 'error' && (
                    <div className="px-3 py-4 text-sm text-rose-600 dark:text-rose-400">
                      {searchState.message}
                    </div>
                  )}

                  {searchState.status === 'done' && searchState.items.length === 0 && (
                    <div className="px-3 py-4 text-sm text-slate-500 dark:text-slate-400">
                      「{work.title}」の商品が見つかりませんでした
                    </div>
                  )}

                  {searchState.status === 'done' && searchState.items.length > 0 && (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      <p className="px-3 py-2 text-xs text-slate-500 dark:text-slate-400">
                        {searchState.items.length} 件見つかりました（AmiAmi）
                      </p>
                      {searchState.items.map((item) => {
                        const figAdded = isFigureAdded(item)
                        const planAdded = isPlanAdded(item)
                        const thumb = resolveThumbUrl(item.thumb_url)
                        return (
                          <div key={item.gcode} className="flex gap-3 p-3">
                            {thumb ? (
                              <img
                                src={thumb}
                                alt={item.gname}
                                className="h-16 w-16 shrink-0 rounded-lg bg-slate-200 object-cover dark:bg-slate-700"
                                onError={(e) => {
                                  e.currentTarget.style.visibility = 'hidden'
                                }}
                              />
                            ) : (
                              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-slate-400 dark:bg-slate-700 dark:text-slate-500">
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
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
                              <div className="flex gap-1.5 pt-0.5">
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
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              <div className="flex border-t border-slate-200 text-sm dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => handleDeleteWork(work)}
                  className="flex-1 py-2 font-medium text-rose-600 active:bg-rose-50 dark:text-rose-400 dark:active:bg-rose-950"
                >
                  削除
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal title="好きな作品を追加" open={modalOpen} onClose={() => setModalOpen(false)}>
        <form onSubmit={handleAddWork} className="space-y-3">
          <div>
            <label className="label" htmlFor="work-title">
              作品名 *
            </label>
            <input
              id="work-title"
              className="input"
              required
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="例: 鬼滅の刃"
              autoFocus
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              入力した名前でフィギュアを検索します
            </p>
          </div>
          <div>
            <label className="label" htmlFor="work-type">
              ジャンル
            </label>
            <select
              id="work-type"
              className="input"
              value={formType}
              onChange={(e) => setFormType(e.target.value as WorkType)}
            >
              {(Object.entries(WORK_TYPE_LABELS) as [WorkType, string][]).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              className="btn-secondary flex-1"
              onClick={() => setModalOpen(false)}
            >
              キャンセル
            </button>
            <button type="submit" className="btn-primary flex-1">
              追加
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
