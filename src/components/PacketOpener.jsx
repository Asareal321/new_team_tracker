import { useEffect, useRef, useState } from 'react'
import { RARITY_COLORS, RARITY_NAMES, formatDuration } from '../lib/garden'
import Particles from './Particles'
import './PacketOpener.css'

// Opening ceremony for a bought packet. The flower inside was already decided
// by the drop table at purchase — the rips are pure theatre and change nothing,
// which is why the printed odds stay honest. Three rips, then the reveal.
const RIPS = 3

export default function PacketOpener({ packet, seed, onDone }) {
  const [rips, setRips] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const settled = useRef(false)

  // Particles follow the packet until it opens, then switch to the flower's
  // rarity — which is the moment the escalation pays off.
  const tier = revealed ? seed.rarity : packet.rarity
  const color = RARITY_COLORS[tier]

  function rip() {
    if (settled.current) return
    const next = rips + 1
    setRips(next)
    if (next >= RIPS) {
      settled.current = true
      setTimeout(() => setRevealed(true), 260)
    }
  }

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape' && revealed) onDone()
      else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); revealed ? onDone() : rip() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <div className="pk-layer" style={{ '--tier-color': color, '--tier-glow': `${color}66` }}>
      <Particles tier={tier} color={color} />

      <div className="pk-stage">
        {!revealed && (
          <>
            <button
              className="pk-packet"
              data-rips={rips}
              onClick={rip}
              aria-label={`${packet.name} — rip to open, ${RIPS - rips} left`}
            >
              <span className="pk-body">
                <span className="pk-emoji">{packet.emoji}</span>
                <span className="pk-label">{packet.name}</span>
              </span>
              <span className="pk-flap" />
              <span className="pk-tear" />
            </button>

            <div className="pk-meta">
              <div className="pk-pips">
                {Array.from({ length: RIPS }, (_, i) => (
                  <span key={i} className={`pk-pip${i < rips ? ' done' : ''}`} />
                ))}
              </div>
              <p className="pk-hint">{rips === 0 ? 'Tear it open' : `${RIPS - rips} to go`}</p>
            </div>
          </>
        )}

        {revealed && (
          <div className="pk-reveal">
            <span className="pk-rays" />
            <span className="pk-burst" />
            <span className="pk-flower">{seed.emoji}</span>
            <p className="pk-name">{seed.name}</p>
            <p className="pk-rarity">{RARITY_NAMES[seed.rarity]}</p>
            <p className="pk-stats">{formatDuration(seed.growSeconds)} to grow · sells for {seed.sellValue} 🪙</p>
            <button className="pk-done" onClick={onDone}>Add to tray</button>
          </div>
        )}
      </div>
    </div>
  )
}
