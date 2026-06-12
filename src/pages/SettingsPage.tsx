import { useState } from 'react'
import type { FavoriteWork, FavoriteSeries, WorkType } from '../types'
import { WORK_TYPE_LABELS } from '../types'
import { newId, today } from '../utils'
import { Modal } from '../components/Modal'
import { EmptyState } from '../components/EmptyState'

interface SettingsPageProps {
  works: FavoriteWork[]
  setWorks: (update: (prev: FavoriteWork[]) => FavoriteWork[]) => void
  favoriteSeries: FavoriteSeries[]
  setFavoriteSeries: (update: (prev: FavoriteSeries[]) => FavoriteSeries[]) => void
}

const WORK_TYPE_COLORS: Record<WorkType, string> = {
  anime: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  manga: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
  game: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  other: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
}

export function SettingsPage({
  works,
  setWorks,
  favoriteSeries,
  setFavoriteSeries,
}: SettingsPageProps) {
  const [workModalOpen, setWorkModalOpen] = useState(false)
  const [seriesModalOpen, setSeriesModalOpen] = useState(false)
  const [workTitle, setWorkTitle] = useState('')
  const [workType, setWorkType] = useState<WorkType>('anime')
  const [seriesName, setSeriesName] = useState('')

  const handleAddWork = (e: React.FormEvent) => {
    e.preventDefault()
    if (!workTitle.trim()) return
    setWorks((prev) => [
      ...prev,
      { id: newId(), title: workTitle.trim(), type: workType, createdAt: today() },
    ])
    setWorkModalOpen(false)
    setWorkTitle('')
  }

  const handleDeleteWork = (work: FavoriteWork) => {
    if (!window.confirm(`「${work.title}」を削除しますか？`)) return
    setWorks((prev) => prev.filter((w) => w.id !== work.id))
  }

  const handleAddSeries = (e: React.FormEvent) => {
    e.preventDefault()
    if (!seriesName.trim()) return
    setFavoriteSeries((prev) => [
      ...prev,
      { id: newId(), name: seriesName.trim(), createdAt: today() },
    ])
    setSeriesModalOpen(false)
    setSeriesName('')
  }

  const handleDeleteSeries = (series: FavoriteSeries) => {
    if (!window.confirm(`「${series.name}」を削除しますか？`)) return
    setFavoriteSeries((prev) => prev.filter((s) => s.id !== series.id))
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">設定</h1>

      {/* 好きな作品 */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">好きな作品</h2>
          <button
            type="button"
            className="btn-primary text-sm"
            onClick={() => setWorkModalOpen(true)}
          >
            ＋ 追加
          </button>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          登録した作品は検索ページの入力候補に表示されます
        </p>
        {works.length === 0 ? (
          <EmptyState
            message="作品が登録されていません"
            hint="「＋ 追加」から好きな漫画・アニメを登録しましょう"
          />
        ) : (
          <ul className="space-y-2">
            {works.map((work) => (
              <li key={work.id} className="card flex items-center gap-3 p-3">
                <div className="min-w-0 flex-1">
                  <span
                    className={`mr-2 rounded-full px-2 py-0.5 text-xs font-medium ${WORK_TYPE_COLORS[work.type]}`}
                  >
                    {WORK_TYPE_LABELS[work.type]}
                  </span>
                  <span className="font-medium">{work.title}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteWork(work)}
                  className="shrink-0 text-sm font-medium text-rose-600 dark:text-rose-400"
                >
                  削除
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 好きな商品シリーズ */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">好きな商品シリーズ</h2>
          <button
            type="button"
            className="btn-primary text-sm"
            onClick={() => setSeriesModalOpen(true)}
          >
            ＋ 追加
          </button>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          登録したシリーズは検索ページの入力候補に表示されます
        </p>
        {favoriteSeries.length === 0 ? (
          <EmptyState
            message="シリーズが登録されていません"
            hint="「＋ 追加」からねんどろいどなどのシリーズを登録しましょう"
          />
        ) : (
          <ul className="space-y-2">
            {favoriteSeries.map((series) => (
              <li key={series.id} className="card flex items-center gap-3 p-3">
                <span className="min-w-0 flex-1 font-medium">{series.name}</span>
                <button
                  type="button"
                  onClick={() => handleDeleteSeries(series)}
                  className="shrink-0 text-sm font-medium text-rose-600 dark:text-rose-400"
                >
                  削除
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 好きな作品追加モーダル */}
      <Modal title="好きな作品を追加" open={workModalOpen} onClose={() => setWorkModalOpen(false)}>
        <form onSubmit={handleAddWork} className="space-y-3">
          <div>
            <label className="label" htmlFor="work-title">作品名 *</label>
            <input
              id="work-title"
              className="input"
              required
              value={workTitle}
              onChange={(e) => setWorkTitle(e.target.value)}
              placeholder="例: 鬼滅の刃"
              autoFocus
            />
          </div>
          <div>
            <label className="label" htmlFor="work-type">ジャンル</label>
            <select
              id="work-type"
              className="input"
              value={workType}
              onChange={(e) => setWorkType(e.target.value as WorkType)}
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
              onClick={() => setWorkModalOpen(false)}
            >
              キャンセル
            </button>
            <button type="submit" className="btn-primary flex-1">
              追加
            </button>
          </div>
        </form>
      </Modal>

      {/* 好きなシリーズ追加モーダル */}
      <Modal title="好きなシリーズを追加" open={seriesModalOpen} onClose={() => setSeriesModalOpen(false)}>
        <form onSubmit={handleAddSeries} className="space-y-3">
          <div>
            <label className="label" htmlFor="series-name">シリーズ名 *</label>
            <input
              id="series-name"
              className="input"
              required
              value={seriesName}
              onChange={(e) => setSeriesName(e.target.value)}
              placeholder="例: ねんどろいど"
              autoFocus
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              className="btn-secondary flex-1"
              onClick={() => setSeriesModalOpen(false)}
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
