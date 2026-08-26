// Planning hours.
//
// Two of these rules are load-bearing and would fail silently. The cap
// exemption is invisible until the day someone is productive AND plans at
// night, and gets nothing for it — which is the exact user this feature is
// for. The tomorrow rule is invisible until someone works out that setting
// bedtime to "in five minutes" is the best move in the game.

import {
  parseTime, formatTime, planningWindows, within, activeWindow, isActive,
  addTaskReward, spendBonus, minutesLeft, BONUS_CAP, MORNING, EVENING,
} from '../src/lib/planningHours.js'
import { ADD_TASK_REWARD, DAILY_CAPS } from '../src/lib/garden.js'

let pass = 0, fail = 0
const ok = (name, cond, detail = '') => {
  if (cond) { pass++; console.log(`ok    ${name}`) }
  else { fail++; console.log(`FAIL  ${name}${detail ? `  — ${detail}` : ''}`) }
}

const LIVE = { wake: '07:00', bed: '23:00', effectiveFrom: '2020-01-01' }
const at = (h, m = 0) => new Date(2026, 0, 15, h, m)

// — reading the clock —

ok('a time parses', parseTime('07:30') === 450)
ok('a single-digit hour parses', parseTime('7:30') === 450)
ok('midnight is zero, not falsy-by-accident', parseTime('00:00') === 0)
ok('an impossible hour is rejected', parseTime('24:00') === null)
ok('an impossible minute is rejected', parseTime('07:60') === null)
ok('nonsense is rejected', parseTime('later') === null)
ok('nothing is rejected', parseTime(null) === null && parseTime('') === null)
ok('formatting round-trips', formatTime(parseTime('07:05')) === '07:05')

// — the windows —

ok('the morning window is the hour AFTER waking',
  planningWindows(LIVE).find(w => w.kind === MORNING).start === parseTime('07:00'))
ok('the evening window is the hour BEFORE bed',
  planningWindows(LIVE).find(w => w.kind === EVENING).end === parseTime('23:00'))

ok('just after waking is the morning window', activeWindow(LIVE, at(7, 1)) === MORNING)
ok('the waking minute itself counts', activeWindow(LIVE, at(7, 0)) === MORNING)
ok('an hour later it has closed', activeWindow(LIVE, at(8, 0)) === null)
ok('the hour before bed is the evening window', activeWindow(LIVE, at(22, 30)) === EVENING)
ok('bedtime itself is too late', activeWindow(LIVE, at(23, 0)) === null)
ok('the afternoon is not a planning hour', activeWindow(LIVE, at(15, 0)) === null)

// A late bedtime puts the evening window on the other side of midnight, which
// is where an hours-and-minutes implementation goes wrong.
const NIGHT_OWL = { wake: '10:00', bed: '00:30', effectiveFrom: '2020-01-01' }
ok('a window crossing midnight is open before midnight',
  activeWindow(NIGHT_OWL, at(23, 45)) === EVENING)
ok('and still open after it', activeWindow(new Date(0) && NIGHT_OWL, new Date(2026, 0, 16, 0, 10)) === EVENING)
ok('and shut once bedtime passes',
  activeWindow(NIGHT_OWL, new Date(2026, 0, 16, 0, 45)) === null)
ok('the early hours are not the morning window',
  activeWindow(NIGHT_OWL, new Date(2026, 0, 16, 3, 0)) === null)

// An early riser's morning window crosses nothing, but an early-hours wake
// time still has to behave.
const EARLY = { wake: '00:10', bed: '20:00', effectiveFrom: '2020-01-01' }
ok('a wake time just after midnight opens a window',
  activeWindow(EARLY, new Date(2026, 0, 15, 0, 30)) === MORNING)

ok('the countdown says how long is left', minutesLeft(LIVE, at(7, 20)) === 40)
ok('and across midnight too',
  minutesLeft(NIGHT_OWL, new Date(2026, 0, 15, 23, 50)) === 40)
