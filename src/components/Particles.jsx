import { useMemo } from 'react'
import './Particles.css'

// Drifting motes behind a reward. Shared by the cloud and the packet opener so
// the two read as one family. Intensity is the rarity tier (1-5): higher tiers
// get more particles, larger, brighter and faster — the escalation is the
// whole point, so a Common should look almost still next to a Legendary.
const COUNT_BY_TIER = { 1: 8, 2: 14, 3: 22, 4: 32, 5: 46 }

export default function Particles({ tier = 1, color }) {
  const count = COUNT_BY_TIER[tier] ?? 8
  // Regenerated only when the tier changes, so particles don't jump position
  // on every unrelated re-render.
  const motes = useMemo(
    () => Array.from({ length: count }, () => ({
      left: Math.random() * 100,
      delay: -Math.random() * 9,
      duration: 7 + Math.random() * 7 - tier * 0.5,
      size: 2 + Math.random() * (1.5 + tier * 0.9),
      drift: (Math.random() - 0.5) * 90,
      opacity: 0.25 + Math.random() * (0.2 + tier * 0.1),
    })),
    [count, tier],
  )

  return (
    <div className="particles" aria-hidden="true" data-tier={tier}>
      {motes.map((m, i) => (
        <span
          key={i}
          className="mote"
          style={{
            left: `${m.left}%`,
            width: `${m.size}px`,
            height: `${m.size}px`,
            opacity: m.opacity,
            background: color || 'var(--tier-color, #fff)',
            animationDelay: `${m.delay}s`,
            animationDuration: `${Math.max(3.5, m.duration)}s`,
            '--drift': `${m.drift}px`,
          }}
        />
      ))}
    </div>
  )
}
