// The pack-opening cinematic's timing, kept apart from its rendering.
//
// The composition is a pure function of authored time T: nothing mounts or
// unmounts at a scene boundary, everything moves by interpolation. That makes
// the whole timeline checkable without a browser — which matters, because a
// rendering test needs requestAnimationFrame and a visible tab, neither of
// which a headless check has. See scripts/check-pack-timeline.mjs.

import { MOTION, cueTable } from './motion.js'

// Scene durations from the design's OM_SCENES, in order.
export const SCENES = [
  ['Takeover', 1.6],
  ['Shake', 1.8],
  ['Tear', 1.3],
  ['Bloom', 2.4],
  ['Name', 2.6],
  ['Return', 1.3],
]

const table = cueTable(SCENES)
export const CUES = table.cues
export const PACK_DURATION = table.duration

// The handful of values worth asserting on: where the pack sits, and how
// visible the flower and its name plaque are, at a given T.
export function sample(T) {
  const C = CUES
  return {
    packY: MOTION.pop({ from: -1180, to: 0, start: 0.35, end: 1.25 })(T),
    packOpacity: 1 - MOTION.enter({ from: 0, to: 1, start: C.Return + 0.3, end: C.Return + 1.1 })(T),
    stemHeight: 300 * MOTION.enter({ from: 0, to: 1, start: C.Bloom + 0.1, end: C.Bloom + 1.2 })(T),
    headScale: MOTION.pop({ from: 0.2, to: 1, start: C.Bloom + 0.55, end: C.Bloom + 1.15 })(T),
    plaqueOpacity: Math.max(0,
      MOTION.enter({ from: 0, to: 1, start: C.Name + 0.15, end: C.Name + 0.6 })(T)
      - MOTION.enter({ from: 0, to: 1, start: C.Return + 0.2, end: C.Return + 0.9 })(T)),
    scrim: Math.max(0,
      MOTION.enter({ from: 0, to: 1, start: 0.15, end: 0.95 })(T)
      - MOTION.enter({ from: 0, to: 1, start: C.Return + 0.35, end: C.Return + 1.15 })(T)),
  }
}
