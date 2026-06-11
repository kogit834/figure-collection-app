// ビルド済みアプリの簡易動作確認（vite preview に対して実行）
import { chromium } from 'playwright'

const BASE = process.env.BASE_URL ?? 'http://localhost:4173'

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
const errors = []
page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`))
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(`console: ${msg.text()}`)
})

await page.goto(BASE, { waitUntil: 'networkidle' })

// 1. 発売情報の追加
await page.getByRole('button', { name: '＋ 追加' }).click()
await page.getByLabel('商品名 *').fill('ねんどろいど テスト子')
await page.getByLabel('メーカー').fill('グッスマ')
await page.getByLabel('発売日').fill('2026-07-15')
await page.getByLabel('価格（定価・円）').fill('6800')
await page.getByLabel('ステータス').selectOption('preorder')
await page.getByRole('button', { name: '追加', exact: true }).click()
if (!(await page.getByText('ねんどろいど テスト子').isVisible()))
  throw new Error('figure not listed after add')
if (!(await page.getByText('予約中').first().isVisible()))
  throw new Error('status badge missing')
await page.screenshot({ path: 'scripts/shot-figures.png' })

// 2. 購入予定: 紐付けて追加 → 購入済みに変更
await page.getByRole('button', { name: '購入予定' }).click()
await page.getByRole('button', { name: '＋ 追加' }).click()
await page.getByLabel('発売情報から選択（任意）').selectOption({ label: 'ねんどろいど テスト子' })
await page.getByLabel('購入価格（円）').fill('6500')
await page.getByRole('button', { name: '追加', exact: true }).click()
await page.getByRole('button', { name: '購入済み', exact: true }).click()
if (!(await page.getByText('月別購入金額').isVisible()))
  throw new Error('monthly summary missing after purchase')
if (!(await page.getByText('￥6,500').first().isVisible()))
  throw new Error('monthly total wrong')
await page.screenshot({ path: 'scripts/shot-purchases.png' })

// 3. 価格調査: 2件記録して平均を確認
await page.getByRole('button', { name: '価格調査' }).click()
for (const price of ['8000', '6000']) {
  await page.getByRole('button', { name: '＋ 記録' }).click()
  await page.getByLabel('価格（円） *').fill(price)
  await page.getByRole('button', { name: '記録', exact: true }).click()
}
const statsText = await page.locator('section.card').innerText()
if (!statsText.includes('￥7,000')) throw new Error(`average wrong: ${statsText}`)
if (!statsText.includes('￥8,000')) throw new Error(`max wrong: ${statsText}`)
if (!statsText.includes('￥6,000')) throw new Error(`min wrong: ${statsText}`)
await page.screenshot({ path: 'scripts/shot-prices.png' })

// 4. リロードして localStorage 永続化を確認
await page.reload({ waitUntil: 'networkidle' })
if (!(await page.getByText('ねんどろいど テスト子').isVisible()))
  throw new Error('data not persisted after reload')

// 5. PWA: manifest と Service Worker の確認
const manifest = await page.evaluate(async () => {
  const res = await fetch('manifest.webmanifest')
  return res.ok ? res.json() : null
})
if (!manifest || manifest.name !== 'フィギュアコレクション管理')
  throw new Error('manifest missing or wrong')
const swRegistered = await page.evaluate(async () => {
  const reg = await navigator.serviceWorker?.getRegistration()
  return Boolean(reg)
})
if (!swRegistered) throw new Error('service worker not registered')

await browser.close()
if (errors.length) {
  console.error('Console/page errors:\n' + errors.join('\n'))
  process.exit(1)
}
console.log('SMOKE TEST PASSED')
