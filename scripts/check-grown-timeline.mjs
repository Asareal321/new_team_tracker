// Checks the fully-grown payoff cinematic against the beats it's supposed to
// hit. The composition is a pure function of authored time, so this needs no
// browser — which is the point: a rendering check needs requestAnimationFrame
// and a visible tab, and neither is available headlessly.
//
// Run with:  node scripts/check-grown-timeline.mjs

import { CUES, GROWN_DURATION, STEM_MAX, sample } from '../src/lib/grownTimeline.js'

const checks = []
const check = (name, ok, detail) => checks.push({ name, ok, detail })
const near = (a, b, tol = 0.02) => Math.abs(a - b) <= tol
const at = t => sample(t)

console.log('cues:', Object.entries(CUES).map(([k, v]) => `${k}@${v.toFixed(1)}s`).join('  '))
console.log('duration:', GROWN_DURATION.toFixed(1) + 's   stem max:', STEM_MAX + 'px\n')

// Ready: the bed arrives and its meter tops off before anything breaks ground.
check('bed has landed by Ready end', near(at(CUES.Push).bedY, 0, 0.5), `y=${at(CUES.Push).bedY.toFixed(1)}`)
check('meter starts at 80%', near(at(0).meter, 0.8, 0.001), `m=${at(0).meter.toFixed(3)}`)
check('meter is full when the soil breaks', near(at(CUES.Push + 0.1).meter, 1, 0.001),
  `m=${at(CUES.Push + 0.1).meter.toFixed(3)}`)

// Push: nothing has grown before the cue, and the stem is at full extent by Open.
check('no stem before Push', at(CUES.Push).stem === 0, `stem=${at(CUES.Push).stem}`)
check('stem full by Open', near(at(CUES.Open).stem, STEM_MAX, 0.5), `stem=${at(CUES.Open).stem.toFixed(1)}`)
// The three spurts must actually be separate — a monotonic ramp would mean the
// overlap is wrong and the "pushing" read is lost.
const s1 = at(CUES.Push + 0.55).stem, s2 = at(CUES.Push + 1.02).stem
check('growth arrives in distinct spurts', s1 > 120 && s1 < 175 && s2 > 230 && s2 < 285,
  `after1=${s1.toFixed(0)} after2=${s2.toFixed(0)}`)

// Open: the head is shut until its cue and open by Reward.
check('head shut at Open', near(at(CUES.Open).headScale, 0.15, 0.001), `h=${at(CUES.Open).headScale.toFixed(3)}`)
check('head open by Reward', near(at(CUES.Reward).headScale, 1, 0.01), `h=${at(CUES.Reward).headScale.toFixed(3)}`)
check('core set by Reward', near(at(CUES.Reward).coreScale, 1, 0.01), `c=${at(CUES.Reward).coreScale.toFixed(3)}`)

// Reward / Settle: the plaque comes and goes on cue.
check('plaque hidden at Open', at(CUES.Open).plaqueOpacity === 0, `o=${at(CUES.Open).plaqueOpacity}`)
check('plaque hidden at Reward', at(CUES.Reward).plaqueOpacity === 0, `o=${at(CUES.Reward).plaqueOpacity}`)
check('plaque fully up by Reward+0.55', near(at(CUES.Reward + 0.55).plaqueOpacity, 1, 0.001),
  `o=${at(CUES.Reward + 0.55).plaqueOpacity.toFixed(3)}`)
check('plaque gone by the end', at(GROWN_DURATION).plaqueOpacity === 0, `o=${at(GROWN_DURATION).plaqueOpacity}`)

// The scrim must be up early or the first frames flash the garden underneath,
// and fully clear at the end or the overlay unmounts mid-picture.
check('scrim up by 0.85s', at(0.85).scrim > 0.99, `scrim=${at(0.85).scrim.toFixed(3)}`)
check('scrim clear at the end', at(GROWN_DURATION).scrim === 0, `scrim=${at(GROWN_DURATION).scrim}`)

// Reduced motion joins at Reward; the flower must already be open there or the
// entry frame shows a bare stem.
check('reduced-motion entry shows an open flower',
  near(at(CUES.Reward).headScale, 1, 0.01) && near(at(CUES.Reward).stem, STEM_MAX, 0.5),
  `head=${at(CUES.Reward).headScale.toFixed(3)} stem=${at(CUES.Reward).stem.toFixed(0)}`)

let failed = 0
for (const c of checks) {
  if (!c.ok) failed++
  console.log(`${c.ok ? 'ok  ' : 'FAIL'}  ${c.name.padEnd(38)} ${c.detail}`)
}
console.log(`\n${checks.length - failed}/${checks.length} passed`)
if (failed) process.exit(1)
