import { RARITY_COLORS, seedsOfRarity } from '../lib/garden'
import './PacketArt.css'

// A drawn paper seed envelope rather than a coloured square: folded seam,
// rarity band across the top, and a die-cut window showing a silhouette of
// what this packet is aimed at. The window flower is the packet's own tier —
// it's a hint at the packet's character, not a promise about the roll.
export default function PacketArt({ packet, size = 'md' }) {
  const hint = seedsOfRarity(packet.rarity)[0]
  return (
    <span
      className={`pa pa-${size}`}
      style={{ '--rarity': RARITY_COLORS[packet.rarity] }}
      aria-hidden="true"
    >
      <span className="pa-paper">
        <span className="pa-band" />
        <span className="pa-seam" />
        <span className="pa-window">
          <span className="pa-hint">{hint?.emoji}</span>
        </span>
        <span className="pa-lines">
          <span /><span /><span />
        </span>
      </span>
    </span>
  )
}
