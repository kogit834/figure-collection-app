/**
 * AmiAmi 検索プロキシ - Cloudflare Worker
 *
 * 【デプロイ手順】
 * 1. https://dash.cloudflare.com/ → Workers → amiami-proxy を開く
 * 2. このファイルの内容で全文置き換えてデプロイ
 */

// ===================================================================
// ▼ 既存 Worker の X-User-Key をここに貼る
// ===================================================================
const AMIAMI_USER_KEY = 'amiami_website_production'
// ===================================================================

export default {
  async fetch(request) {
    const url = new URL(request.url)

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Content-Type': 'application/json',
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders })
    }

    const keyword = url.searchParams.get('keyword') || ''
    if (!keyword.trim()) {
      return new Response(JSON.stringify({ items: [] }), { headers: corsHeaders })
    }

    try {
      const apiUrl = new URL('https://api.amiami.com/api/v1.0/items')
      apiUrl.searchParams.set('pagemax', '20')
      apiUrl.searchParams.set('s_keywords', keyword)
      apiUrl.searchParams.set('lang', 'ja')

      const apiRes = await fetch(apiUrl.toString(), {
        headers: {
          'X-User-Key': AMIAMI_USER_KEY,
          'Accept': 'application/json',
          'Accept-Language': 'ja,en;q=0.9',
          'Referer': 'https://www.amiami.jp/',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Origin': 'https://www.amiami.jp',
        },
      })

      if (!apiRes.ok) {
        const text = await apiRes.text().catch(() => '')
        return new Response(
          JSON.stringify({ error: `AmiAmi API ${apiRes.status}: ${text.slice(0, 200)}`, items: [] }),
          { status: apiRes.status, headers: corsHeaders },
        )
      }

      const data = await apiRes.json()
      const items = data?.items ?? data?.RValue?.items ?? []

      return new Response(JSON.stringify({ items }), { headers: corsHeaders })
    } catch (e) {
      return new Response(
        JSON.stringify({ error: String(e), items: [] }),
        { status: 500, headers: corsHeaders },
      )
    }
  },
}
