// The fully-grown payoff cinematic's timing. Same arrangement as
// packTimeline.js: a pure function of authored time, so the beats can be
// asserted headlessly (scripts/check-grown-timeline.mjs).

import { MOTION, cueTable } from './motion.js'

// Scene durations from the design's OM_SCENES, in order.
//   Ready  — the garden dims to one raised bed and its growth meter tops off
//   Push   — soil breaks and the stem shoots up in three spurts
//   Open   — petals unfurl one by one, the core sets, a pollen ring rushes out
//   Reward — the plaque settles
//   Settle — sparkles fade and the garden comes back up
export const SCENES = [
  ['Ready', 1.5],
  ['Push', 1.7],
  ['Open', 1.8],
  ['Reward', 2.6],
  ['Settle', 1.4],
]

const table = cueTable(SCENES)
export const CUES = table.cues
export const GROWN_DURATION = table.duration

// The stem is three overlapping spurts. Its full extent is the sum of them,
// and the head rides on top, so both the renderer and the checks need it.
export const STEM_MAX = 130 + 110 + 96

export function stemHeight(T) {
  const C = CUES
  return MOTION.pop({ from: 0, to: 130, start: C.Push + 0.1, end: C.Push + 0.5 })(T)
    + MOTION.pop({ from: 0, to: 110, start: C.Push + 0.6, end: C.Push + 1 })(T)
    + MOTION.pop({ from: 0, to: 96, start: C.Push + 1.05, end: C.Push + 1.5 })(T)
}

export function sample(T) {
  const C = CUES
  return {
    stem: stemHeight(T),
    // The bed's meter tops off from 80% to full just before the soil breaks.
    meter: 0.8 + MOTION.enter({ from: 0, to: 0.2, start: C.Ready + 0.55, end: C.Push + 0.1 })(T),
    bedY: MOTION.pop({ from: 90, to: 0, start: 0.3, end: 1.1 })(T),
    headScale: MOTION.pop({ from: 0.15, to: 1, start: C.Open, end: C.Open + 0.7 })(T),
    coreScale: MOTION.pop({ from: 0, to: 1, start: C.Open + 0.6, end: C.Open + 1.05 })(T),
    plaqueOpacity: Math.max(0,
      MOTION.enter({ from: 0, to: 1, start: C.Reward + 0.1, end: C.Reward + 0.55 })(T)
      - MOTION.enter({ from: 0, to: 1, start: C.Settle + 0.15, end: C.Settle + 0.85 })(T)),
    scrim: Math.max(0,
      MOTION.enter({ from: 0, to: 1, start: 0.1, end: 0.85 })(T)
      - MOTION.enter({ from: 0, to: 1, start: C.Settle + 0.45, end: C.Settle + 1.2 })(T)),
  }
}
