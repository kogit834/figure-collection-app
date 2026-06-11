import { useMemo, useState } from 'react'
import type { Figure, Platform, PriceRecord } from '../types'
import { CONDITION_OPTIONS, PLATFORM_LABELS } from '../types'
import { calcPriceStats, formatDate, formatYen, newId, today } from '../utils'
import { Modal } from '../components/Modal'
import { EmptyState } from '../components/EmptyState'

interface PricesPageProps {
  records: PriceRecord[]
  setRecords: (update: (prev: PriceRecord[]) => PriceRecord[]) => void
  figures: Figure[]
}

interface FormState {
  surveyDate: string
  platform: Platform
  platformOther: string
  price: string
  condition: string
  url: string
}

const emptyForm = (): FormState => ({
  surveyDate: today(),
  platform: 'mercari',
  platformOther: '',
  price: '',
  condition: CONDITION_OPTIONS[0],
  url: '',
})

export function PricesPage({ records, setRecords, figures }: PricesPageProps) {
  const [figureId, setFigureId] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm)

  const selectedId = figureId || figures[0]?.id || ''
  const selectedFigure = figures.find((f) => f.id === selectedId)

  const figureRecords = useMemo(
    () =>
      records
        .filter((r) => r.figureId === selectedId)
        .sort((a, b) => b.surveyDate.localeCompare(a.surveyDate)),
    [records, selectedId],
  )

  const stats = useMemo(() => calcPriceStats(figureRecords), [figureRecords])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedId || form.price === '') return
    setRecords((prev) => [
      ...prev,
      {
        id: newId(),
        figureId: selectedId,
        surveyDate: form.surveyDate,
        platform: form.platform,
        platformOther: form.platform === 'other' ? form.platformOther.trim() : '',
        price: Number(form.price),
        condition: form.condition,
        url: form.url.trim(),
        createdAt: today(),
      },
    ])
    setModalOpen(false)
  }

  const handleDelete = (record: PriceRecord) => {
    if (!window.confirm('この価格データを削除しますか？')) return
    setRecords((prev) => prev.filter((r) => r.id !== record.id))
  }

  const platformName = (record: PriceRecord) =>
    record.platform === 'other' && record.platformOther
      ? record.platformOther
      : PLATFORM_LABELS[record.platform]

  const set = (patch: Partial<FormState>) =>
    setForm((prev) => ({ ...prev, ...patch }))

  if (figures.length === 0) {
    return (
      <div className="space-y-3">
        <h1 className="text-xl font-bold">価格調査</h1>
        <EmptyState
          message="商品が登録されていません"
          hint="まず「発売情報」タブで商品を登録してください"
        />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">価格調査</h1>
        <button
          type="button"
          className="btn-primary text-sm"
          onClick={() => {
            setForm(emptyForm())
            setModalOpen(true)
          }}
        >
          ＋ 記録
        </button>
      </div>

      <select
        aria-label="調査対象の商品"
        className="input"
        value={selectedId}
        onChange={(e) => setFigureId(e.target.value)}
      >
        {figures.map((f) => (
          <option key={f.id} value={f.id}>
            {f.name}
          </option>
        ))}
      </select>

      {stats && (
        <section className="card p-4">
          <h2 className="mb-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
            {selectedFigure?.name} の相場（{stats.count}件）
          </h2>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-xs text-slate-400">平均</p>
              <p className="font-bold tabular-nums text-indigo-600 dark:text-indigo-400">
                {formatYen(stats.average)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400">最高</p>
              <p className="font-bold tabular-nums">{formatYen(stats.max)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">最低</p>
              <p className="font-bold tabular-nums">{formatYen(stats.min)}</p>
            </div>
          </div>
          {selectedFigure?.price != null && (
            <p className="mt-2 text-center text-xs text-slate-400">
              定価 {formatYen(selectedFigure.price)}
            </p>
          )}
        </section>
      )}

      {figureRecords.length === 0 ? (
        <EmptyState
          message="価格データがありません"
          hint="「＋ 記録」からフリマでの価格を記録しましょう"
        />
      ) : (
        <ul className="space-y-2">
          {figureRecords.map((record) => (
            <li key={record.id} className="card flex items-center gap-3 p-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {platformName(record)}
                  </span>
                  <span className="text-xs text-slate-400">
                    {formatDate(record.surveyDate)}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {record.condition}
                  {record.url && (
                    <>
                      {' ・ '}
                      <a
                        href={record.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-500 underline"
                      >
                        リンク
                      </a>
                    </>
                  )}
                </p>
              </div>
              <p className="font-bold tabular-nums">{formatYen(record.price)}</p>
              <button
                type="button"
                onClick={() => handleDelete(record)}
                aria-label="削除"
                className="rounded-full p-1.5 text-slate-400 active:bg-slate-100 dark:active:bg-slate-800"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}

      <Modal
        title="価格を記録"
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      >
        <form onSubmit={handleSubmit} className="space-y-3">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            対象: {selectedFigure?.name}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="rec-date">調査日</label>
              <input
                id="rec-date"
                type="date"
                className="input"
                required
                value={form.surveyDate}
                onChange={(e) => set({ surveyDate: e.target.value })}
              />
            </div>
            <div>
              <label className="label" htmlFor="rec-price">価格（円） *</label>
              <input
                id="rec-price"
                type="number"
                min="0"
                inputMode="numeric"
                className="input"
                required
                value={form.price}
                onChange={(e) => set({ price: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="rec-platform">プラットフォーム</label>
            <select
              id="rec-platform"
              className="input"
              value={form.platform}
              onChange={(e) => set({ platform: e.target.value as Platform })}
            >
              {Object.entries(PLATFORM_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          {form.platform === 'other' && (
            <div>
              <label className="label" htmlFor="rec-platform-other">プラットフォーム名</label>
              <input
                id="rec-platform-other"
                className="input"
                value={form.platformOther}
                onChange={(e) => set({ platformOther: e.target.value })}
                placeholder="例: 駿河屋"
              />
            </div>
          )}
          <div>
            <label className="label" htmlFor="rec-condition">状態</label>
            <select
              id="rec-condition"
              className="input"
              value={form.condition}
              onChange={(e) => set({ condition: e.target.value })}
            >
              {CONDITION_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="rec-url">URL</label>
            <input
              id="rec-url"
              type="url"
              className="input"
              value={form.url}
              onChange={(e) => set({ url: e.target.value })}
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
              記録
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
