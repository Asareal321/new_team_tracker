import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { RARITY_COLORS, RARITY_NAMES } from '../lib/garden'
import { CUES, PACK_DURATION, MOTION, rnd } from '../lib/packTimeline'
import './PackOpening.css'

export { PACK_DURATION }

// Flower pack opening — the reward cinematic from the Flower Pack Opening
// design. The composition is a pure function of authored time T, exactly as the
// source does: nothing mounts or unmounts at a scene boundary, everything moves
// by interpolation. Timing lives in ../lib/packTimeline.js so it can be checked
// without a browser (scripts/check-pack-timeline.mjs).
//
// How it's driven matters as much as what it draws. The first cut held T in
// React state, so all ~70 elements re-rendered every frame with fresh inline
// style objects — enough reconciliation per frame to drop some of them. Now the
// tree renders ONCE and the animation loop writes straight to the DOM:
//
//   * every animated element registers an `apply(T, el)` through `track()`
//   * the rAF loop calls those directly — React does no work during playback
//   * only `transform` and `opacity` are written, so frames stay on the
//     compositor and never trigger layout or paint
//
// That last rule is why the stem scales rather than growing its height, why the
// petal shower translates rather than setting left/top, and why the scrim is a
// separate layer whose opacity animates instead of a background-color on the
// full-viewport overlay.

const CO = {
  wood: '#89582C', woodEdge: '#653C1F', woodInk: '#FEFCF7',
  surface: '#FEFCF7', sunk: '#EDE7DC', muted: '#6A6258', border: '#D9D0C1',
  accent: '#90D94F', accentBorder: '#63B739', accentEdge: '#3E8637',
}

const FONT_TOY = 'Fredoka, "Baloo 2", "Trebuchet MS", sans-serif'
const FONT_UI = 'Inter, -apple-system, "Segoe UI", sans-serif'
const FONT_NUM = 'Sono, "DM Mono", ui-monospace, Menlo, monospace'

// The design names three tiers; the garden has five. Common / Rare / Legendary
// are the design's palettes verbatim. Uncommon and Epic are built to the same
// shape from the rarity colour the rest of the app already uses for them, so
// every rarity gets its own flower rather than sharing a neighbour's.
function shade(hex, amount) {
  const n = parseInt(hex.slice(1), 16)
  const mix = c => Math.round(amount < 0 ? c * (1 + amount) : c + (255 - c) * amount)
  return `#${[(n >> 16) & 255, (n >> 8) & 255, n & 255].map(c => mix(c).toString(16).padStart(2, '0')).join('')}`
}

function derivedTier(rarity) {
  const base = RARITY_COLORS[rarity]
  return {
    petal: base, petalEdge: shade(base, -0.35), petalLight: shade(base, 0.45),
    core: '#E8C766', coreEdge: '#B2913A', flare: `${base}e0`,
    chipBg: shade(base, 0.72), chipInk: shade(base, -0.55),
  }
}

const TIERS = {
  1: {
    petal: '#9CC6DE', petalEdge: '#5E93B0', petalLight: '#C8DFEC',
    core: '#E8C766', coreEdge: '#B2913A', flare: 'rgba(156,198,222,0.85)',
    chipBg: '#DCEAF2', chipInk: '#245A76',
  },
  2: derivedTier(2),
  3: {
    petal: '#E58AAE', petalEdge: '#B45B80', petalLight: '#F3C3D5',
    core: '#DC8818', coreEdge: '#894C06', flare: 'rgba(229,138,174,0.9)',
    chipBg: '#FBDCE7', chipInk: '#8E2B5A',
  },
  4: derivedTier(4),
  5: {
    petal: '#C79BE8', petalEdge: '#8E62B4', petalLight: '#E3CDF4',
    core: '#F0B93C', coreEdge: '#9B6C0C', flare: 'rgba(240,185,60,0.9)',
    chipBg: '#F6E4B8', chipInk: '#7A4E06',
  },
}

const edge = (px, color) => `0 ${px}px 0 ${color}`

