import type { AmiAmiItem } from '../types'

// AmiAmi の公開 API（自社フロントエンドが使用しているエンドポイント）
const API_BASE = 'https://api.amiami.com/api/v1.0/items'
// ブラウザから直接 API を叩くと CORS で弾かれるため、プロキシを経由する
const CORS_PROXY = 'https://corsproxy.io/?'

export async function searchAmiAmiFigures(
  keyword: string,
  signal?: AbortSignal,
): Promise<AmiAmiItem[]> {
  const params = new URLSearchParams({
    s_keywords: keyword,
    pagemax: '30',
    lang: 'jpn',
  })
  const target = `${API_BASE}?${params}`
  const res = await fetch(`${CORS_PROXY}${encodeURIComponent(target)}`, {
    headers: { 'X-User-Key': 'amiami_7de3b72c' },
    signal,
  })
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
