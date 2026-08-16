// The motion primitives the garden's cinematics are authored against, taken
// from the design project's runtime (animations-v3.jsx). Both the pack opening
// and the fully-grown payoff are pure functions of authored time built out of
// these, which is what lets their timings be checked without a browser.

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

// Deterministic scatter, straight from the design — same index gives the same
// value every play, so nothing jitters between frames.
export const rnd = (i, s) => {
  const x = Math.sin(i * 127.1 + s * 311.7) * 43758.5453
  return x - Math.floor(x)
}

export const clamp01 = v => Math.min(1, Math.max(0, v))

// Turn a list of [name, duration] scenes into the cue table (the authored time
// each scene begins) plus the total run time.
export function cueTable(scenes) {
  const cues = {}
  const duration = scenes.reduce((t, [name, dur]) => {
    cues[name] = t
    return t + dur
  }, 0)
  return { cues, duration }
}
