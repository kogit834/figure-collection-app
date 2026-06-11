import type { PurchasePlan } from '../types'

export function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

const yenFormatter = new Intl.NumberFormat('ja-JP', {
  style: 'currency',
  currency: 'JPY',
})

export function formatYen(price: number | null | undefined): string {
  if (price === null || price === undefined || Number.isNaN(price)) return '—'
  return yenFormatter.format(price)
}

/** YYYY-MM-DD → YYYY/M/D 表示。空なら '未定' */
export function formatDate(date: string): string {
  if (!date) return '未定'
  const [y, m, d] = date.split('-').map(Number)
  if (!y || !m || !d) return date
  return `${y}/${m}/${d}`
}

/** 今日を YYYY-MM-DD で返す */
export function today(): string {
  const now = new Date()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${m}-${d}`
}

/** 発売日までの残り日数。過去なら負数、日付なしは null */
export function daysUntil(date: string): number | null {
  if (!date) return null
  const target = new Date(`${date}T00:00:00`)
  if (Number.isNaN(target.getTime())) return null
  const now = new Date()
  const base = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((target.getTime() - base.getTime()) / 86_400_000)
}

export interface MonthlySummary {
  /** YYYY-MM */
  month: string
  total: number
  count: number
}

/** 購入済みプランを月別に集計（新しい月が先頭） */
export function calcMonthlySummary(plans: PurchasePlan[]): MonthlySummary[] {
  const byMonth = new Map<string, { total: number; count: number }>()
  for (const plan of plans) {
    if (plan.status !== 'purchased' || !plan.purchaseDate) continue
    const month = plan.purchaseDate.slice(0, 7)
    const entry = byMonth.get(month) ?? { total: 0, count: 0 }
    entry.total += plan.purchasePrice ?? 0
    entry.count += 1
    byMonth.set(month, entry)
  }
  return [...byMonth.entries()]
    .map(([month, { total, count }]) => ({ month, total, count }))
    .sort((a, b) => b.month.localeCompare(a.month))
}

/** YYYY-MM → YYYY年M月 */
export function formatMonth(month: string): string {
  const [y, m] = month.split('-').map(Number)
  if (!y || !m) return month
  return `${y}年${m}月`
}
