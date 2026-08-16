import { useEffect, useRef, useState } from 'react'
import { RARITY_COLORS, RARITY_NAMES } from '../lib/garden'
import { CUES, PACK_DURATION, MOTION, rnd } from '../lib/packTimeline'
import './PackOpening.css'

export { PACK_DURATION }

// Flower pack opening — the reward cinematic from the Flower Pack Opening
// design. One element tree rendered as a pure function of authored time T,
// exactly as the source composition does: nothing mounts or unmounts at a
// scene boundary, everything moves by interpolation.
//
// The design ships against a composition engine with a scene scrubber and a
// tweaks panel. Only the timeline itself is needed at runtime, so it's
// reimplemented here — the cue table, `animate`, and the three easings the
// piece actually uses — rather than pulling in the editor.

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

/* ---- the pack --------------------------------------------------------- */
const PW = 320, PH = 440, TOOTH = 32, TEETH = 10, DEPTH = 16

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

function Pack({ T, C, tier, packet }) {
  const drop = MOTION.pop({ from: -1180, to: 0, start: 0.35, end: 1.25 })(T)
  const amp = MOTION.enter({ from: 0, to: 7.5, start: C.Shake + 0.15, end: C.Tear - 0.15 })(T)
    - MOTION.enter({ from: 0, to: 7.5, start: C.Tear, end: C.Tear + 0.35 })(T)
  const rattle = Math.sin((T - C.Shake) * 21) * amp
  const jolt = MOTION.pop({ from: 0, to: -26, start: C.Tear, end: C.Tear + 0.25 })(T)
    + MOTION.enter({ from: 0, to: 26, start: C.Tear + 0.3, end: C.Tear + 0.7 })(T)
  const sink = MOTION.enter({ from: 0, to: 18, start: C.Bloom + 0.1, end: C.Name })(T)
  const packFade = 1 - MOTION.enter({ from: 0, to: 1, start: C.Return + 0.3, end: C.Return + 1.1 })(T)

  const stripY = MOTION.enter({ from: 0, to: -520, start: C.Tear + 0.05, end: C.Tear + 0.85 })(T)
  const stripX = MOTION.enter({ from: 0, to: 330, start: C.Tear + 0.05, end: C.Tear + 0.95 })(T)
  const stripRot = MOTION.enter({ from: 0, to: 68, start: C.Tear + 0.05, end: C.Tear + 0.95 })(T)
  const stripFade = 1 - MOTION.enter({ from: 0, to: 1, start: C.Tear + 0.45, end: C.Tear + 0.9 })(T)

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%', width: PW, height: PH,
      marginLeft: -PW / 2, marginTop: -PH / 2 + 40,
      transform: `translateY(${drop + jolt + sink}px) rotate(${rattle}deg)`,
      transformOrigin: '50% 100%', opacity: packFade,
    }}>
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
      <div style={{
        position: 'absolute', left: 0, top: 0, width: PW, height: 78,
        background: CO.woodEdge, clipPath: zigzagStrip(78), borderRadius: '8px 8px 0 0',
        transform: `translate(${stripX}px, ${stripY}px) rotate(${stripRot}deg)`,
        opacity: stripFade, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          font: `700 11px/1.3 ${FONT_UI}`, letterSpacing: '0.1em',
          color: CO.woodInk, textTransform: 'uppercase', paddingBottom: 10,
        }}>tear here</div>
      </div>
    </div>
  )
}

