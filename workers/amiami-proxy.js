/**
 * AmiAmi 検索プロキシ - Cloudflare Worker
 *
 * 【デプロイ手順】
 * 1. https://dash.cloudflare.com/ → Workers → amiami-proxy を開く
 * 2. このファイルの内容で全文置き換えてデプロイ
 *
 * 既存Workerの X-User-Key が不明な場合は既存コードからコピーしてください。
 */

// ===================================================================
// ▼ 既存 Worker の X-User-Key をここに貼る
// ===================================================================
const AMIAMI_USER_KEY = 'amiami_website_production'
// ===================================================================

export default {
  async fetch(request) {
    const url = new URL(request.url)

    // すべてのオリジンを許可（GitHub Pages含む）
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Content-Type': 'application/json',
    }

    // CORS プリフライト
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
      apiUrl.searchParams.set('s_st_list_newitem_available', '1')

      const apiRes = await fetch(apiUrl.toString(), {
        headers: {
          'X-User-Key': AMIAMI_USER_KEY,
          'Accept': 'application/json',
          'Referer': 'https://www.amiami.jp/',
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
      // AmiAmi は { items: [] } または { RValue: { items: [] } } を返す
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
