// A clear is two finished tasks out of Doing, counted — not an empty column.
//
// The rule lives in GardenContext, which needs React to import, so the payout
// arithmetic is re-stated here against the same constants and exercised as a
// sequence. That's enough to pin the properties that matter: how many finishes
// buy a payout, that a part-finished pair survives, and that the daily cap
// can't be farmed by finishing while capped.

import { DOING_CLEAR_REWARD, DOING_CLEAR_TASKS, DAILY_CAPS } from '../src/lib/garden.js'
import { MAX_DOING, MAX_UP_NEXT } from '../src/lib/boardLimits.js'

let pass = 0, fail = 0
function ok(name, cond, detail = '') {
  if (cond) { pass++; console.log(`ok    ${name}`) }
  else { fail++; console.log(`FAIL  ${name}${detail ? `  — ${detail}` : ''}`) }
}

// The same steps rewardDoingCleared takes, over a state object.
function finishOutOfDoing(state) {
  const pending = (state.doingPending || 0) + 1
  if (pending < DOING_CLEAR_TASKS) {
    return { ...state, doingPending: pending, lastGain: 0, paid: false }
  }
  const room = DAILY_CAPS.coins - state.dailyCoins
  const gain = Math.min(DOING_CLEAR_REWARD.coins, Math.max(0, room))
  return {
    ...state,
    coins: state.coins + gain,
    dailyCoins: state.dailyCoins + gain,
    doingPending: 0,
    clears: (state.clears || 0) + 1,
    lastGain: gain,
    paid: true,
  }
}

const fresh = () => ({ coins: 0, dailyCoins: 0, doingPending: 0, clears: 0 })
const run = (n, from = fresh()) => {
  let s = from
  for (let i = 0; i < n; i++) s = finishOutOfDoing(s)
  return s
}

// — the count —

ok('a clear is a full Doing column', DOING_CLEAR_TASKS === MAX_DOING,
  `clear=${DOING_CLEAR_TASKS}, MAX_DOING=${MAX_DOING}`)

ok('one finish pays nothing', run(1).coins === 0)
ok('one finish is remembered', run(1).doingPending === 1)
ok('two finishes pay once', run(2).coins === DOING_CLEAR_REWARD.coins)
ok('two finishes reset the tally', run(2).doingPending === 0)
ok('two finishes count one clear', run(2).clears === 1)
ok('three finishes still pay once', run(3).coins === DOING_CLEAR_REWARD.coins)
ok('four finishes pay twice', run(4).coins === DOING_CLEAR_REWARD.coins * 2)

// The old rule paid per emptied column, so N single-task clears paid N times.
// Under the count, N finishes can never pay more than N/2 payouts.
ok('finishing N tasks never pays more than N/2 times',
  [1, 2, 3, 7, 20, 51].every(n =>
    run(n).coins <= Math.floor(n / DOING_CLEAR_TASKS) * DOING_CLEAR_REWARD.coins))

// Which is the whole point: one task in Doing, finished, used to be a clear.
ok('a single task finished alone is not a clear', run(1).paid === false)

// — the part-finished pair survives —

// The tally is in stats, not the daily bucket: finishing one at 11pm and one
// at 9am is still a pair. Simulated by carrying the state across a day change.
const overnight = finishOutOfDoing({ ...run(1), dailyCoins: 0 })
ok('a pair completed across midnight still pays', overnight.coins === DOING_CLEAR_REWARD.coins)
ok('a pair completed across midnight pays from the new day\'s room',
  overnight.dailyCoins === DOING_CLEAR_REWARD.coins)

// — the daily cap —

const capped = run(2, { ...fresh(), dailyCoins: DAILY_CAPS.coins })
ok('a capped payout adds no coins', capped.coins === 0)
ok('a capped payout still resets the tally', capped.doingPending === 0)
// If the tally kept climbing while capped, the backlog would all pay out at
// once the moment the cap rolled over.
ok('finishing while capped cannot bank a backlog',
  run(10, { ...fresh(), dailyCoins: DAILY_CAPS.coins }).doingPending < DOING_CLEAR_TASKS)

const partial = run(2, { ...fresh(), dailyCoins: DAILY_CAPS.coins - 10 })
ok('a partly-capped payout pays only the room left', partial.coins === 10)
ok('a partly-capped payout cannot exceed the cap', partial.dailyCoins === DAILY_CAPS.coins)

// — the payout is worth having —

ok('a clear is worth more than one task\'s cloud', DOING_CLEAR_REWARD.coins > 0)
ok('the cap allows several clears a day',
  Math.floor(DAILY_CAPS.coins / DOING_CLEAR_REWARD.coins) >= 3)

// — the board's own limits —

ok('Up next holds more than Doing', MAX_UP_NEXT > MAX_DOING,
  'otherwise Doing is the queue and Up next is pointless')

console.log(`\n${pass}/${pass + fail} passed`)
process.exit(fail ? 1 : 0)