/* ---- the flower ------------------------------------------------------- */
function Flower({ T, C, tier, seed }) {
  const rise = MOTION.enter({ from: 120, to: -205, start: C.Bloom + 0.05, end: C.Bloom + 1.3 })(T)
    + MOTION.enter({ from: 0, to: -22, start: C.Name, end: C.Name + 1.4 })(T)
  const stemH = MOTION.enter({ from: 0, to: 300, start: C.Bloom + 0.1, end: C.Bloom + 1.2 })(T)
  const sway = Math.sin((T - C.Bloom) * 1.5) * MOTION.enter({ from: 0, to: 2.2, start: C.Bloom + 1.3, end: C.Name })(T)
  const headPop = MOTION.pop({ from: 0.2, to: 1, start: C.Bloom + 0.55, end: C.Bloom + 1.15 })(T)
  const fade = 1 - MOTION.enter({ from: 0, to: 1, start: C.Return + 0.3, end: C.Return + 1.1 })(T)
  const flare = MOTION.pop({ from: 0, to: 1, start: C.Bloom + 1.35, end: C.Bloom + 2.1 })(T)
  const flareSpin = (T - C.Bloom) * 9
  const coreScale = MOTION.pop({ from: 0, to: 1, start: C.Bloom + 1.15, end: C.Bloom + 1.6 })(T)

  const petals = 8
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%', width: 0, height: 0,
      transform: `translateY(${rise}px) rotate(${sway}deg)`,
      transformOrigin: '50% 100%', opacity: fade,
    }}>
      <div style={{
        position: 'absolute', left: -9, top: 0, width: 18, height: stemH,
        background: CO.accentEdge, borderRadius: 9, transformOrigin: '50% 0%',
      }} />
      {[-1, 1].map(s => (
        <div key={s} style={{
          position: 'absolute', left: s < 0 ? -96 : 6, top: 96,
          width: 94, height: 40, background: CO.accent,
          border: `3px solid ${CO.accentBorder}`,
          borderRadius: s < 0 ? '40px 6px 40px 6px' : '6px 40px 6px 40px',
          transform: `rotate(${s * 14}deg) scaleX(${MOTION.pop({
            from: 0, to: 1, start: C.Bloom + 0.75 + (s < 0 ? 0 : 0.12), end: C.Bloom + 1.3,
          })(T)})`,
          transformOrigin: s < 0 ? '100% 50%' : '0% 50%',
        }} />
      ))}
      <div style={{
        position: 'absolute', left: 0, top: 0, width: 0, height: 0,
        transform: `rotate(${flareSpin}deg) scale(${flare})`, opacity: flare * 0.95,
      }}>
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
      <div style={{ position: 'absolute', left: 0, top: 0, width: 0, height: 0, transform: `scale(${headPop})` }}>
        {Array.from({ length: petals }).map((_, i) => {
          const p = MOTION.pop({
            from: 0, to: 1,
            start: C.Bloom + 0.6 + i * 0.075, end: C.Bloom + 1.25 + i * 0.075,
          })(T)
          return (
            <div key={i} style={{
              position: 'absolute', left: '50%', top: '50%', width: 118, height: 212,
              background: `linear-gradient(to top, ${tier.petal}, ${tier.petalLight})`,
              border: `3px solid ${tier.petalEdge}`,
              borderRadius: '52% 52% 40% 40% / 62% 62% 38% 38%',
              transformOrigin: '50% 100%',
              transform: `translate(-50%, -100%) rotate(${i * (360 / petals)}deg) scale(${p})`,
            }} />
          )
        })}
        {/* The design's core is a plain disc. The garden's flowers are known
            species, so the species sits in the middle of its own bloom — the
            reveal would otherwise be the same anonymous flower every time. */}
        <div style={{
          position: 'absolute', left: -70, top: -70, width: 140, height: 140,
          borderRadius: 999, background: tier.core, border: `4px solid ${tier.coreEdge}`,
          transform: `scale(${coreScale})`, display: 'grid', placeItems: 'center',
          fontSize: 74, lineHeight: 1,
        }}>
          <span>{seed.emoji}</span>
        </div>
      </div>
    </div>
  )
}

