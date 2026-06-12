// PWAアイコン（PNG）を依存ライブラリなしで生成する。
// ピンク→パープルのグラデーション背景に白の美少女フィギュアシルエットを描画する。
const fs = require('node:fs')
const path = require('node:path')
const zlib = require('node:zlib')

const BG_TOP = [219, 39, 119]  // pink-600
const BG_BOT = [76, 29, 149]   // purple-900
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

function isFigure(u, v) {
  function ellipse(cx, cy, rx, ry) {
    const dx = (u - cx) / rx
    const dy = (v - cy) / ry
    return dx * dx + dy * dy < 1
  }
  function rect(x0, y0, x1, y1) {
    return u > x0 && u < x1 && v > y0 && v < y1
  }

  // 髪（頭頂部ボリューム）
  if (ellipse(0.500, 0.148, 0.158, 0.112)) return true
  // 左ツインテール
  if (ellipse(0.352, 0.278, 0.053, 0.126)) return true
  // 右ツインテール
  if (ellipse(0.648, 0.278, 0.053, 0.126)) return true
  // 頭部
  if (ellipse(0.500, 0.222, 0.091, 0.091)) return true
  // 首
  if (rect(0.467, 0.308, 0.533, 0.346)) return true
  // 肩・胸
  if (ellipse(0.500, 0.378, 0.133, 0.068)) return true
  // 胴体上部
  if (rect(0.444, 0.346, 0.556, 0.440)) return true
  // 腰（くびれ）
  if (rect(0.458, 0.440, 0.542, 0.508)) return true
  // ヒップ
  if (ellipse(0.500, 0.510, 0.153, 0.053)) return true
  // スカート（A字フレア）
  if (v > 0.504 && v < 0.762) {
    const t = (v - 0.504) / 0.258
    const hw = 0.116 + t * 0.163
    if (Math.abs(u - 0.5) < hw) return true
  }
  // 左脚
  if (rect(0.432, 0.760, 0.483, 0.876)) return true
  // 右脚
  if (rect(0.517, 0.760, 0.568, 0.876)) return true
  // 左足先
  if (ellipse(0.455, 0.884, 0.040, 0.016)) return true
  // 右足先
  if (ellipse(0.545, 0.884, 0.040, 0.016)) return true
  // 台座
  if (ellipse(0.500, 0.924, 0.200, 0.036)) return true

  return false
}

function makePng(size) {
  const raw = Buffer.alloc(size * (size * 3 + 1))
  let offset = 0
  for (let y = 0; y < size; y++) {
    raw[offset++] = 0
    const t = y / (size - 1)
    const bgR = Math.round(BG_TOP[0] + t * (BG_BOT[0] - BG_TOP[0]))
    const bgG = Math.round(BG_TOP[1] + t * (BG_BOT[1] - BG_TOP[1]))
    const bgB = Math.round(BG_TOP[2] + t * (BG_BOT[2] - BG_TOP[2]))
    for (let x = 0; x < size; x++) {
      const u = (x + 0.5) / size
      const v = (y + 0.5) / size
      if (isFigure(u, v)) {
        raw[offset++] = FG[0]
        raw[offset++] = FG[1]
        raw[offset++] = FG[2]
      } else {
        raw[offset++] = bgR
        raw[offset++] = bgG
        raw[offset++] = bgB
      }
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8
  ihdr[9] = 2
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
