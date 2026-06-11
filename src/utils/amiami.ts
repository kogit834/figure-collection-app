import type { AmiAmiItem } from '../types'

const WORKER_URL = 'https://amiami-proxy.gloryko7513.workers.dev'

export async function searchAmiAmiFigures(
  keyword: string,
  signal?: AbortSignal,
): Promise<AmiAmiItem[]> {
  const params = new URLSearchParams({ keyword })
  const res = await fetch(`${WORKER_URL}?${params}`, { signal })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const json = await res.json()
  return (json.items ?? []) as AmiAmiItem[]
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