// Promoted to its own compositor layer and told exactly what will change, so
// the browser doesn't re-rasterise it every frame.
const LAYER = { willChange: 'transform, opacity', backfaceVisibility: 'hidden' }

/* ---- the pack --------------------------------------------------------- */
const PW = 320, PH = 440, TOOTH = 32, TEETH = 10, DEPTH = 16
const STEM_H = 300

const zigzagFront = () => {
  const p = [`0px ${DEPTH}px`]
  for (let i = 0; i < TEETH; i++) {
    p.push(`${i * TOOTH + TOOTH / 2}px 0px`)
    p.push(`${(i + 1) * TOOTH}px ${DEPTH}px`)
  }
  p.push(`${PW}px ${PH}px`, `0px ${PH}px`)
  return `polygon(${p.join(',')})`
}

const zigzagStrip = h => {
  const p = ['0px 0px', `${PW}px 0px`, `${PW}px ${h - DEPTH}px`]
  for (let i = TEETH - 1; i >= 0; i--) {
    p.push(`${i * TOOTH + TOOTH / 2}px ${h}px`)
    p.push(`${i * TOOTH}px ${h - DEPTH}px`)
  }
  return `polygon(${p.join(',')})`
}

function Pack({ track, C, tier, packet }) {
  const drop = MOTION.pop({ from: -1180, to: 0, start: 0.35, end: 1.25 })
  const ampUp = MOTION.enter({ from: 0, to: 7.5, start: C.Shake + 0.15, end: C.Tear - 0.15 })
  const ampDown = MOTION.enter({ from: 0, to: 7.5, start: C.Tear, end: C.Tear + 0.35 })
  const joltDown = MOTION.pop({ from: 0, to: -26, start: C.Tear, end: C.Tear + 0.25 })
  const joltUp = MOTION.enter({ from: 0, to: 26, start: C.Tear + 0.3, end: C.Tear + 0.7 })
  const sink = MOTION.enter({ from: 0, to: 18, start: C.Bloom + 0.1, end: C.Name })
  const packFade = MOTION.enter({ from: 0, to: 1, start: C.Return + 0.3, end: C.Return + 1.1 })

  const stripY = MOTION.enter({ from: 0, to: -520, start: C.Tear + 0.05, end: C.Tear + 0.85 })
  const stripX = MOTION.enter({ from: 0, to: 330, start: C.Tear + 0.05, end: C.Tear + 0.95 })
  const stripRot = MOTION.enter({ from: 0, to: 68, start: C.Tear + 0.05, end: C.Tear + 0.95 })
  const stripFade = MOTION.enter({ from: 0, to: 1, start: C.Tear + 0.45, end: C.Tear + 0.9 })

  return (
    <div
      ref={track((T, el) => {
        const rattle = Math.sin((T - C.Shake) * 21) * (ampUp(T) - ampDown(T))
        el.style.transform = `translate3d(0, ${drop(T) + joltDown(T) + joltUp(T) + sink(T)}px, 0) rotate(${rattle}deg)`
        el.style.opacity = 1 - packFade(T)
      })}
      style={{
        position: 'absolute', left: '50%', top: '50%', width: PW, height: PH,
        marginLeft: -PW / 2, marginTop: -PH / 2 + 40,
        transformOrigin: '50% 100%', ...LAYER,
      }}
    >
      <div style={{ position: 'absolute', inset: 0, background: CO.wood, clipPath: zigzagFront(), borderRadius: 8 }}>
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 6, background: CO.woodEdge }} />
        <div style={{
          position: 'absolute', left: 22, right: 22, top: 78, bottom: 34,
          background: CO.surface, borderRadius: 4, border: `1px solid ${CO.border}`,
          padding: 18, display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          <div style={{ font: `700 11px/1.3 ${FONT_UI}`, letterSpacing: '0.1em', color: CO.muted, textTransform: 'uppercase' }}>
            Seed pack
          </div>
          <div style={{ flex: 1, background: CO.sunk, borderRadius: 4, display: 'grid', placeItems: 'center' }}>
            <div style={{
              width: 108, height: 108, borderRadius: 999, background: tier.chipBg,
              border: `3px solid ${tier.petalEdge}`, display: 'grid', placeItems: 'center',
              font: `600 34px/1 ${FONT_TOY}`, color: tier.chipInk,
            }}>?</div>
          </div>
          <div style={{ font: `400 13px/1.4 ${FONT_NUM}`, color: CO.muted }}>
            1 seed · {packet.cost.toLocaleString()} {packet.currency === 'seeds' ? 'seeds' : 'coins'}
          </div>
        </div>
      </div>
      <div
        ref={track((T, el) => {
          el.style.transform = `translate3d(${stripX(T)}px, ${stripY(T)}px, 0) rotate(${stripRot(T)}deg)`
          el.style.opacity = 1 - stripFade(T)
        })}
        style={{
          position: 'absolute', left: 0, top: 0, width: PW, height: 78,
          background: CO.woodEdge, clipPath: zigzagStrip(78), borderRadius: '8px 8px 0 0',
          display: 'flex', alignItems: 'center', justifyContent: 'center', ...LAYER,
        }}
      >
        <div style={{
          font: `700 11px/1.3 ${FONT_UI}`, letterSpacing: '0.1em',
          color: CO.woodInk, textTransform: 'uppercase', paddingBottom: 10,
        }}>tear here</div>
      </div>
    </div>
  )
}

