import type { AmiAmiItem } from '../types'

const API_BASE = 'https://api.amiami.com/api/v1.0/items'

// 試行順に並べた CORS 回避策
// 1. 直接アクセス（AmiAmi が CORS を許可している場合）
// 2. corsproxy.io（カスタムヘッダーを転送）
// 3. allorigins.win（シンプルなプロキシ、ヘッダー転送なし）
const STRATEGIES: {
  buildUrl: (target: string) => string
  headers?: Record<string, string>
}[] = [
  {
    buildUrl: (t) => t,
    headers: { 'X-User-Key': 'amiami_7de3b72c' },
  },
  {
    buildUrl: (t) => `https://corsproxy.io/?${encodeURIComponent(t)}`,
    headers: { 'X-User-Key': 'amiami_7de3b72c' },
  },
  {
    buildUrl: (t) => `https://api.allorigins.win/raw?url=${encodeURIComponent(t)}`,
  },
]

async function fetchWithStrategy(
  target: string,
  strategy: (typeof STRATEGIES)[number],
  signal?: AbortSignal,
): Promise<AmiAmiItem[]> {
  const res = await fetch(strategy.buildUrl(target), {
    headers: strategy.headers,
    signal,
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const json = await res.json()
  const items = json.items ?? []
  if (!Array.isArray(items)) throw new Error('unexpected response')
  return items as AmiAmiItem[]
}

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

  let lastError: Error = new Error('unknown')
  for (const strategy of STRATEGIES) {
    try {
      return await fetchWithStrategy(target, strategy, signal)
    } catch (err) {
      if ((err as Error).name === 'AbortError') throw err
      lastError = err as Error
    }
  }
  throw lastError
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