ok('and is zero outside a window', minutesLeft(LIVE, at(15, 0)) === 0)

// — the tomorrow rule —

ok('hours set for tomorrow are not live today',
  !isActive({ ...LIVE, effectiveFrom: '2026-01-16' }, at(7, 30)))
ok('and are live tomorrow',
  isActive({ ...LIVE, effectiveFrom: '2026-01-16' }, new Date(2026, 0, 16, 7, 30)))
ok('the day itself counts, not the day after',
  isActive({ ...LIVE, effectiveFrom: '2026-01-15' }, at(7, 30)))
ok('unset hours are never active', !isActive({}, at(7, 30)))
ok('hours with no effective day are not active — nothing was ever saved',
  !isActive({ wake: '07:00', bed: '23:00' }, at(7, 30)))
ok('a pending change pays nothing, whatever the clock says',
  activeWindow({ ...LIVE, effectiveFrom: '2026-01-16' }, at(7, 30)) === null)

// — what a task pays —

const fresh = { day: '2026-01-15', seeds: 0, coins: 0, clouds: 0 }
const R = { base: ADD_TASK_REWARD, caps: DAILY_CAPS }

const plain = addTaskReward({ ...R, daily: fresh, window: null })
ok('outside a window a task pays the ordinary reward',
  plain.seeds === ADD_TASK_REWARD.seeds && plain.coins === ADD_TASK_REWARD.coins)
ok('and no bonus', plain.bonusSeeds === 0 && plain.bonusCoins === 0)

const inWindow = addTaskReward({ ...R, daily: fresh, window: MORNING })
ok('in a window a task pays double seeds',
  inWindow.seeds + inWindow.bonusSeeds === ADD_TASK_REWARD.seeds * 2)
ok('and double coins',
  inWindow.coins + inWindow.bonusCoins === ADD_TASK_REWARD.coins * 2)

// The one that matters: capped out, and planning still pays.
const capped = { day: '2026-01-15', seeds: DAILY_CAPS.seeds, coins: DAILY_CAPS.coins, clouds: 0 }
const late = addTaskReward({ ...R, daily: capped, window: EVENING })
ok('the ordinary reward stops at the daily cap', late.seeds === 0 && late.coins === 0)
ok('but the bonus is not capped by it — planning at night still pays',
  late.bonusSeeds === ADD_TASK_REWARD.seeds && late.bonusCoins === ADD_TASK_REWARD.coins)

// The bonus has its own ceiling, or the morning window is a faucet.
let daily = { ...fresh }
let bonusSeeds = 0
for (let i = 0; i < 40; i++) {
  const r = addTaskReward({ ...R, daily, window: MORNING })
  bonusSeeds += r.bonusSeeds
  daily = { ...daily, seeds: daily.seeds + r.seeds, coins: daily.coins + r.coins, bonus: spendBonus(daily, r) }
}
ok('the bonus stops at its own cap', bonusSeeds === BONUS_CAP.seeds, `${bonusSeeds}`)
ok('and the window is spent, not the day', daily.bonus[MORNING].seeds === BONUS_CAP.seeds)

// Each window has its own allowance — using up the morning must not silence
// the evening, which is the half of the habit that is harder to build.
const eveningAfter = addTaskReward({ ...R, daily, window: EVENING })
ok('the evening window is untouched by a spent morning',
  eveningAfter.bonusSeeds === ADD_TASK_REWARD.seeds)

ok('a bonus is never negative', addTaskReward({
  ...R, daily: { ...fresh, bonus: { [MORNING]: { seeds: 99, coins: 999 } } }, window: MORNING,
}).bonusSeeds === 0)

ok('spendBonus leaves the bucket alone outside a window',
  spendBonus(fresh, { window: null }) === undefined)

console.log(`\n${pass}/${pass + fail} passed`)
process.exit(fail ? 1 : 0)
