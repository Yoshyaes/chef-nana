import sharp from 'sharp'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const src = path.join(__dirname, '..', 'public', 'images', 'nana-topchef.png')
const out = path.join(__dirname, '..', 'public', 'og-image.jpg')

const CANVAS_W = 1200
const CANVAS_H = 630
const PHOTO_W = 680
const TEXT_W = CANVAS_W - PHOTO_W

const BROWN = '#2C1A0E'
const CREAM = '#F7F1E8'
const GOLD = '#C9973A'
const CREAM_MUTED = 'rgba(247,241,232,0.72)'

// Bust-up crop of the Top Chef cast portrait, framed to avoid the Bravo
// logo bars near the bottom of the source image.
const photo = await sharp(src)
  .extract({ left: 0, top: 50, width: 946, height: 877 })
  .resize(PHOTO_W, CANVAS_H, { fit: 'cover' })
  .toBuffer()

const textSvg = `
<svg width="${TEXT_W}" height="${CANVAS_H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="${BROWN}" />
  <text x="64" y="230" font-family="Georgia, 'Times New Roman', serif" font-size="20" letter-spacing="4" fill="${GOLD}">SIGNATURE PRIVATE CHEF</text>
  <text x="62" y="300" font-family="Georgia, 'Times New Roman', serif" font-size="64" font-weight="400" fill="${CREAM}">Chef Nana</text>
  <text x="62" y="368" font-family="Georgia, 'Times New Roman', serif" font-style="italic" font-size="64" font-weight="400" fill="${GOLD}">Araba Wilmot</text>
  <rect x="64" y="404" width="64" height="2" fill="${GOLD}" />
  <text x="64" y="446" font-family="Georgia, 'Times New Roman', serif" font-size="19" fill="${CREAM_MUTED}">West African Fine Dining</text>
  <text x="64" y="474" font-family="Georgia, 'Times New Roman', serif" font-size="19" fill="${CREAM_MUTED}">NYC · Philadelphia · Accra</text>
</svg>
`

await sharp({
  create: {
    width: CANVAS_W,
    height: CANVAS_H,
    channels: 3,
    background: BROWN,
  },
})
  .composite([
    { input: Buffer.from(textSvg), left: 0, top: 0 },
    { input: photo, left: TEXT_W, top: 0 },
  ])
  .jpeg({ quality: 90 })
  .toFile(out)

console.log('Wrote', out)
