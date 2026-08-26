// Banking a cloud.
//
// Finishing a task is the whole economy's entry point, and banking made it
// invisible: nothing appears on screen any more, so if the count doesn't go up
// there is no symptom until you notice the nav never lights. These cases exist
// so that failure is loud here instead.

import { cloudOutcome, cloudStatsPatch, pendingClouds, cloudNotice, cloudPayout } from '../src/lib/clouds.js'
import { DAILY_CAPS, CLOUD_EXPECTED_COINS } from '../src/lib/garden.js'
import { attentionFor, GARDEN_GREENHOUSE, ROUTE_GARDEN } from '../src/lib/attention.js'

let pass = 0, fail = 0
function ok(name, cond, detail = '') {
  if (cond) { pass++; console.log(`ok    ${name}`) }
  else { fail++; console.log(`FAIL  ${name}${detail ? `  — ${detail}` : ''}`) }
}

const day = { day: '2026-08-21', clouds: 0, seeds: 0, coins: 0 }

// — the ordinary case, which is the one that broke —

const normal = cloudOutcome({ daily: day, quiet: false })
ok('finishing a task banks a cloud', normal.banks === 1, JSON.stringify(normal))
ok('and the stats patch actually carries it',
  cloudStatsPatch(normal).pendingClouds === 1, JSON.stringify(cloudStatsPatch(normal)))
ok('a banked cloud pays no coins directly', normal.coins === 0)

// The patch has to survive being merged the way the caller merges it.
const merged = { tasksDone: 5, ...cloudStatsPatch(normal) }
ok('the patch survives being spread alongside other stats', merged.pendingClouds === 1)

// — and the whole point: a banked cloud must light the nav —

const banked = { coins: 0, plot_count: 8, discovered: {}, packet_inventory: {}, stats: { pendingClouds: 1 } }
const lit = attentionFor({ state: banked, flowers: [], quests: [], community: {} })
ok('one banked cloud lights the greenhouse', lit[GARDEN_GREENHOUSE]?.level === 'ready')
ok('and lights the rail', lit[ROUTE_GARDEN]?.level === 'ready')

// — quiet mode and the cap —

const quiet = cloudOutcome({ daily: day, quiet: true })
ok('quiet mode banks nothing', quiet.banks === 0)
ok('quiet mode pays instead of banking', quiet.coins === CLOUD_EXPECTED_COINS)
ok('quiet mode is never silent about it', !!cloudNotice(quiet, 0).text)

const capped = cloudOutcome({ daily: { ...day, clouds: DAILY_CAPS.clouds }, quiet: false })
ok('past the cap nothing banks', capped.banks === 0)
ok('the last cloud under the cap still banks',
  cloudOutcome({ daily: { ...day, clouds: DAILY_CAPS.clouds - 1 } }).banks === 1)
ok('the cap says so rather than failing silently', cloudNotice(capped, 0).tone === 'capped')

// A bucket left over from yesterday reads as zero, so a new day banks again.
ok('a fresh day banks again', cloudOutcome({ daily: { day: null, clouds: 0 } }).banks === 1)

// — reading the bank —

ok('pendingClouds reads the bag', pendingClouds({ stats: { pendingClouds: 3 } }) === 3)
ok('a missing bag reads as zero', pendingClouds({}) === 0)
ok('a missing state reads as zero', pendingClouds(null) === 0)
ok('a negative can never be reported', pendingClouds({ stats: { pendingClouds: -2 } }) === 0)

// — two writers in one tick —
//
// This is the bug that made a banked cloud vanish. Finishing a task from Doing
// runs two writers back to back, and both rebuild the whole stats object from
// a ref. If that ref only updates when React re-renders, the second one reads
// the pre-write state and silently undoes the first: the toast said a cloud
// was waiting and the greenhouse was empty.
//
// Simulated rather than mocked — the shape of the mistake is what matters.

function makeStore({ refUpdatesOnWrite }) {
  let rendered = { stats: {} }   // what React has committed
  let ref = rendered             // what writers read
  return {
    read: () => ref,
    write(patch) {
      const next = { ...ref, ...patch }
      if (refUpdatesOnWrite) ref = next   // the fix
      rendered = next
    },
    render() { ref = rendered },          // React catching up, later
    get result() { return rendered },
  }
}

