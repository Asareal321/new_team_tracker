import { RARITY_NAMES } from '../lib/garden'
import { CO, FONT_TOY, FONT_UI, FONT_NUM, edge, LAYER, tierFor } from '../lib/flowerTiers'
import { MOTION, rnd, clamp01 } from '../lib/motion'
import { CUES, GROWN_DURATION, STEM_MAX, stemHeight } from '../lib/grownTimeline'
import { useCinematic, useStageScale, prefersReducedMotion } from './useCinematic'
import './FlowerGrown.css'

export { GROWN_DURATION }

// Flower fully grown — the harvest payoff from the Flower Fully Grown design.
// Plays once, the first time a grow finishes, then hands over to the ordinary
// "Keep it / Sell" controls in the greenhouse.
//
// Timing lives in ../lib/grownTimeline.js and the playback runtime in
// ./useCinematic.js, shared with the pack opening. Per that runtime's contract,
// everything animated here writes only `transform` and `opacity`.
//
// Two deliberate departures from the source composition:
//
//  * The design paints a mock trakkit garden behind the scrim. The real garden
//    is genuinely behind this, so that layer is dropped and the scrim covers
//    the viewport instead.
//  * The design ends with coins flying to a rail counter, because in it a
//    harvest pays out. In trakkit a finished flower pays nothing yet — you
//    still choose to keep it or sell it — so coins flying to the purse would
//    depict money that was never banked. The flight is gone and its chip reads
//    what the flower is *worth* if sold, which is true at this moment.

const BW = 560, BH = 210

/* ---- the raised bed --------------------------------------------------- */
function Bed({ track, C }) {
  const rise = MOTION.pop({ from: 90, to: 0, start: 0.3, end: 1.1 })
  const nudgeDown = MOTION.pop({ from: 0, to: 14, start: C.Push, end: C.Push + 0.3 })
  const nudgeUp = MOTION.enter({ from: 0, to: 14, start: C.Push + 0.3, end: C.Push + 0.8 })
  const o = MOTION.enter({ from: 0, to: 1, start: 0.25, end: 0.9 })
  // The meter tops off its last segment just before the soil breaks — the
  // moment the grow actually completes.
  const meter = MOTION.enter({ from: 0.8, to: 1, start: C.Ready + 0.55, end: C.Push + 0.1 })

  return (
    <div
      ref={track((T, el) => {
        el.style.transform = `translate3d(0, ${rise(T) - nudgeDown(T) + nudgeUp(T)}px, 0)`
        el.style.opacity = o(T)
      })}
      style={{
        position: 'absolute', left: '50%', top: '50%', width: BW, height: BH,
        marginLeft: -BW / 2, marginTop: 150, ...LAYER,
      }}
    >
      <div style={{
        position: 'absolute', inset: 0, background: CO.wood, borderRadius: 14,
        border: `4px solid ${CO.woodEdge}`, boxShadow: edge(8, CO.woodEdge),
        padding: 16, display: 'flex', flexDirection: 'column', gap: 14,
      }}>
        <div style={{ flex: 1, background: CO.soil, borderRadius: 8, border: `3px solid ${CO.soilEdge}` }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ display: 'flex', gap: 6, flex: 1, height: 20 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} style={{ flex: 1, borderRadius: 999, background: CO.sunk, overflow: 'hidden' }}>
                {/* scaleX rather than a width percentage — a width write is a
                    layout write, and this runs while the stem is moving. */}
                <div
                  ref={track((T, el) => { el.style.transform = `scaleX(${clamp01(meter(T) * 5 - i)})` })}
                  style={{
                    width: '100%', height: '100%', borderRadius: 999,
                    background: CO.accent, transformOrigin: '0% 50%', ...LAYER,
                  }}
                />
              </div>
            ))}
          </div>
          <div
            ref={track((T, el) => { el.textContent = `${Math.round(meter(T) * 100)}%` })}
            style={{ font: `400 16px/1 ${FONT_NUM}`, color: CO.woodInk, minWidth: 60, textAlign: 'right' }}
          >80%</div>
        </div>
      </div>
    </div>
  )
}

