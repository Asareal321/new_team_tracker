import { useMemo } from 'react'
import './PlotCluster.css'

// A planted bed, not a scatter of stickers. Blooms sit in staggered rows on
// stems: the back row is smaller and dimmer, the front row larger and fully
// lit, which reads as depth rather than as random sizes.
//
// Rows are [back, middle, front] counts. Rarer species get fewer, larger
// blooms so a Legendary bed still feels special rather than merely busier.
const ROWS_BY_RARITY = {
  1: [3, 3, 2],
  2: [3, 2, 2],
  3: [2, 2, 2],
  4: [2, 2, 1],
  5: [2, 1, 2],
}

// Row styling: vertical position, scale and dimming. Front row overlaps the
// middle slightly so the bed reads as one planting.
// `top` is where the stem's base sits, since a stalk is anchored bottom-centre.
// These sit low in the bed so the planting fills it rather than floating in the
// upper half with bare soil underneath.
const ROW_STYLE = [
  { top: 46, scale: 0.66, dim: 0.78, stem: 12 },
  { top: 62, scale: 0.84, dim: 0.9,  stem: 15 },
  { top: 78, scale: 1.0,  dim: 1,    stem: 18 },
]

// Deterministic per *species*, so every Daisy bed is arranged identically and
// the garden reads as tidy rows of known things.
function jitter(key, salt) {
  let h = 2166136261 ^ salt
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return ((h >>> 0) % 1000) / 1000
}

export default function PlotCluster({ seed }) {
  const blooms = useMemo(() => {
    const rows = ROWS_BY_RARITY[seed.rarity] ?? [2, 2, 2]
    const out = []
    rows.forEach((count, row) => {
      const style = ROW_STYLE[row]
      for (let i = 0; i < count; i++) {
        // Even spacing across the bed, nudged so rows don't line up in a grid.
        const span = 78 / count
        const base = 11 + span * (i + 0.5)
        const wobble = (jitter(seed.key, row * 11 + i) - 0.5) * (span * 0.35)
        out.push({
          left: base + wobble,
          top: style.top + (jitter(seed.key, row * 17 + i) - 0.5) * 5,
          scale: style.scale,
          dim: style.dim,
          stem: style.stem,
          rot: (jitter(seed.key, row * 23 + i) - 0.5) * 14,
          delay: (jitter(seed.key, row * 29 + i) * 2.4).toFixed(2),
          row,
        })
      }
    })
    return out
  }, [seed])

  return (
    <span className="cluster" aria-label={seed.name}>
      {blooms.map((b, i) => (
        <span
          key={i}
          className="cluster-stalk"
          style={{
            left: `${b.left}%`,
            top: `${b.top}%`,
            '--s': b.scale,
            '--rot': `${b.rot}deg`,
            '--dim': b.dim,
            '--stem': `${b.stem}px`,
            animationDelay: `${b.delay}s`,
            zIndex: b.row + 1,
          }}
        >
          <span className="cluster-bloom">{seed.emoji}</span>
          <span className="cluster-stem" />
        </span>
      ))}
    </span>
  )
}