/* ---- the flower ------------------------------------------------------- */
function Flower({ track, C, tier, seed }) {
  const riseA = MOTION.enter({ from: 120, to: -205, start: C.Bloom + 0.05, end: C.Bloom + 1.3 })
  const riseB = MOTION.enter({ from: 0, to: -22, start: C.Name, end: C.Name + 1.4 })
  // The stem scales instead of growing its height: animating `height` is a
  // layout write every frame, which is exactly what stalls the compositor.
  const stemGrow = MOTION.enter({ from: 0, to: 1, start: C.Bloom + 0.1, end: C.Bloom + 1.2 })
  const swayAmp = MOTION.enter({ from: 0, to: 2.2, start: C.Bloom + 1.3, end: C.Name })
  const headPop = MOTION.pop({ from: 0.2, to: 1, start: C.Bloom + 0.55, end: C.Bloom + 1.15 })
  const fade = MOTION.enter({ from: 0, to: 1, start: C.Return + 0.3, end: C.Return + 1.1 })
  const flare = MOTION.pop({ from: 0, to: 1, start: C.Bloom + 1.35, end: C.Bloom + 2.1 })
  const coreScale = MOTION.pop({ from: 0, to: 1, start: C.Bloom + 1.15, end: C.Bloom + 1.6 })

  const petals = 8
  return (
    <div
      ref={track((T, el) => {
        const sway = Math.sin((T - C.Bloom) * 1.5) * swayAmp(T)
        el.style.transform = `translate3d(0, ${riseA(T) + riseB(T)}px, 0) rotate(${sway}deg)`
        el.style.opacity = 1 - fade(T)
      })}
      style={{
        position: 'absolute', left: '50%', top: '50%', width: 0, height: 0,
        transformOrigin: '50% 100%', ...LAYER,
      }}
    >
      <div
        ref={track((T, el) => { el.style.transform = `scaleY(${stemGrow(T)})` })}
        style={{
          position: 'absolute', left: -9, top: 0, width: 18, height: STEM_H,
          background: CO.accentEdge, borderRadius: 9, transformOrigin: '50% 0%', ...LAYER,
        }}
      />
      {[-1, 1].map(s => {
        const leaf = MOTION.pop({ from: 0, to: 1, start: C.Bloom + 0.75 + (s < 0 ? 0 : 0.12), end: C.Bloom + 1.3 })
        return (
          <div
            key={s}
            ref={track((T, el) => { el.style.transform = `rotate(${s * 14}deg) scaleX(${leaf(T)})` })}
            style={{
              position: 'absolute', left: s < 0 ? -96 : 6, top: 96,
              width: 94, height: 40, background: CO.accent,
              border: `3px solid ${CO.accentBorder}`,
              borderRadius: s < 0 ? '40px 6px 40px 6px' : '6px 40px 6px 40px',
              transformOrigin: s < 0 ? '100% 50%' : '0% 50%', ...LAYER,
            }}
          />
        )
      })}
      <div
        ref={track((T, el) => {
          const f = flare(T)
          el.style.transform = `rotate(${(T - C.Bloom) * 9}deg) scale(${f})`
          el.style.opacity = f * 0.95
        })}
        style={{ position: 'absolute', left: 0, top: 0, width: 0, height: 0, ...LAYER }}
      >
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} style={{
            position: 'absolute', left: -13, top: -366, width: 26, height: 350,
            background: `linear-gradient(to top, ${tier.flare}, rgba(254,252,247,0))`,
            transformOrigin: '50% 100%', transform: `rotate(${i * 30}deg)`, borderRadius: 11,
          }} />
        ))}
        <div style={{
          position: 'absolute', left: -215, top: -215, width: 430, height: 430,
          borderRadius: 999, border: `5px solid ${tier.petalLight}`, opacity: 0.85,
        }} />
      </div>
      <div
        ref={track((T, el) => { el.style.transform = `scale(${headPop(T)})` })}
        style={{ position: 'absolute', left: 0, top: 0, width: 0, height: 0, ...LAYER }}
      >
        {Array.from({ length: petals }).map((_, i) => {
          const p = MOTION.pop({ from: 0, to: 1, start: C.Bloom + 0.6 + i * 0.075, end: C.Bloom + 1.25 + i * 0.075 })
          const rot = i * (360 / petals)
          return (
            <div
              key={i}
              ref={track((T, el) => { el.style.transform = `translate(-50%, -100%) rotate(${rot}deg) scale(${p(T)})` })}
              style={{
                position: 'absolute', left: '50%', top: '50%', width: 118, height: 212,
                background: `linear-gradient(to top, ${tier.petal}, ${tier.petalLight})`,
                border: `3px solid ${tier.petalEdge}`,
                borderRadius: '52% 52% 40% 40% / 62% 62% 38% 38%',
                transformOrigin: '50% 100%', ...LAYER,
              }}
            />
          )
        })}
        {/* The design's core is a plain disc. The garden's flowers are known
            species, so the species sits in the middle of its own bloom — the
            reveal would otherwise be the same anonymous flower every time. */}
        <div
          ref={track((T, el) => { el.style.transform = `scale(${coreScale(T)})` })}
          style={{
            position: 'absolute', left: -70, top: -70, width: 140, height: 140,
            borderRadius: 999, background: tier.core, border: `4px solid ${tier.coreEdge}`,
            display: 'grid', placeItems: 'center', fontSize: 74, lineHeight: 1, ...LAYER,
          }}
        >
          <span>{seed.emoji}</span>
        </div>
      </div>
    </div>
  )
}