/* ---- the plant -------------------------------------------------------- */
function Plant({ track, C, tier, seed }) {
  const swayAmp = MOTION.enter({ from: 0, to: 2.4, start: C.Open + 0.4, end: C.Reward })
  const lift = MOTION.enter({ from: 0, to: 34, start: C.Reward, end: C.Reward + 1.4 })
  const headPop = MOTION.pop({ from: 0.15, to: 1, start: C.Open, end: C.Open + 0.7 })
  const flareUp = MOTION.pop({ from: 0, to: 1, start: C.Open + 0.9, end: C.Reward })
  const flareDown = MOTION.enter({ from: 0, to: 1, start: C.Settle, end: C.Settle + 0.8 })
  const coreScale = MOTION.pop({ from: 0, to: 1, start: C.Open + 0.6, end: C.Open + 1.05 })

  const petals = 8
  return (
    <div
      ref={track((T, el) => {
        const sway = Math.sin((T - C.Push) * 1.6) * swayAmp(T)
        el.style.transform = `translate3d(0, ${-lift(T)}px, 0) rotate(${sway}deg)`
      })}
      style={{
        position: 'absolute', left: '50%', top: '50%', width: 0, height: 0,
        marginTop: 214, transformOrigin: '50% 100%', ...LAYER,
      }}
    >
      {/* Fixed-height stem scaled from its base, so the three growth spurts
          never write `height`. */}
      <div
        ref={track((T, el) => { el.style.transform = `scaleY(${stemHeight(T) / STEM_MAX})` })}
        style={{
          position: 'absolute', left: -10, bottom: 0, width: 20, height: STEM_MAX,
          background: CO.accentEdge, borderRadius: 10, transformOrigin: '50% 100%', ...LAYER,
        }}
      />
      {[-1, 1].map((s, k) => {
        const unfurl = MOTION.pop({ from: 0, to: 1, start: C.Push + 0.55 + k * 0.45, end: C.Push + 1.05 + k * 0.45 })
        return (
          <div
            key={s}
            ref={track((T, el) => { el.style.transform = `rotate(${s * 15}deg) scaleX(${unfurl(T)})` })}
            style={{
              position: 'absolute', left: s < 0 ? -100 : 8, bottom: 92 + k * 96,
              width: 98, height: 42, background: CO.accent,
              border: `3px solid ${CO.accentBorder}`,
              borderRadius: s < 0 ? '42px 6px 42px 6px' : '6px 42px 6px 42px',
              transformOrigin: s < 0 ? '100% 50%' : '0% 50%', ...LAYER,
            }}
          />
        )
      })}

      {/* The head rides the top of the stem. The design positions it with
          `bottom: stemH`; translating by the same amount keeps it off layout. */}
      <div
        ref={track((T, el) => { el.style.transform = `translate3d(0, ${-stemHeight(T)}px, 0)` })}
        style={{ position: 'absolute', left: 0, bottom: 0, width: 0, height: 0, ...LAYER }}
      >
        <div
          ref={track((T, el) => {
            const f = Math.max(0, flareUp(T) - flareDown(T))
            el.style.transform = `rotate(${(T - C.Open) * 8}deg) scale(${f})`
            el.style.opacity = f * 0.9
          })}
          style={{ position: 'absolute', left: 0, top: 0, width: 0, height: 0, ...LAYER }}
        >
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} style={{
              position: 'absolute', left: -12, top: -340, width: 24, height: 330,
              background: `linear-gradient(to top, ${tier.flare}, rgba(254,252,247,0))`,
              transformOrigin: '50% 100%', transform: `rotate(${i * 30}deg)`, borderRadius: 12,
            }} />
          ))}
        </div>
        <div
          ref={track((T, el) => { el.style.transform = `scale(${headPop(T)})` })}
          style={{ ...LAYER }}
        >
          {Array.from({ length: petals }).map((_, i) => {
            const p = MOTION.pop({ from: 0, to: 1, start: C.Open + 0.1 + i * 0.07, end: C.Open + 0.75 + i * 0.07 })
            const rot = i * (360 / petals)
            return (
              <div
                key={i}
                ref={track((T, el) => { el.style.transform = `translate(-50%, -100%) rotate(${rot}deg) scale(${p(T)})` })}
                style={{
                  position: 'absolute', left: 0, top: 0, width: 116, height: 208,
                  background: `linear-gradient(to top, ${tier.petal}, ${tier.petalLight})`,
                  border: `3px solid ${tier.petalEdge}`,
                  borderRadius: '52% 52% 40% 40% / 62% 62% 38% 38%',
                  transformOrigin: '50% 100%', ...LAYER,
                }}
              />
            )
          })}
          {/* The design's core is a plain disc with a darker inner disc. These
              are known species, so the flower wears its own face — the payoff
              would otherwise look identical whatever finished growing. */}
          <div
            ref={track((T, el) => { el.style.transform = `scale(${coreScale(T)})` })}
            style={{
              position: 'absolute', left: -68, top: -68, width: 136, height: 136,
              borderRadius: 999, background: tier.core, border: `4px solid ${tier.coreEdge}`,
              display: 'grid', placeItems: 'center', fontSize: 72, lineHeight: 1, ...LAYER,
            }}
          >
            <span>{seed.emoji}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---- soil crumbs when it breaks through ------------------------------- */