function twoWriters(store) {
  const bump = patch => {
    const cur = store.read().stats || {}
    const next = { ...cur }
    for (const [k, v] of Object.entries(patch)) next[k] = (next[k] || 0) + v
    return next
  }
  // rewardTaskDone: banks a cloud
  store.write({ stats: bump({ tasksDone: 1, pendingClouds: 1 }) })
  // recordDoingCleared: same tick, rebuilds stats from the same ref
  store.write({ stats: bump({ doingClears: 1 }) })
  store.render()
  return store.result.stats
}

const broken = twoWriters(makeStore({ refUpdatesOnWrite: false }))
ok('the old ordering really did drop the cloud (regression witness)',
  !broken.pendingClouds, JSON.stringify(broken))

const fixed = twoWriters(makeStore({ refUpdatesOnWrite: true }))
ok('writing to the ref keeps the banked cloud', fixed.pendingClouds === 1, JSON.stringify(fixed))
ok('and the second writer still records its own work', fixed.doingClears === 1)
ok('and the first writer keeps its own work too', fixed.tasksDone === 1)

// — what the user is told —

ok('one waiting cloud is announced in the singular', /A cloud is waiting/.test(cloudNotice(normal, 1).text))
ok('several are counted', /3 clouds waiting/.test(cloudNotice(normal, 3).text))
ok('the notice names where they are', /greenhouse/.test(cloudNotice(normal, 1).text))

// — what a popped cloud is worth —
//
// The bug this exists for: an Epic popped into an empty greenhouse paid twenty
// coins and threw five hours away, while the same Epic popped into a flower
// with a minute left banked four hours fifty-nine. Both are "the cloud has
// more time than the flower can take". They are now one formula.

import { cloudShaveSeconds } from '../src/lib/garden.js'

const EPIC = cloudShaveSeconds(4)

const empty = cloudPayout({ shave: EPIC, growing: false })
ok('an empty greenhouse banks the whole cloud', empty.banked === EPIC, JSON.stringify(empty))
ok('and shaves nothing, because there is nothing to shave', empty.applied === 0)

const roomy = cloudPayout({ shave: EPIC, growing: true, left: EPIC * 2 })
ok('a flower with room takes all of it', roomy.applied === EPIC && roomy.banked === 0)

const nearlyDone = cloudPayout({ shave: EPIC, growing: true, left: 60 })
ok('a flower with a minute left takes the minute', nearlyDone.applied === 60)
ok('and banks the rest', nearlyDone.banked === EPIC - 60)

// The invariant the bug broke, stated once: a cloud is conserved.
for (const [name, args] of [
  ['nothing planted', { shave: EPIC, growing: false }],
  ['nothing planted, stale left value', { shave: EPIC, growing: false, left: 9999 }],
  ['plenty of time', { shave: EPIC, growing: true, left: EPIC * 3 }],
  ['exactly enough', { shave: EPIC, growing: true, left: EPIC }],
  ['almost none', { shave: EPIC, growing: true, left: 1 }],
  ['finished flower', { shave: EPIC, growing: true, left: 0 }],
  ['a Common', { shave: cloudShaveSeconds(1), growing: false }],
]) {
  const out = cloudPayout(args)
  ok(`nothing is lost — ${name}`, out.applied + out.banked === args.shave,
    `${out.applied} + ${out.banked} ≠ ${args.shave}`)
  ok(`nothing is invented — ${name}`, out.applied >= 0 && out.banked >= 0)
}

ok('a finished flower banks the lot, exactly as an empty one does',
  cloudPayout({ shave: EPIC, growing: true, left: 0 }).banked
  === cloudPayout({ shave: EPIC, growing: false }).banked)

ok('a negative remaining time cannot invent a shave',
  cloudPayout({ shave: EPIC, growing: true, left: -600 }).applied === 0)

ok('no arguments is not a crash', cloudPayout().applied === 0)

// — and the banked time has to be visible —
//
// Signed by the amount: banking more after you have already looked at the
// greenhouse has to light it again.
const bankedState = { overflow_seconds: 3600 }
const more = { overflow_seconds: 7200 }
const sig = state => attentionFor({ state })[GARDEN_GREENHOUSE]?.signature
ok('banked time lights the greenhouse', !!sig(bankedState))
ok('and banking more lights it again', sig(bankedState) !== sig(more))
ok('while the same bank stays quiet once seen', sig(bankedState) === sig({ overflow_seconds: 3600 }))

console.log(`\n${pass}/${pass + fail} passed`)
process.exit(fail ? 1 : 0)
