// PWAアイコン（PNG）を依存ライブラリなしで生成する。
// インディゴ背景に白のフィギュアシルエット（頭＋胴体＋台座）を描画する。
const fs = require('node:fs')
const path = require('node:path')
const zlib = require('node:zlib')

const BG = [79, 70, 229] // indigo-600
const FG = [255, 255, 255]

function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i]
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1))
  }
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}

function drawPixel(size, x, y) {
  // 正規化座標 (0..1)
  const u = x / size
  const v = y / size
  // 頭（円）
  const dx = u - 0.5
  const dyHead = v - 0.32
  if (dx * dx + dyHead * dyHead < 0.012) return true
  // 胴体（台形っぽい縦長楕円）
  const dyBody = (v - 0.58) / 0.16
  const dxBody = dx / (0.09 + 0.04 * Math.max(0, Math.min(1, (v - 0.42) / 0.3)))
  if (v > 0.42 && v < 0.74 && dxBody * dxBody + dyBody * dyBody < 1) return true
  // 台座（角丸の横長楕円）
  const dyBase = (v - 0.8) / 0.035
  const dxBase = dx / 0.2
  if (dxBase * dxBase + dyBase * dyBase < 1) return true
  return false
}

function makePng(size) {
  const raw = Buffer.alloc(size * (size * 3 + 1))
  let offset = 0
  for (let y = 0; y < size; y++) {
    raw[offset++] = 0 // filter: none
    for (let x = 0; x < size; x++) {
      const [r, g, b] = drawPixel(size, x, y) ? FG : BG
      raw[offset++] = r
      raw[offset++] = g
      raw[offset++] = b
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 2 // color type: RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

const publicDir = path.join(__dirname, '..', 'public')
fs.mkdirSync(publicDir, { recursive: true })
for (const size of [192, 512]) {
  fs.writeFileSync(path.join(publicDir, `pwa-${size}x${size}.png`), makePng(size))
  console.log(`generated pwa-${size}x${size}.png`)
}
