// The pack-opening cinematic's timing, kept apart from its rendering.
//
// The composition is a pure function of authored time T: nothing mounts or
// unmounts at a scene boundary, everything moves by interpolation. That makes
// the whole timeline checkable without a browser — which matters, because a
// rendering test needs requestAnimationFrame and a visible tab, neither of
// which a headless check has. See scripts/check-pack-timeline.mjs.

// Scene durations from the design's OM_SCENES, in order.
export const SCENES = [
  ['Takeover', 1.6],
  ['Shake', 1.8],
  ['Tear', 1.3],
  ['Bloom', 2.4],
  ['Name', 2.6],
  ['Return', 1.3],
]

// Cue table: the authored time each scene begins.
export const CUES = {}
export const PACK_DURATION = SCENES.reduce((t, [name, dur]) => {
  CUES[name] = t
  return t + dur
}, 0)

export const Easing = {
  easeOutCubic: t => (--t) * t * t + 1,
  easeInOutSine: t => -(Math.cos(Math.PI * t) - 1) / 2,
  easeOutBack: t => {
    const c1 = 1.70158, c3 = c1 + 1
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
  },
}

// animate({from,to,start,end,ease})(t) — holds `from` before start and `to`
// after end, so every value is defined across the whole timeline.
export function animate({ from = 0, to = 1, start = 0, end = 1, ease = Easing.easeOutCubic }) {
  return t => {
    if (t <= start) return from
    if (t >= end) return to
    return from + (to - from) * ease((t - start) / (end - start))
  }
}

export const MOTION = {
  enter: o => animate({ ease: Easing.easeOutCubic, ...o }),
  pop: o => animate({ ease: Easing.easeOutBack, ...o }),
  drift: o => animate({ ease: Easing.easeInOutSine, ...o }),
}

// Deterministic scatter for the petal shower, straight from the design.
export const rnd = (i, s) => {
  const x = Math.sin(i * 127.1 + s * 311.7) * 43758.5453
  return x - Math.floor(x)
}

// The handful of values worth asserting on: where the pack sits, and how
// visible the flower and its name plaque are, at a given T.
export function sample(T) {
  const C = CUES
  return {
    packY: MOTION.pop({ from: -1180, to: 0, start: 0.35, end: 1.25 })(T),
    packOpacity: 1 - MOTION.enter({ from: 0, to: 1, start: C.Return + 0.3, end: C.Return + 1.1 })(T),
    stemHeight: MOTION.enter({ from: 0, to: 300, start: C.Bloom + 0.1, end: C.Bloom + 1.2 })(T),
    headScale: MOTION.pop({ from: 0.2, to: 1, start: C.Bloom + 0.55, end: C.Bloom + 1.15 })(T),
    plaqueOpacity: Math.max(0,
      MOTION.enter({ from: 0, to: 1, start: C.Name + 0.15, end: C.Name + 0.6 })(T)
      - MOTION.enter({ from: 0, to: 1, start: C.Return + 0.2, end: C.Return + 0.9 })(T)),
    scrim: Math.max(0,
      MOTION.enter({ from: 0, to: 1, start: 0.15, end: 0.95 })(T)
      - MOTION.enter({ from: 0, to: 1, start: C.Return + 0.35, end: C.Return + 1.15 })(T)),
  }
}
