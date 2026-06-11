import type { AmiAmiItem } from '../types'

const WORKER_URL = 'https://amiami-proxy.gloryko7513.workers.dev'

export async function searchAmiAmiFigures(
  keyword: string,
  signal?: AbortSignal,
): Promise<AmiAmiItem[]> {
  const params = new URLSearchParams({ keyword })
  const res = await fetch(`${WORKER_URL}?${params}`, { signal })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`サーバーエラー (${res.status})${text ? `: ${text.slice(0, 200)}` : ''}`)
  }
  const json = (await res.json()) as Record<string, unknown>
  // Support nested format: { RValue: { items: [] } } or flat { items: [] }
  const nested = json.RValue as Record<string, unknown> | undefined
  const items = (json.items ?? nested?.items ?? json.results ?? []) as AmiAmiItem[]
  if (!Array.isArray(items)) {
    throw new Error(`予期しないレスポンス形式: ${JSON.stringify(json).slice(0, 300)}`)
  }
  return items
}

/** AmiAmiの日付文字列 ("2024-03" や "2024-03下旬") → "YYYY-MM-01" */
export function parseAmiAmiDate(raw: string | undefined): string {
  if (!raw) return ''
  const m = raw.match(/(\d{4})-(\d{2})/)
  if (!m) return ''
  return `${m[1]}-${m[2]}-01`
}

/** サムネイル URL を絶対 URL に変換 */
export function resolveThumbUrl(raw: string | undefined): string {
  if (!raw) return ''
  if (raw.startsWith('//')) return `https:${raw}`
  return raw
}
