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
// The ring is centred on 44% rather than 50%: the name pill occupies the
// bottom of the plot, and a ring centred in the box put the lowest bloom
// behind it.
const RING = [
  { left: 50, top: 14 },
  { left: 79, top: 29 },
  { left: 79, top: 59 },
  { left: 50, top: 74 },
  { left: 21, top: 59 },
  { left: 21, top: 29 },
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
      <span className="cluster-bloom is-centre" style={{ left: '50%', top: '44%' }}>
        {seed.emoji}
      </span>
    </span>
  )
}
