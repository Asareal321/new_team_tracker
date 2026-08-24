// Regenerate the iOS app icons:  npm i -D sharp && node scripts/make-appicons.mjs
//
// sharp is not a dependency of the app — this runs by hand when the mark
// changes, not on every install. Output lands in brand/appicon/.
import sharp from 'sharp'
import { mkdirSync } from 'node:fs'

// Trak, laid out for an iOS app icon.
//
// Not the badge from public/trak-logo.svg, and the differences are the point:
//
//   • Square and full-bleed. iOS masks the corners itself; baking rounded
//     corners in gives a double-rounded icon with transparent notches.
//   • Content centred on its own bounding box rather than on the head, since
//     the sprout hangs off to one side.
//   • The light variant is fully opaque — the App Store rejects alpha there.
//     Dark and Tinted are transparent on purpose: iOS supplies the background
//     for those, and painting our own would sit as a slab inside the system's.
//
// Content bounds in the 128-unit drawing: x 34..114.5, y 18..109.
const BOX = { x: 34, y: 18, w: 80.5, h: 91 }
const S = 1024
const FILL = 0.76                                  // of the canvas the art takes
const scale = (S * FILL) / Math.max(BOX.w, BOX.h)
const cx = BOX.x + BOX.w / 2
const cy = BOX.y + BOX.h / 2
const place = `translate(${S / 2} ${S / 2}) scale(${scale}) translate(${-cx} ${-cy})`

// fur, inner ear, eye ink, nose, pot, leaf — swapped per variant.
const art = (c) => `
  <g transform="rotate(-11 52.5 60)">
    <rect x="45" y="19" width="15" height="41" rx="7.5" fill="${c.fur}"/>
    <rect x="49" y="25" width="7" height="28" rx="3.5" fill="${c.ear}"/>
  </g>
  <g transform="rotate(11 75.5 60)">
    <rect x="68" y="19" width="15" height="41" rx="7.5" fill="${c.fur}"/>
    <rect x="72" y="25" width="7" height="28" rx="3.5" fill="${c.ear}"/>
  </g>
  <circle cx="64" cy="76" r="30" fill="${c.fur}"/>
  <circle cx="53.5" cy="72" r="4.8" fill="${c.ink}"/>
  <circle cx="74.5" cy="72" r="4.8" fill="${c.ink}"/>
  <circle cx="55.2" cy="70.2" r="1.6" fill="${c.spark}"/>
  <circle cx="76.2" cy="70.2" r="1.6" fill="${c.spark}"/>
  <path d="M 59 83 h 10 l -5 5.4 z" fill="${c.nose}"/>
  <path d="M 64 89 q -4.5 5 -9 1.8 M 64 89 q 4.5 5 9 1.8"
        fill="none" stroke="${c.ink}" stroke-width="2.6" stroke-linecap="round"/>
  <rect x="90" y="90" width="21" height="19" rx="5" fill="${c.pot}"/>
  <path d="M 100.5 90 v -9" stroke="${c.pot}" stroke-width="3.4" stroke-linecap="round"/>
  <ellipse cx="94" cy="79.5" rx="7.5" ry="4.6" fill="${c.leaf}" transform="rotate(-24 94 79.5)"/>
  <ellipse cx="107" cy="81.5" rx="7.5" ry="4.6" fill="${c.leaf}" transform="rotate(24 107 81.5)"/>`

const doc = (bg, colours) => `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
  ${bg ? `<rect width="${S}" height="${S}" fill="${bg}"/>` : ''}
  <g transform="${place}">${art(colours)}</g>
</svg>`

const FULL = { fur: '#F6F1E7', ear: '#F0B3AC', ink: '#2A2118', spark: '#FFFFFF',
               nose: '#D4726A', pot: '#6FA83F', leaf: '#C3F73A' }

// Tinted is a grayscale mask: iOS reads brightness and applies the user's
// colour, so this is about VALUE, not hue. The eyes stay dark so the face
// survives being flattened to one colour.
const GREY = { fur: '#FFFFFF', ear: '#C9C9C9', ink: '#2E2E2E', spark: '#FFFFFF',
               nose: '#9A9A9A', pot: '#8C8C8C', leaf: '#DCDCDC' }

const out = new URL('../brand/appicon/', import.meta.url).pathname
mkdirSync(out, { recursive: true })

const jobs = [
  // Opaque. flatten() guarantees it even if a shape has soft edges.
  ['AppIcon-Any-1024.png', doc('#071013', FULL), true],
  // Transparent — iOS paints the dark background behind it.
  ['AppIcon-Dark-1024.png', doc(null, FULL), false],
  ['AppIcon-Tinted-1024.png', doc(null, GREY), false],
]

for (const [name, svg, opaque] of jobs) {
  let img = sharp(Buffer.from(svg)).resize(S, S)
  if (opaque) img = img.flatten({ background: '#071013' })
  const info = await img.png({ compressionLevel: 9 }).toFile(out + name)
  console.log(name.padEnd(26), `${info.width}x${info.height}`, `${(info.size / 1024).toFixed(0)}KB`, opaque ? 'opaque' : 'alpha')
}
