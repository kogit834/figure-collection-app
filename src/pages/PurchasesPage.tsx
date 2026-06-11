import { useMemo, useState } from 'react'
import type { Figure, PurchasePlan, PurchaseStatus } from '../types'
import { PURCHASE_STATUS_LABELS } from '../types'
import {
  calcMonthlySummary,
  formatDate,
  formatMonth,
  formatYen,
  newId,
  today,
} from '../utils'
import { Modal } from '../components/Modal'
import { StatusBadge } from '../components/StatusBadge'
import { EmptyState } from '../components/EmptyState'

const STATUS_COLORS: Record<
  PurchaseStatus,
  'pink' | 'amber' | 'green' | 'gray'
> = {
  wanted: 'pink',
  preordered: 'amber',
  purchased: 'green',
  skipped: 'gray',
}

interface PurchasesPageProps {
  plans: PurchasePlan[]
  setPlans: (update: (prev: PurchasePlan[]) => PurchasePlan[]) => void
  figures: Figure[]
}

interface FormState {
  figureId: string
  name: string
  status: PurchaseStatus
  purchaseDate: string
  purchasePrice: string
  purchasePlace: string
  memo: string
}

const EMPTY_FORM: FormState = {
  figureId: '',
  name: '',
  status: 'wanted',
  purchaseDate: '',
  purchasePrice: '',
  purchasePlace: '',
  memo: '',
}