/* ---- light burst + petal shower --------------------------------------- */
function Burst({ track, C }) {
  const s = MOTION.enter({ from: 0.15, to: 4.2, start: C.Tear + 0.15, end: C.Bloom + 0.5 })
  const up = MOTION.enter({ from: 0, to: 1, start: C.Tear + 0.1, end: C.Tear + 0.28 })
  const down = MOTION.enter({ from: 0, to: 1, start: C.Tear + 0.3, end: C.Bloom + 0.5 })
  return (
    <div
      ref={track((T, el) => {
        el.style.transform = `scale(${s(T)})`
        el.style.opacity = Math.max(0, up(T) - down(T))
      })}
      style={{
        position: 'absolute', left: '50%', top: '50%', width: 520, height: 520,
        marginLeft: -260, marginTop: -300, borderRadius: 999,
        background: 'radial-gradient(circle, rgba(254,252,247,0.95) 0%, rgba(254,252,247,0.55) 42%, rgba(254,252,247,0) 70%)',
        ...LAYER,
      }}
    />
  )
}

// 26 petals, all mounted for the whole piece. The first cut returned null for
// any petal outside its window, so React mounted and unmounted nodes mid-flight
// — the reconciliation showed as a hitch right where the shower starts. They
// now stay put at opacity 0 and only ever move by transform.
function PetalShower({ track, C, tier }) {
  const clear = MOTION.enter({ from: 0, to: 1, start: C.Return + 0.2, end: C.Return + 1 })
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {Array.from({ length: 26 }).map((_, i) => {
        const t0 = C.Tear + 0.35 + rnd(i, 3) * 3.6
        const life = 3.4 + rnd(i, 7) * 2.4
        const x = 120 + rnd(i, 1) * 1560
        const w = 30 + rnd(i, 9) * 22
        const spin = (rnd(i, 5) - 0.5) * 900
        return (
          <div
            key={i}
            ref={track((T, el) => {
              const p = Math.min(1, Math.max(0, (T - t0) / life))
              if (p <= 0) { el.style.opacity = 0; return }
              const drift = Math.sin(p * 6 + i) * 90
              el.style.transform =
                `translate3d(${drift}px, ${-140 + p * 1320}px, 0) rotate(${spin * p + i * 27}deg)`
              el.style.opacity = Math.max(0,
                Math.min(1, p * 6) * (1 - Math.max(0, (p - 0.82) / 0.18)) * (1 - clear(T)))
            })}
            style={{
              position: 'absolute', left: x, top: 0, width: w, height: w * 1.5,
              background: i % 3 === 0 ? tier.petalLight : tier.petal,
              border: `2px solid ${tier.petalEdge}`,
              borderRadius: '52% 52% 40% 40% / 62% 62% 38% 38%',
              opacity: 0, ...LAYER,
            }}
          />
        )
      })}
    </div>
  )
}