/* ---- light burst + petal shower --------------------------------------- */
function Burst({ T, C }) {
  const s = MOTION.enter({ from: 0.15, to: 4.2, start: C.Tear + 0.15, end: C.Bloom + 0.5 })(T)
  const o = MOTION.enter({ from: 0, to: 1, start: C.Tear + 0.1, end: C.Tear + 0.28 })(T)
    - MOTION.enter({ from: 0, to: 1, start: C.Tear + 0.3, end: C.Bloom + 0.5 })(T)
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%', width: 520, height: 520,
      marginLeft: -260, marginTop: -300, borderRadius: 999,
      background: 'radial-gradient(circle, rgba(254,252,247,0.95) 0%, rgba(254,252,247,0.55) 42%, rgba(254,252,247,0) 70%)',
      transform: `scale(${s})`, opacity: Math.max(0, o),
    }} />
  )
}

function PetalShower({ T, C, tier }) {
  const end = C.Return + 1.1
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {Array.from({ length: 26 }).map((_, i) => {
        const t0 = C.Tear + 0.35 + rnd(i, 3) * 3.6
        const life = 3.4 + rnd(i, 7) * 2.4
        const p = Math.min(1, Math.max(0, (T - t0) / life))
        if (p <= 0 || T > end) return null
        const x = 120 + rnd(i, 1) * 1560
        const y = -140 + p * 1320
        const drift = Math.sin(p * 6 + i) * 90
        const rot = (rnd(i, 5) - 0.5) * 900 * p + i * 27
        const w = 30 + rnd(i, 9) * 22
        const fade = Math.min(1, p * 6) * (1 - Math.max(0, (p - 0.82) / 0.18))
          * (1 - MOTION.enter({ from: 0, to: 1, start: C.Return + 0.2, end: C.Return + 1 })(T))
        return (
          <div key={i} style={{
            position: 'absolute', left: x, top: y, width: w, height: w * 1.5,
            background: i % 3 === 0 ? tier.petalLight : tier.petal,
            border: `2px solid ${tier.petalEdge}`,
            borderRadius: '52% 52% 40% 40% / 62% 62% 38% 38%',
            transform: `translateX(${drift}px) rotate(${rot}deg)`,
            opacity: Math.max(0, fade),
          }} />
        )
      })}
    </div>
  )
}

/* ---- the name plaque -------------------------------------------------- */
function NamePlaque({ T, C, tier, seed }) {
  const pop = MOTION.pop({ from: 0.6, to: 1, start: C.Name + 0.15, end: C.Name + 0.8 })(T)
  const lift = MOTION.enter({ from: 70, to: 0, start: C.Name + 0.15, end: C.Name + 0.9 })(T)
  const o = MOTION.enter({ from: 0, to: 1, start: C.Name + 0.15, end: C.Name + 0.6 })(T)
    - MOTION.enter({ from: 0, to: 1, start: C.Return + 0.2, end: C.Return + 0.9 })(T)
  const chip = MOTION.pop({ from: 0, to: 1, start: C.Name + 0.55, end: C.Name + 1.15 })(T)
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%', marginTop: 318,
      transform: `translate(-50%, ${lift}px) scale(${pop})`,
      opacity: Math.max(0, o), display: 'flex', flexDirection: 'column',
      alignItems: 'center', gap: 16,
    }}>
      <div style={{
        background: CO.wood, color: CO.woodInk, borderRadius: 14,
        border: `3px solid ${CO.woodEdge}`, boxShadow: edge(5, CO.woodEdge),
        padding: '14px 44px', font: `600 52px/1.05 ${FONT_TOY}`,
        letterSpacing: '-0.015em', whiteSpace: 'nowrap',
      }}>{seed.name}</div>
      <div style={{
        background: tier.chipBg, color: tier.chipInk, borderRadius: 999,
        padding: '8px 20px', font: `400 18px/1.35 ${FONT_NUM}`,
        letterSpacing: '0.02em', textTransform: 'uppercase',
        transform: `scale(${chip})`, opacity: chip,
      }}>{RARITY_NAMES[seed.rarity]} seed</div>
    </div>
  )
}

