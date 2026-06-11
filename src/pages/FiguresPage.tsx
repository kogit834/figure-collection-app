import { useMemo, useState } from 'react'
import type { Figure, FigureStatus } from '../types'
import { FIGURE_STATUS_LABELS } from '../types'
import { daysUntil, formatDate, formatYen, newId, today } from '../utils'
import { Modal } from '../components/Modal'
import { StatusBadge } from '../components/StatusBadge'
import { EmptyState } from '../components/EmptyState'

const STATUS_COLORS: Record<FigureStatus, 'blue' | 'amber' | 'green'> = {
  upcoming: 'blue',
  preorder: 'amber',
  released: 'green',
}

type Filter = 'all' | FigureStatus

interface FiguresPageProps {
  figures: Figure[]
  setFigures: (update: (prev: Figure[]) => Figure[]) => void
}

interface FormState {
  name: string
  manufacturer: string
  series: string
  releaseDate: string
  price: string
  scale: string
  imageUrl: string
  status: FigureStatus
}

const EMPTY_FORM: FormState = {
  name: '',
  manufacturer: '',
  series: '',
  releaseDate: '',
  price: '',
  scale: '',
  imageUrl: '',
  status: 'upcoming',
}

export function FiguresPage({ figures, setFigures }: FiguresPageProps) {
  const [filter, setFilter] = useState<Filter>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)

  const visibleFigures = useMemo(() => {
    const filtered =
      filter === 'all' ? figures : figures.filter((f) => f.status === filter)
    // 発売日が近い順（日付未定は末尾）
    return [...filtered].sort((a, b) => {
      if (!a.releaseDate) return 1
      if (!b.releaseDate) return -1
      return a.releaseDate.localeCompare(b.releaseDate)
    })
  }, [figures, filter])

  const openAdd = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  const openEdit = (figure: Figure) => {
    setEditingId(figure.id)
    setForm({
      name: figure.name,
      manufacturer: figure.manufacturer,
      series: figure.series,
      releaseDate: figure.releaseDate,
      price: figure.price !== null ? String(figure.price) : '',
      scale: figure.scale,
      imageUrl: figure.imageUrl,
      status: figure.status,
    })
    setModalOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    const data = {
      name: form.name.trim(),
      manufacturer: form.manufacturer.trim(),
      series: form.series.trim(),
      releaseDate: form.releaseDate,
      price: form.price === '' ? null : Number(form.price),
      scale: form.scale.trim(),
      imageUrl: form.imageUrl.trim(),
      status: form.status,
    }
    if (editingId) {
      setFigures((prev) =>
        prev.map((f) => (f.id === editingId ? { ...f, ...data } : f)),
      )
    } else {
      setFigures((prev) => [
        ...prev,
        { ...data, id: newId(), createdAt: today() },
      ])
    }
    setModalOpen(false)
  }

  const handleDelete = (figure: Figure) => {
    if (!window.confirm(`「${figure.name}」を削除しますか？`)) return
    setFigures((prev) => prev.filter((f) => f.id !== figure.id))
  }

  const set = (patch: Partial<FormState>) =>
    setForm((prev) => ({ ...prev, ...patch }))

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">発売情報</h1>
        <button type="button" className="btn-primary text-sm" onClick={openAdd}>
          ＋ 追加
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {(['all', 'upcoming', 'preorder', 'released'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors ${
              filter === f
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-slate-600 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            {f === 'all' ? 'すべて' : FIGURE_STATUS_LABELS[f]}
          </button>
        ))}
      </div>

      {visibleFigures.length === 0 ? (
        <EmptyState
          message="商品が登録されていません"
          hint="「＋ 追加」から発売情報を登録しましょう"
        />
      ) : (
        <ul className="space-y-3">
          {visibleFigures.map((figure) => {
            const days = daysUntil(figure.releaseDate)
            return (
              <li key={figure.id} className="card overflow-hidden">
                <div className="flex gap-3 p-3">
                  {figure.imageUrl ? (
                    <img
                      src={figure.imageUrl}
                      alt={figure.name}
                      className="h-20 w-20 shrink-0 rounded-lg bg-slate-200 object-cover dark:bg-slate-700"
                      onError={(e) => {
                        e.currentTarget.style.visibility = 'hidden'
                      }}
                    />
                  ) : (
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-slate-400 dark:bg-slate-700 dark:text-slate-500">
                      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 19.5h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5z"
                        />
                      </svg>
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold leading-snug">{figure.name}</p>
                      <StatusBadge
                        label={FIGURE_STATUS_LABELS[figure.status]}
                        color={STATUS_COLORS[figure.status]}
                      />
                    </div>
                    <p className="mt-0.5 truncate text-sm text-slate-500 dark:text-slate-400">
                      {[figure.manufacturer, figure.series, figure.scale]
                        .filter(Boolean)
                        .join(' / ') || '詳細未登録'}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 text-sm">
                      <span>
                        {formatDate(figure.releaseDate)}
                        {days !== null && days > 0 && figure.status !== 'released' && (
                          <span
                            className={`ml-1 font-semibold ${
                              days <= 7
                                ? 'text-rose-600 dark:text-rose-400'
                                : 'text-indigo-600 dark:text-indigo-400'
                            }`}
                          >
                            あと{days}日
                          </span>
                        )}
                      </span>
                      <span className="font-medium">{formatYen(figure.price)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex divide-x divide-slate-200 border-t border-slate-200 text-sm dark:divide-slate-800 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => openEdit(figure)}
                    className="flex-1 py-2 font-medium text-slate-600 active:bg-slate-100 dark:text-slate-300 dark:active:bg-slate-800"
                  >
                    編集
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(figure)}
                    className="flex-1 py-2 font-medium text-rose-600 active:bg-rose-50 dark:text-rose-400 dark:active:bg-rose-950"
                  >
                    削除
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <Modal
        title={editingId ? '発売情報を編集' : '発売情報を追加'}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      >
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="label" htmlFor="fig-name">商品名 *</label>
            <input
              id="fig-name"
              className="input"
              required
              value={form.name}
              onChange={(e) => set({ name: e.target.value })}
              placeholder="例: ねんどろいど 初音ミク"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="fig-maker">メーカー</label>
              <input
                id="fig-maker"
                className="input"
                value={form.manufacturer}
                onChange={(e) => set({ manufacturer: e.target.value })}
              />
            </div>
            <div>
              <label className="label" htmlFor="fig-series">シリーズ</label>
              <input
                id="fig-series"
                className="input"
                value={form.series}
                onChange={(e) => set({ series: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="fig-date">発売日</label>
              <input
                id="fig-date"
                type="date"
                className="input"
                value={form.releaseDate}
                onChange={(e) => set({ releaseDate: e.target.value })}
              />
            </div>
            <div>
              <label className="label" htmlFor="fig-price">価格（定価・円）</label>
              <input
                id="fig-price"
                type="number"
                min="0"
                inputMode="numeric"
                className="input"
                value={form.price}
                onChange={(e) => set({ price: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="fig-scale">スケール</label>
              <input
                id="fig-scale"
                className="input"
                value={form.scale}
                onChange={(e) => set({ scale: e.target.value })}
                placeholder="例: 1/7"
              />
            </div>
            <div>
              <label className="label" htmlFor="fig-status">ステータス</label>
              <select
                id="fig-status"
                className="input"
                value={form.status}
                onChange={(e) => set({ status: e.target.value as FigureStatus })}
              >
                {Object.entries(FIGURE_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="label" htmlFor="fig-image">商品画像URL</label>
            <input
              id="fig-image"
              type="url"
              className="input"
              value={form.imageUrl}
              onChange={(e) => set({ imageUrl: e.target.value })}
              placeholder="https://..."
            />
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
              {editingId ? '保存' : '追加'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