/* ---- the name plaque -------------------------------------------------- */
function NamePlaque({ track, C, tier, seed }) {
  const pop = MOTION.pop({ from: 0.6, to: 1, start: C.Name + 0.15, end: C.Name + 0.8 })
  const lift = MOTION.enter({ from: 70, to: 0, start: C.Name + 0.15, end: C.Name + 0.9 })
  const up = MOTION.enter({ from: 0, to: 1, start: C.Name + 0.15, end: C.Name + 0.6 })
  const down = MOTION.enter({ from: 0, to: 1, start: C.Return + 0.2, end: C.Return + 0.9 })
  const chip = MOTION.pop({ from: 0, to: 1, start: C.Name + 0.55, end: C.Name + 1.15 })
  return (
    <div
      ref={track((T, el) => {
        el.style.transform = `translate(-50%, ${lift(T)}px) scale(${pop(T)})`
        el.style.opacity = Math.max(0, up(T) - down(T))
      })}
      style={{
        position: 'absolute', left: '50%', top: '50%', marginTop: 318,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
        opacity: 0, ...LAYER,
      }}
    >
      <div style={{
        background: CO.wood, color: CO.woodInk, borderRadius: 14,
        border: `3px solid ${CO.woodEdge}`, boxShadow: edge(5, CO.woodEdge),
        padding: '14px 44px', font: `600 52px/1.05 ${FONT_TOY}`,
        letterSpacing: '-0.015em', whiteSpace: 'nowrap',
      }}>{seed.name}</div>
      <div
        ref={track((T, el) => {
          const c = chip(T)
          el.style.transform = `scale(${c})`
          el.style.opacity = Math.max(0, c)
        })}
        style={{
          background: tier.chipBg, color: tier.chipInk, borderRadius: 999,
          padding: '8px 20px', font: `400 18px/1.35 ${FONT_NUM}`,
          letterSpacing: '0.02em', textTransform: 'uppercase', opacity: 0, ...LAYER,
        }}
      >{RARITY_NAMES[seed.rarity]} seed</div>
    </div>
  )
}

