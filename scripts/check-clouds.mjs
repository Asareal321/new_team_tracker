// Banking a cloud.
//
// Finishing a task is the whole economy's entry point, and banking made it
// invisible: nothing appears on screen any more, so if the count doesn't go up
// there is no symptom until you notice the nav never lights. These cases exist
// so that failure is loud here instead.

import { cloudOutcome, cloudStatsPatch, pendingClouds, cloudNotice } from '../src/lib/clouds.js'
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

// — what the user is told —

ok('one waiting cloud is announced in the singular', /A cloud is waiting/.test(cloudNotice(normal, 1).text))
ok('several are counted', /3 clouds waiting/.test(cloudNotice(normal, 3).text))
ok('the notice names where they are', /greenhouse/.test(cloudNotice(normal, 1).text))

console.log(`\n${pass}/${pass + fail} passed`)
process.exit(fail ? 1 : 0)
