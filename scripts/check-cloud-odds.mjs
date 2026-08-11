// Simulates the cloud tap-walk against the real constants in src/lib/garden.js
// and checks the three invariants the game balance depends on:
//   1. Uncommon is the most likely result — Common is the floor you land on
//      when the rolls go badly, not the expected outcome
//   2. from Uncommon upward, each tier is rarer than the one below it
//   3. every payout is a round multiple of five
//
// Run with:  node scripts/check-cloud-odds.mjs
//
// The per-tap growth chances are not themselves monotonic, so eyeballing them
// tells you nothing about the finishing curve — always run this after touching
// CLOUD_TIERS, CLOUD_MAX_TAPS or CLOUD_SKIP_CHANCE.

import { CLOUD_TIERS, CLOUD_MAX_TAPS, rollCloudGrowth } from '../src/lib/garden.js'

const RUNS = 500_000

const counts = new Array(CLOUD_TIERS.length).fill(0)
const leaps = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 }

for (let run = 0; run < RUNS; run++) {
  let tier = 1
  for (let tap = 0; tap < CLOUD_MAX_TAPS; tap++) {
    const next = rollCloudGrowth(tier)
    leaps[next - tier] += 1
    tier = next
  }
  counts[tier - 1] += 1
}

const odds = counts.map(c => c / RUNS)

console.log(`${RUNS.toLocaleString()} runs of ${CLOUD_MAX_TAPS} taps\n`)
console.log('tier        finish    shave   coins')
CLOUD_TIERS.forEach((t, i) => {
  console.log(
    `${t.name.padEnd(11)} ${(odds[i] * 100).toFixed(1).padStart(5)}%  ${String(t.shaveMinutes).padStart(5)}m  ${String(t.coins).padStart(5)}`,
  )
})

const totalTaps = RUNS * CLOUD_MAX_TAPS
console.log('\nper tap:', Object.entries(leaps)
  .filter(([, n]) => n > 0)
  .map(([gain, n]) => `+${gain} ${((n / totalTaps) * 100).toFixed(1)}%`)
  .join('   '))

// odds[1] is Uncommon: the intended peak of the curve.
const peaksAtUncommon = odds[1] === Math.max(...odds)
const fallsAfterPeak = odds.every((v, i) => i <= 1 || v < odds[i - 1])
const rounded = CLOUD_TIERS.every(t => t.shaveMinutes % 5 === 0 && t.coins % 5 === 0)

console.log(`\npeaks at Uncommon:     ${peaksAtUncommon ? 'yes' : 'NO'}`)
console.log(`falls after the peak:  ${fallsAfterPeak ? 'yes' : 'NO'}`)
console.log(`payouts round to five: ${rounded ? 'yes' : 'NO'}`)

if (!peaksAtUncommon || !fallsAfterPeak || !rounded) process.exit(1)
