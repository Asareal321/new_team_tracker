// Checks the pack-opening cinematic's timeline against the beats it's supposed
// to hit. The composition is a pure function of authored time, so this needs no
// browser — which is the point: a rendering check needs requestAnimationFrame
// and a visible tab, and neither is available headlessly.
//
// Run with:  node scripts/check-pack-timeline.mjs

import { CUES, PACK_DURATION, sample } from '../src/lib/packTimeline.js'

const checks = []
const check = (name, ok, detail) => checks.push({ name, ok, detail })
const near = (a, b, tol = 0.02) => Math.abs(a - b) <= tol

console.log('cues:', Object.entries(CUES).map(([k, v]) => `${k}@${v.toFixed(1)}s`).join('  '))
console.log('duration:', PACK_DURATION.toFixed(1) + 's\n')

const at = t => sample(t)

// The pack is off-screen above until it drops, and landed by the Shake cue.
check('pack starts off-screen', at(0).packY === -1180, `packY=${at(0).packY}`)
check('pack has landed before Shake', near(at(CUES.Shake).packY, 0), `packY=${at(CUES.Shake).packY.toFixed(1)}`)

// Nothing of the flower exists before Bloom.
check('no stem before Bloom', at(CUES.Bloom).stemHeight === 0, `stem=${at(CUES.Bloom).stemHeight}`)
check('stem full by Name', near(at(CUES.Name).stemHeight, 300, 0.5), `stem=${at(CUES.Name).stemHeight.toFixed(1)}`)
check('head open by Name', near(at(CUES.Name).headScale, 1, 0.01), `head=${at(CUES.Name).headScale.toFixed(3)}`)

// The plaque is the beat that was previously suspected of firing early.
check('plaque hidden at Bloom', at(CUES.Bloom).plaqueOpacity === 0, `o=${at(CUES.Bloom).plaqueOpacity}`)
check('plaque still hidden at Name', at(CUES.Name).plaqueOpacity === 0, `o=${at(CUES.Name).plaqueOpacity}`)
check('plaque fully up by Name+0.6', near(at(CUES.Name + 0.6).plaqueOpacity, 1, 0.001),
  `o=${at(CUES.Name + 0.6).plaqueOpacity.toFixed(3)}`)
check('plaque gone by the end', at(PACK_DURATION).plaqueOpacity === 0, `o=${at(PACK_DURATION).plaqueOpacity}`)

// Everything must be cleared away by the final frame, or the overlay unmounts
// mid-picture.
check('scrim clear at the end', at(PACK_DURATION).scrim === 0, `scrim=${at(PACK_DURATION).scrim}`)
check('pack faded at the end', near(at(PACK_DURATION).packOpacity, 0, 0.001), `o=${at(PACK_DURATION).packOpacity.toFixed(3)}`)

// The scrim must be up early, or the first frames flash the app underneath.
check('scrim up by 1s', at(1).scrim > 0.95, `scrim=${at(1).scrim.toFixed(3)}`)

// Reduced motion joins at the Name cue; the reveal must still be legible from
// there, i.e. the flower is already fully open at that point.
check('reduced-motion entry shows an open flower',
  near(at(CUES.Name).headScale, 1, 0.01) && near(at(CUES.Name).stemHeight, 300, 0.5),
  `head=${at(CUES.Name).headScale.toFixed(3)} stem=${at(CUES.Name).stemHeight.toFixed(1)}`)

let failed = 0
for (const c of checks) {
  if (!c.ok) failed++
  console.log(`${c.ok ? 'ok  ' : 'FAIL'}  ${c.name.padEnd(38)} ${c.detail}`)
}
console.log(`\n${checks.length - failed}/${checks.length} passed`)
if (failed) process.exit(1)
