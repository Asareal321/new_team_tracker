import { useMemo } from 'react'
import './PlotCluster.css'

// A bed holds a clump, not a single stem — one bloom in a plot read as empty.
// Rarer species get fewer, larger blooms so a Legendary bed still feels
// special rather than just busier than a Common one.
const BLOOMS_BY_RARITY = { 1: 8, 2: 7, 3: 6, 4: 5, 5: 5 }

// Deterministic per-flower jitter: the same bed always looks the same across
// reloads, which a random() at render time would not give us.
function hash(str, salt) {
  let h = 2166136261 ^ salt
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return ((h >>> 0) % 1000) / 1000
}

export default function PlotCluster({ seed, seedId }) {
  const blooms = useMemo(() => {
    const count = BLOOMS_BY_RARITY[seed.rarity] ?? 5
    const id = String(seedId || seed.key)
    return Array.from({ length: count }, (_, i) => {
      const rx = hash(id, i * 3 + 1)
      const ry = hash(id, i * 3 + 2)
      const rs = hash(id, i * 3 + 3)
      // Rows fan outward from the centre so the clump reads as planted, not
      // scattered — back row smaller and higher, front row larger and lower.
      const row = i % 3
      return {
        left: 12 + rx * 76,
        top: 16 + row * 22 + ry * 12,
        scale: 0.62 + row * 0.16 + rs * 0.18,
        rot: (rx - 0.5) * 18,
        delay: (rs * 2.6).toFixed(2),
      }
    }).sort((a, b) => a.top - b.top)
  }, [seed, seedId])

  return (
    <span className="cluster" aria-label={seed.name}>
      {blooms.map((b, i) => (
        <span
          key={i}
          className="cluster-bloom"
          style={{
            left: `${b.left}%`,
            top: `${b.top}%`,
            '--s': b.scale,
            '--rot': `${b.rot}deg`,
            animationDelay: `${b.delay}s`,
            zIndex: i,
          }}
        >
          {seed.emoji}
        </span>
      ))}
    </span>
  )
}
