import './PlotCluster.css'

// A planted bed as a rosette: six blooms in a ring around a larger centre one.
// The arrangement is identical for every species — a Daisy bed and a Rose bed
// differ only in the glyph — so the garden reads as tidy beds of known things
// rather than as a scatter of stickers. No stems: at this bloom size the heads
// fill the plot on their own, and stalks only crowded them.
//
// Percentages are of the plot box, which is square (`aspect-ratio: 1`). The
// ring sits at a radius that fills the bed without letting neighbours touch or
// clip the edge, and the bottom bloom is held clear of the name label.
// Centred in the plot. The name and price only appear on hover, so nothing
// permanently occupies the bottom of the bed for the ring to dodge.
const RING = [
  { left: 50, top: 17 },
  { left: 79, top: 33 },
  { left: 79, top: 67 },
  { left: 50, top: 83 },
  { left: 21, top: 67 },
  { left: 21, top: 33 },
]

// Sway is staggered around the ring so the bed breathes instead of pulsing as
// one block. Fixed per position, not per species, to keep beds identical.
const DELAYS = [0, 0.9, 1.8, 0.45, 1.35, 2.25]

export default function PlotCluster({ seed }) {
  return (
    <span className="cluster" aria-label={seed.name}>
      {RING.map((p, i) => (
        <span
          key={i}
          className="cluster-bloom"
          style={{ left: `${p.left}%`, top: `${p.top}%`, animationDelay: `${DELAYS[i]}s` }}
        >
          {seed.emoji}
        </span>
      ))}
      {/* Centre bloom last so it sits above the ring where they come close. */}
      <span className="cluster-bloom is-centre" style={{ left: '50%', top: '50%' }}>
        {seed.emoji}
      </span>
    </span>
  )
}
