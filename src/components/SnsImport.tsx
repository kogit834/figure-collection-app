import { useRef, useState } from 'react'
import Anthropic from '@anthropic-ai/sdk'

export interface ExtractedFigureData {
  name?: string
  series?: string
  releaseDate?: string
  price?: string
  manufacturer?: string
}

interface SnsImportProps {
  onExtract: (data: ExtractedFigureData) => void
}

const EXTRACT_PROMPT = `以下の画像（またはテキスト）はフィギュアの販売・発売情報です。
次のフィールドをJSON形式で抽出してください。
取得できない項目はnullにしてください。
{
  "productName": "商品名",
  "category": "市販フィギュア | 一番くじ | クレーンゲーム景品 | 不明",
  "releaseDate": "YYYY-MM または YYYY-MM-DD",
  "price": 数値（円、数値のみ、文字列不可）,
  "seriesName": "作品・シリーズ名",
  "memo": "限定・受注生産などの補足"
}
JSONのみ返してください。説明文は不要です。`

export function SnsImport({ onExtract }: SnsImportProps) {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY as string | undefined
  if (!apiKey) return null

  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })

  const applyExtracted = (raw: Record<string, unknown>) => {
    const data: ExtractedFigureData = {}
    if (raw.productName) data.name = String(raw.productName)
    if (raw.seriesName) data.series = String(raw.seriesName)
    if (raw.releaseDate) data.releaseDate = normalizeDate(String(raw.releaseDate))
    if (raw.price != null && raw.price !== 'null') data.price = String(raw.price)
    onExtract(data)
    setError(null)
  }

  const parseResponse = (text: string): Record<string, unknown> => {
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('JSON not found')
    return JSON.parse(match[0]) as Record<string, unknown>
  }

  const extractFromImage = async (file: File) => {
    setLoading(true)
    setError(null)
    try {
      const base64 = await fileToBase64(file)
      const response = await client.messages.create({
        model: 'claude-opus-4-8',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: { type: 'base64', media_type: file.type as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp', data: base64 },
              },
              { type: 'text', text: EXTRACT_PROMPT },
            ],
          },
        ],
      })
      const textBlock = response.content.find((b) => b.type === 'text')
      if (!textBlock || textBlock.type !== 'text') throw new Error('No text')
      applyExtracted(parseResponse(textBlock.text))
    } catch {
      setError('読み取れませんでした。手入力してください')
    } finally {
      setLoading(false)
    }
  }

  const extractFromUrl = async () => {
    if (!url.trim()) return
    setLoading(true)
    setError(null)
    try {
      let pageText: string
      try {
        const res = await fetch(url)
        if (!res.ok) throw new Error('fetch failed')
        const html = await res.text()
        pageText = extractTextFromHtml(html)
      } catch {
        setError('URLの取得に失敗しました。画像でお試しください')
        setLoading(false)
        return
      }
      const response = await client.messages.create({
        model: 'claude-opus-4-8',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: `${EXTRACT_PROMPT}\n\n以下のページ情報から抽出してください：\n${pageText}`,
          },
        ],
      })
      const textBlock = response.content.find((b) => b.type === 'text')
      if (!textBlock || textBlock.type !== 'text') throw new Error('No text')
      applyExtracted(parseResponse(textBlock.text))
    } catch {
      setError('読み取れませんでした。手入力してください')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3 dark:border-indigo-800 dark:bg-indigo-950/40">
      <p className="mb-2 text-sm font-semibold text-indigo-700 dark:text-indigo-300">
        📎 SNS投稿から取り込む
      </p>

      <div className="space-y-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) extractFromImage(file)
            e.target.value = ''
          }}
        />

        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-indigo-300 bg-white py-2.5 text-sm text-indigo-600 transition-colors active:bg-indigo-50 disabled:opacity-50 dark:border-indigo-700 dark:bg-slate-900 dark:text-indigo-400"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          画像をアップロード
        </button>

        <div className="text-center text-xs text-slate-400">または</div>

        <div className="flex gap-2">
          <input
            type="url"
            className="input flex-1 text-sm"
            placeholder="URLを貼り付け"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={loading}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); extractFromUrl() } }}
          />
          <button
            type="button"
            onClick={extractFromUrl}
            disabled={loading || !url.trim()}
            className="btn-primary shrink-0 text-sm disabled:opacity-50"
          >
            読み取る
          </button>
        </div>
      </div>

      {loading && (
        <div className="mt-2 flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400">
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          読み取り中...
        </div>
      )}

      {error && (
        <p className="mt-2 text-sm text-rose-600 dark:text-rose-400">{error}</p>
      )}
    </div>
  )
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(',')[1])
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function extractTextFromHtml(html: string): string {
  const ogTitle = html.match(/property="og:title"\s+content="([^"]+)"/)?.[1]
    ?? html.match(/content="([^"]+)"\s+property="og:title"/)?.[1]
    ?? ''
  const ogDesc = html.match(/property="og:description"\s+content="([^"]+)"/)?.[1]
    ?? html.match(/content="([^"]+)"\s+property="og:description"/)?.[1]
    ?? ''
  const title = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] ?? ''
  const bodyText = html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 3000)
  return [ogTitle, ogDesc, title, bodyText].filter(Boolean).join('\n').trim()
}

function normalizeDate(raw: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw
  if (/^\d{4}-\d{2}$/.test(raw)) return `${raw}-01`
  return ''
}