/* ---- the whole piece -------------------------------------------------- */
export default function PackOpening({ packet, seed, onDone }) {
  const [scale, setScale] = useState(() =>
    Math.min(window.innerWidth / 1920, window.innerHeight / 1080))
  const done = useRef(false)
  // Callers pass an inline arrow, so `onDone`'s identity changes on every
  // render. Held in a ref, the timeline effect can mount once and stay mounted.
  const doneCb = useRef(onDone)
  doneCb.current = onDone

  // Every animated element registers here during render; the loop writes to
  // them directly. Rebuilt each render because the ref callbacks are fresh
  // closures, so React re-invokes all of them.
  const reg = useRef([])
  reg.current = []
  const track = apply => el => { if (el) reg.current.push([el, apply]) }

  const reduced = typeof matchMedia === 'function'
    && matchMedia('(prefers-reduced-motion: reduce)').matches
  // Reduced motion skips the drop, rattle and camera push and joins at the
  // reveal — the information still arrives, the theatre doesn't.
  const start = reduced ? CUES.Name : 0

  // The composition is authored at a fixed 1920x1080, so it's scaled to fit
  // the viewport rather than reflowed — every offset is in stage pixels.
  useEffect(() => {
    const fit = () => setScale(Math.min(window.innerWidth / 1920, window.innerHeight / 1080))
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [])

  const C = CUES
  const cam = { up: MOTION.enter({ from: 0, to: 0.04, start: C.Shake + 0.1, end: C.Tear }),
                down: MOTION.enter({ from: 0, to: 0.04, start: C.Name + 0.1, end: C.Name + 1.6 }) }
  const liftF = MOTION.enter({ from: 0, to: 52, start: C.Name, end: C.Name + 1.5 })
  const rewardUp = MOTION.enter({ from: 0, to: 0.2, start: C.Shake + 0.1, end: C.Tear + 0.4 })
  const rewardDown = MOTION.enter({ from: 0, to: 0.16, start: C.Name, end: C.Name + 1.6 })
  const scrimUp = MOTION.enter({ from: 0, to: 1, start: 0.15, end: 0.95 })
  const scrimDown = MOTION.enter({ from: 0, to: 1, start: C.Return + 0.35, end: C.Return + 1.15 })

  function finish() {
    if (done.current) return
    done.current = true
    doneCb.current()
  }

  const paint = T => {
    const list = reg.current
    for (let i = 0; i < list.length; i++) list[i][1](T, list[i][0])
  }

  // Paint frame zero synchronously, before the browser shows anything —
  // otherwise the first painted frame is whatever the static styles say, which
  // flashes the pack at its resting position before it drops in.
  useLayoutEffect(() => { paint(start) })

  useEffect(() => {
    let raf
    const t0 = performance.now()
    const tick = now => {
      // Time comes from the wall clock, not from a frame counter, so a
      // backgrounded tab resumes at the right point instead of playing back
      // the frames it missed in fast-forward.
      const T = start + (now - t0) / 1000
      paint(Math.min(T, PACK_DURATION))
      if (T >= PACK_DURATION) { finish(); return }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [start])

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') finish() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const tier = TIERS[seed.rarity] || TIERS[3]

  return (
    <div className="pack-overlay" onClick={finish}>
      {/* A separate layer rather than a background-color on the overlay: an
          animated colour on a full-viewport element repaints the whole screen
          every frame, where an opacity change stays on the compositor. */}
      <div
        className="pack-scrim"
        ref={track((T, el) => { el.style.opacity = Math.max(0, scrimUp(T) - scrimDown(T)) })}
      />
      <div className="pack-stage" style={{ transform: `translate(-50%, -50%) scale(${scale})` }}>
        <div
          ref={track((T, el) => { el.style.transform = `scale(${1 + cam.up(T) - cam.down(T)})` })}
          style={{ position: 'absolute', inset: 0, transformOrigin: '50% 48%', ...LAYER }}
        >
          <div
            ref={track((T, el) => {
              el.style.transform =
                `translate3d(0, ${-liftF(T)}px, 0) scale(${0.92 + rewardUp(T) - rewardDown(T)})`
            })}
            style={{ position: 'absolute', inset: 0, transformOrigin: '50% 46%', ...LAYER }}
          >
            <Burst track={track} C={C} />
            <Flower track={track} C={C} tier={tier} seed={seed} />
            <Pack track={track} C={C} tier={tier} packet={packet} />
            <NamePlaque track={track} C={C} tier={tier} seed={seed} />
          </div>
          <PetalShower track={track} C={C} tier={tier} />
        </div>
      </div>
      <button className="pack-skip" onClick={finish}>Skip</button>
    </div>
  )
}