function Crumbs({ track, C }) {
  return (
    <div style={{ position: 'absolute', left: '50%', top: '50%', marginTop: 214, width: 0, height: 0 }}>
      {Array.from({ length: 14 }).map((_, i) => {
        const a = (rnd(i, 2) - 0.5) * 2.4 - Math.PI / 2
        const dist = 90 + rnd(i, 4) * 150
        const s = 8 + rnd(i, 6) * 12
        return (
          <div
            key={i}
            ref={track((T, el) => {
              const p = clamp01((T - C.Push) / 0.9)
              if (p <= 0 || p >= 1) { el.style.opacity = 0; return }
              const x = Math.cos(a) * dist * p
              const y = Math.sin(a) * dist * p + 340 * p * p
              el.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${p * 320 + i * 25}deg)`
              el.style.opacity = 1 - p * p
            })}
            style={{
              position: 'absolute', left: -s / 2, top: -s / 2, width: s, height: s,
              background: i % 3 ? CO.soil : CO.soilEdge, borderRadius: 3, opacity: 0, ...LAYER,
            }}
          />
        )
      })}
    </div>
  )
}

/* ---- pollen ring ------------------------------------------------------ */
// Authored as a ring that grows from 160px to ~1060px. Rendered at its full
// size and scaled down, so the growth is a transform rather than a width.
const RING_MAX = 1060
function PollenRing({ track, C, tier }) {
  return (
    <div
      ref={track((T, el) => {
        const p = clamp01((T - (C.Open + 0.55)) / 0.9)
        if (p <= 0 || p >= 1) { el.style.opacity = 0; return }
        el.style.transform = `translateY(-50%) scale(${(160 + p * 900) / RING_MAX})`
        el.style.opacity = (1 - p) * 0.85
      })}
      style={{
        position: 'absolute', left: '50%', top: '50%', marginTop: -110,
        width: RING_MAX, height: RING_MAX * 0.42, marginLeft: -RING_MAX / 2,
        border: `6px solid ${tier.petalLight}`, borderRadius: 999, opacity: 0, ...LAYER,
      }}
    />
  )
}

/* ---- drifting sparkles ------------------------------------------------ */
function Sparkles({ track, C, tier }) {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {Array.from({ length: 22 }).map((_, i) => {
        const period = 2.2 + rnd(i, 8) * 1.8
        const x = 300 + rnd(i, 1) * 1240
        const s = 10 + rnd(i, 9) * 16
        const yOff = rnd(i, 5) * 120
        return (
          <div
            key={i}
            ref={track((T, el) => {
              const gate = clamp01((T - (C.Open + 0.4)) / 0.4) * (1 - clamp01((T - (C.Settle + 0.2)) / 0.9))
              if (gate <= 0) { el.style.opacity = 0; return }
              const p = ((T - C.Open + rnd(i, 3) * period) % period) / period
              el.style.transform =
                `translate3d(${Math.sin(p * 7 + i) * 40}px, ${-p * 780 - yOff}px, 0) rotate(45deg)`
              el.style.opacity = Math.max(0, Math.sin(p * Math.PI) * gate)
            })}
            style={{
              position: 'absolute', left: x, top: 880, width: s, height: s,
              background: i % 3 === 0 ? CO.lime : tier.petalLight,
              borderRadius: 3, opacity: 0, ...LAYER,
            }}
          />
        )
      })}
    </div>
  )
}

/* ---- plaque ----------------------------------------------------------- */
function Plaque({ track, C, tier, seed }) {
  const pop = MOTION.pop({ from: 0.62, to: 1, start: C.Reward + 0.1, end: C.Reward + 0.75 })
  const lift = MOTION.enter({ from: 66, to: 0, start: C.Reward + 0.1, end: C.Reward + 0.85 })
  const up = MOTION.enter({ from: 0, to: 1, start: C.Reward + 0.1, end: C.Reward + 0.55 })
  const down = MOTION.enter({ from: 0, to: 1, start: C.Settle + 0.15, end: C.Settle + 0.85 })
  const row = MOTION.pop({ from: 0, to: 1, start: C.Reward + 0.5, end: C.Reward + 1.1 })
  return (
    <div
      ref={track((T, el) => {
        el.style.transform = `translate(-50%, ${lift(T)}px) scale(${pop(T)})`
        el.style.opacity = Math.max(0, up(T) - down(T))
      })}
      style={{
        position: 'absolute', left: '50%', top: '50%', marginTop: 430,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
        opacity: 0, ...LAYER,
      }}
    >
      <div style={{
        font: `700 15px/1.3 ${FONT_UI}`, letterSpacing: '0.14em',
        textTransform: 'uppercase', color: CO.accentTint,
      }}>Fully grown</div>
      <div style={{
        background: CO.wood, color: CO.woodInk, borderRadius: 14,
        border: `3px solid ${CO.woodEdge}`, boxShadow: edge(5, CO.woodEdge),
        padding: '14px 44px', font: `600 52px/1.05 ${FONT_TOY}`,
        letterSpacing: '-0.015em', whiteSpace: 'nowrap',
      }}>{seed.name}</div>
      <div
        ref={track((T, el) => {
          const r = row(T)
          el.style.transform = `scale(${r})`
          el.style.opacity = Math.max(0, r)
        })}
        style={{ display: 'flex', gap: 12, opacity: 0, ...LAYER }}
      >
        <div style={{
          background: tier.chipBg, color: tier.chipInk, borderRadius: 999,
          padding: '8px 20px', font: `400 18px/1.35 ${FONT_NUM}`,
          textTransform: 'uppercase', letterSpacing: '0.02em',
        }}>{RARITY_NAMES[seed.rarity]}</div>
        {/* "Worth", not "+N coins": nothing has been paid out yet. */}
        <div style={{
          background: CO.dueTint, color: CO.dueInk, borderRadius: 999,
          padding: '8px 20px', font: `400 18px/1.35 ${FONT_NUM}`,
        }}>worth {seed.sellValue.toLocaleString()} coins</div>
      </div>
    </div>
  )
}

/* ---- the whole piece -------------------------------------------------- */
export default function FlowerGrown({ seed, onDone }) {
  const scale = useStageScale()
  // Reduced motion skips the dig and the bloom and joins at the plaque — the
  // information still arrives, the theatre doesn't.
  const start = prefersReducedMotion() ? CUES.Reward : 0
  const { track, finish } = useCinematic({ duration: GROWN_DURATION, start, onDone })

  const C = CUES
  const scrimUp = MOTION.enter({ from: 0, to: 1, start: 0.1, end: 0.85 })
  const scrimDown = MOTION.enter({ from: 0, to: 1, start: C.Settle + 0.45, end: C.Settle + 1.2 })
  const camUp = MOTION.enter({ from: 0, to: 0.05, start: C.Push, end: C.Open })
  const camDown = MOTION.enter({ from: 0, to: 0.05, start: C.Reward + 0.2, end: C.Reward + 1.5 })
  const stageLift = MOTION.enter({ from: 0, to: 44, start: C.Reward, end: C.Reward + 1.4 })
  const stageUp = MOTION.enter({ from: 0, to: 0.14, start: C.Push, end: C.Open + 0.6 })
  const stageDown = MOTION.enter({ from: 0, to: 0.12, start: C.Reward, end: C.Reward + 1.5 })

  const tier = tierFor(seed.rarity)

  return (
    <div className="grown-overlay" onClick={finish}>
      <div
        className="grown-scrim"
        ref={track((T, el) => { el.style.opacity = Math.max(0, scrimUp(T) - scrimDown(T)) })}
      />
      <div className="grown-stage" style={{ transform: `translate(-50%, -50%) scale(${scale})` }}>
        <div
          ref={track((T, el) => { el.style.transform = `scale(${1 + camUp(T) - camDown(T)})` })}
          style={{ position: 'absolute', inset: 0, transformOrigin: '50% 48%', ...LAYER }}
        >
          <div
            ref={track((T, el) => {
              el.style.transform =
                `translate3d(0, ${-stageLift(T)}px, 0) scale(${0.94 + stageUp(T) - stageDown(T)})`
            })}
            style={{ position: 'absolute', inset: 0, transformOrigin: '50% 52%', ...LAYER }}
          >
            <PollenRing track={track} C={C} tier={tier} />
            <Plant track={track} C={C} tier={tier} seed={seed} />
            <Bed track={track} C={C} />
            <Crumbs track={track} C={C} />
            <Plaque track={track} C={C} tier={tier} seed={seed} />
          </div>
          <Sparkles track={track} C={C} tier={tier} />
        </div>
      </div>
      <button className="grown-skip" onClick={finish}>Skip</button>
    </div>
  )
}