export function PurchasesPage({ plans, setPlans, figures }: PurchasesPageProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)

  const figureNames = useMemo(
    () => new Map(figures.map((f) => [f.id, f.name])),
    [figures],
  )

  const planName = (plan: PurchasePlan) =>
    (plan.figureId && figureNames.get(plan.figureId)) || plan.name || '(名称未設定)'

  const summary = useMemo(() => calcMonthlySummary(plans), [plans])

  const openAdd = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  const openEdit = (plan: PurchasePlan) => {
    setEditingId(plan.id)
    setForm({
      figureId: plan.figureId ?? '',
      name: plan.name,
      status: plan.status,
      purchaseDate: plan.purchaseDate,
      purchasePrice:
        plan.purchasePrice !== null ? String(plan.purchasePrice) : '',
      purchasePlace: plan.purchasePlace,
      memo: plan.memo,
    })
    setModalOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.figureId && !form.name.trim()) return
    const data = {
      figureId: form.figureId || null,
      name: form.name.trim(),
      status: form.status,
      purchaseDate: form.purchaseDate,
      purchasePrice:
        form.purchasePrice === '' ? null : Number(form.purchasePrice),
      purchasePlace: form.purchasePlace.trim(),
      memo: form.memo.trim(),
    }
    if (editingId) {
      setPlans((prev) =>
        prev.map((p) => (p.id === editingId ? { ...p, ...data } : p)),
      )
    } else {
      setPlans((prev) => [
        ...prev,
        { ...data, id: newId(), createdAt: today() },
      ])
    }
    setModalOpen(false)
  }

  const handleDelete = (plan: PurchasePlan) => {
    if (!window.confirm(`「${planName(plan)}」を削除しますか？`)) return
    setPlans((prev) => prev.filter((p) => p.id !== plan.id))
  }

  const changeStatus = (plan: PurchasePlan, status: PurchaseStatus) => {
    setPlans((prev) =>
      prev.map((p) =>
        p.id === plan.id
          ? {
              ...p,
              status,
              // 購入済みに変えたとき購入日が未入力なら今日を入れる
              purchaseDate:
                status === 'purchased' && !p.purchaseDate
                  ? today()
                  : p.purchaseDate,
            }
          : p,
      ),
    )
  }

  const set = (patch: Partial<FormState>) =>
    setForm((prev) => ({ ...prev, ...patch }))

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">購入予定</h1>
        <button type="button" className="btn-primary text-sm" onClick={openAdd}>
          ＋ 追加
        </button>
      </div>

      {summary.length > 0 && (
        <section className="card p-4">
          <h2 className="mb-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
            月別購入金額
          </h2>
          <ul className="space-y-1.5">
            {summary.slice(0, 6).map((row) => (
              <li key={row.month} className="flex items-baseline justify-between">
                <span className="text-sm">
                  {formatMonth(row.month)}
                  <span className="ml-1.5 text-xs text-slate-400">
                    {row.count}件
                  </span>
                </span>
                <span className="font-bold tabular-nums">
                  {formatYen(row.total)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {plans.length === 0 ? (
        <EmptyState
          message="購入予定がありません"
          hint="「＋ 追加」から欲しい商品を登録しましょう"
        />
      ) : (
        <ul className="space-y-3">
          {plans.map((plan) => (
            <li key={plan.id} className="card p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold leading-snug">{planName(plan)}</p>
                  {plan.figureId && figureNames.has(plan.figureId) && (
                    <p className="text-xs text-indigo-500 dark:text-indigo-400">
                      発売情報と紐付け済み
                    </p>
                  )}
                </div>
                <StatusBadge
                  label={PURCHASE_STATUS_LABELS[plan.status]}
                  color={STATUS_COLORS[plan.status]}
                />
              </div>

              {plan.status === 'purchased' && (
                <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">
                  {formatDate(plan.purchaseDate)} ・ {formatYen(plan.purchasePrice)}
                  {plan.purchasePlace && ` ・ ${plan.purchasePlace}`}
                </p>
              )}
              {plan.memo && (
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {plan.memo}
                </p>
              )}

              <div className="mt-2.5 flex gap-1.5 overflow-x-auto">
                {(Object.keys(PURCHASE_STATUS_LABELS) as PurchaseStatus[]).map(
                  (status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => changeStatus(plan, status)}
                      className={`rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors ${
                        plan.status === status
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {PURCHASE_STATUS_LABELS[status]}
                    </button>
                  ),
                )}
              </div>

              <div className="mt-2.5 flex gap-3 border-t border-slate-200 pt-2 text-sm dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => openEdit(plan)}
                  className="font-medium text-slate-600 dark:text-slate-300"
                >
                  編集
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(plan)}
                  className="font-medium text-rose-600 dark:text-rose-400"
                >
                  削除
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal
        title={editingId ? '購入予定を編集' : '購入予定を追加'}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      >
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="label" htmlFor="plan-figure">発売情報から選択（任意）</label>
            <select
              id="plan-figure"
              className="input"
              value={form.figureId}
              onChange={(e) => set({ figureId: e.target.value })}
            >
              <option value="">紐付けしない</option>
              {figures.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>
          {!form.figureId && (
            <div>
              <label className="label" htmlFor="plan-name">商品名 *</label>
              <input
                id="plan-name"
                className="input"
                required
                value={form.name}
                onChange={(e) => set({ name: e.target.value })}
              />
            </div>
          )}
          <div>
            <label className="label" htmlFor="plan-status">ステータス</label>
            <select
              id="plan-status"
              className="input"
              value={form.status}
              onChange={(e) => set({ status: e.target.value as PurchaseStatus })}
            >
              {Object.entries(PURCHASE_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="plan-date">購入日</label>
              <input
                id="plan-date"
                type="date"
                className="input"
                value={form.purchaseDate}
                onChange={(e) => set({ purchaseDate: e.target.value })}
              />
            </div>
            <div>
              <label className="label" htmlFor="plan-price">購入価格（円）</label>
              <input
                id="plan-price"
                type="number"
                min="0"
                inputMode="numeric"
                className="input"
                value={form.purchasePrice}
                onChange={(e) => set({ purchasePrice: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="plan-place">購入場所（店舗名/URL）</label>
            <input
              id="plan-place"
              className="input"
              value={form.purchasePlace}
              onChange={(e) => set({ purchasePlace: e.target.value })}
              placeholder="例: あみあみ / https://..."
            />
          </div>
          <div>
            <label className="label" htmlFor="plan-memo">メモ</label>
            <input
              id="plan-memo"
              className="input"
              value={form.memo}
              onChange={(e) => set({ memo: e.target.value })}
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
