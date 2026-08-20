// When a daily allowance is worth saying out loud.
//
// The three cap chips used to render permanently: "9/12 left", "210/300 left",
// "7/10 left", all day, every day. On a phone that was three of the six chips
// competing for a 217px column, and none of them told you anything — a cap
// that is fine is not news. Now a cap is silent until it's nearly gone.

import { capState, LOW_AT } from '../src/lib/dailyCaps.js'
import { DAILY_CAPS } from '../src/lib/garden.js'

let pass = 0, fail = 0
function ok(name, cond, detail = '') {
  if (cond) { pass++; console.log(`ok    ${name}`) }
  else { fail++; console.log(`FAIL  ${name}${detail ? `  — ${detail}` : ''}`) }
}

const CAP = 12

ok('a full allowance says nothing', capState(CAP, CAP) === 'hidden')
ok('most of an allowance says nothing', capState(9, CAP) === 'hidden')
ok('just above the line still says nothing', capState(4, CAP) === 'hidden',
  `4 of ${CAP} is above ${LOW_AT * 100}%`)
ok('at the line it speaks', capState(3, CAP) === 'low')
ok('below the line it speaks', capState(1, CAP) === 'low')
ok('empty says so plainly', capState(0, CAP) === 'spent')

// Below zero shouldn't be reachable, but a cap that was lowered after someone
// had already spent past it would land there, and it must read as spent rather
// than wrapping back to hidden.
ok('over-spent still reads as spent', capState(-5, CAP) === 'spent')

// Three states, no fourth, whatever the numbers.
ok('every value has exactly one state',
  Array.from({ length: CAP + 1 }, (_, i) => i)
    .every(left => ['hidden', 'low', 'spent'].includes(capState(left, CAP))))

// The states have to be ordered: as the allowance drains it can go quiet ->
// low -> spent and never back up.
const walk = Array.from({ length: CAP + 1 }, (_, i) => capState(CAP - i, CAP))
const rank = { hidden: 0, low: 1, spent: 2 }
ok('draining an allowance only escalates',
  walk.every((s, i) => i === 0 || rank[s] >= rank[walk[i - 1]]),
  walk.join(' '))
ok('it passes through low before spent', walk.includes('low'))

// A missing or zero cap can't be divided by. Every real cap is positive, so
// this is about the moment before state loads rather than a live case.
ok('an unknown cap says nothing', capState(0, 0) === 'hidden')
ok('an undefined cap says nothing', capState(5, undefined) === 'hidden')

// Every real allowance must be able to reach each state — a cap so large that
// the warning never fires would be a chip that exists but never renders.
for (const [key, cap] of Object.entries(DAILY_CAPS)) {
  ok(`${key} can be full and quiet`, capState(cap, cap) === 'hidden')
  ok(`${key} has a warning band`, capState(Math.floor(cap * LOW_AT), cap) === 'low', `cap ${cap}`)
  ok(`${key} can be spent`, capState(0, cap) === 'spent')
}

// The warning has to arrive with something still left to spend, or it's just
// a second way of saying "spent".
ok('the warning band is more than one unit wide for every cap',
  Object.values(DAILY_CAPS).every(cap => Math.floor(cap * LOW_AT) >= 1),
  Object.entries(DAILY_CAPS).map(([k, c]) => `${k}:${Math.floor(c * LOW_AT)}`).join(' '))

ok('the threshold is a minority of the allowance', LOW_AT > 0 && LOW_AT < 0.5)

console.log(`\n${pass}/${pass + fail} passed`)
process.exit(fail ? 1 : 0)