/* ---- the whole piece -------------------------------------------------- */
export default function PackOpening({ packet, seed, onDone }) {
  const [T, setT] = useState(0)
  const done = useRef(false)
  const stage = useRef(null)
  // The timeline effect must not depend on `onDone`. Callers pass an inline
  // arrow, so its identity changes on every render — and this component
  // re-renders every frame. Depending on it tore the effect down and restarted
  // the clock each frame, pinning T near zero and freezing the cinematic on the
  // first thing it draws. Held in a ref, the effect mounts once and runs.
  const doneCb = useRef(onDone)
  doneCb.current = onDone
  const [scale, setScale] = useState(1)
  const reduced = typeof matchMedia === 'function'
    && matchMedia('(prefers-reduced-motion: reduce)').matches

  // The composition is authored at a fixed 1920x1080, so it's scaled to fit
  // the viewport rather than reflowed — every offset in the design is in
  // stage pixels and only holds at that aspect.
  useEffect(() => {
    const fit = () => setScale(Math.min(window.innerWidth / 1920, window.innerHeight / 1080))
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [])

  // Reduced motion skips the drop, rattle and camera push and joins at the
  // reveal — the information still arrives, the theatre doesn't.
  const start = reduced ? CUES.Name : 0

  useEffect(() => {
    let raf
    const t0 = performance.now()
    const tick = now => {
      const t = start + (now - t0) / 1000
      setT(t)
      if (t >= PACK_DURATION) {
        if (!done.current) { done.current = true; doneCb.current() }
        return
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [start])

  function finish() {
    if (done.current) return
    done.current = true
    doneCb.current()
  }

  // Escape skips, matching every other dismissable surface in the app — an
  // 11-second non-interactive cinematic with no keyboard exit is a trap.
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') finish() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const C = CUES
  const cam = 1
    + MOTION.enter({ from: 0, to: 0.04, start: C.Shake + 0.1, end: C.Tear })(T)
    - MOTION.enter({ from: 0, to: 0.04, start: C.Name + 0.1, end: C.Name + 1.6 })(T)
  const lift = -MOTION.enter({ from: 0, to: 52, start: C.Name, end: C.Name + 1.5 })(T)
  const reward = 0.92
    + MOTION.enter({ from: 0, to: 0.2, start: C.Shake + 0.1, end: C.Tear + 0.4 })(T)
    - MOTION.enter({ from: 0, to: 0.16, start: C.Name, end: C.Name + 1.6 })(T)
  const scrim = MOTION.enter({ from: 0, to: 1, start: 0.15, end: 0.95 })(T)
    - MOTION.enter({ from: 0, to: 1, start: C.Return + 0.35, end: C.Return + 1.15 })(T)

  const tier = TIERS[seed.rarity] || TIERS[3]

  return (
    // The design scrims a mock board; here the real app is behind, so the
    // scrim covers the viewport and the composition sits on top of it.
    <div className="pack-overlay" onClick={finish} style={{ background: `rgba(23,17,13,${Math.max(0, scrim) * 0.72})` }}>
      <div
        ref={stage}
        className="pack-stage"
        style={{ transform: `translate(-50%, -50%) scale(${scale})` }}
      >
        <div style={{ position: 'absolute', inset: 0, transform: `scale(${cam})`, transformOrigin: '50% 48%' }}>
          <div style={{
            position: 'absolute', inset: 0,
            transform: `translateY(${lift}px) scale(${reward})`, transformOrigin: '50% 46%',
          }}>
            <Burst T={T} C={C} />
            <Flower T={T} C={C} tier={tier} seed={seed} />
            <Pack T={T} C={C} tier={tier} packet={packet} />
            <NamePlaque T={T} C={C} tier={tier} seed={seed} />
          </div>
          <PetalShower T={T} C={C} tier={tier} />
        </div>
      </div>
      <button className="pack-skip" onClick={finish}>Skip</button>
    </div>
  )
}
