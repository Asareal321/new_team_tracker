// The nav's glow.
//
// The whole value of a signal is that it means something. Two failure modes
// kill it, and both are quiet:
//
//   • it glows when nothing is waiting, so people learn to ignore it;
//   • it keeps glowing after you have been and looked, which is the same thing
//     one step later.
//
// So the cases written down here are mostly about the glow going OUT.

import {
  attentionFor, seenAfterVisit, affordablePacketTier, attentionTitle,
  ROUTE_GARDEN, ROUTE_COMMUNITY,
} from '../src/lib/attention.js'
import { PACKETS } from '../src/lib/garden.js'

let pass = 0, fail = 0
function ok(name, cond, detail = '') {
  if (cond) { pass++; console.log(`ok    ${name}`) }
  else { fail++; console.log(`FAIL  ${name}${detail ? `  — ${detail}` : ''}`) }
}

const HOUR = 3600
// A grow that finished an hour ago.
const done = {
  growing_seed: 'daisy',
  growing_started_at: new Date(Date.now() - 4 * HOUR * 1000).toISOString(),
  growing_grow_seconds: 3 * HOUR,
  coins: 0,
}
// A grow with time left on it.
const growing = {
  growing_seed: 'daisy',
  growing_started_at: new Date(Date.now() - 1 * HOUR * 1000).toISOString(),
  growing_grow_seconds: 3 * HOUR,
  coins: 0,
}

// — silence when there is nothing to say —

ok('an empty app glows nowhere',
  Object.keys(attentionFor({ state: { coins: 0 }, quests: [], community: {} })).length === 0)

ok('a flower still growing is not news',
  !attentionFor({ state: growing, quests: [], community: {} })[ROUTE_GARDEN])

ok('an unclaimable quest is not news',
  !attentionFor({ state: { coins: 0 }, quests: [{ claimable: false }], community: {} })[ROUTE_GARDEN])

// — the things that should speak up —

const a1 = attentionFor({ state: done, quests: [], community: {} })
ok('a finished flower lights the garden', !!a1[ROUTE_GARDEN])
ok('a finished flower is loud, not a dot', a1[ROUTE_GARDEN].level === 'ready')
ok('it says which flower', /daisy/i.test(attentionTitle(a1[ROUTE_GARDEN])), attentionTitle(a1[ROUTE_GARDEN]))

const a2 = attentionFor({ state: { coins: 0 }, quests: [{ claimable: true }, { claimable: true }], community: {} })
ok('claimable quests light the garden', a2[ROUTE_GARDEN]?.level === 'ready')
ok('the count is carried for the badge', a2[ROUTE_GARDEN].count === 2)

const a3 = attentionFor({ state: { coins: 0, overflow_seconds: 900 }, quests: [], community: {} })
ok('banked overflow time is loud', a3[ROUTE_GARDEN]?.level === 'ready')

const a4 = attentionFor({ state: { coins: 0 }, quests: [], community: { incoming: 1 } })
ok('a friend request lights community', a4[ROUTE_COMMUNITY]?.level === 'ready')
ok('the request count is carried', a4[ROUTE_COMMUNITY].count === 1)

const a5 = attentionFor({ state: { coins: 0 }, quests: [], community: { othersListings: 3 } })
ok('new listings light community quietly', a5[ROUTE_COMMUNITY]?.level === 'new')

// — a signal has to be able to go out —

const coinPacket = PACKETS.find(p => p.currency === 'coins')
const rich = { coins: coinPacket.cost }
const affordTier = affordablePacketTier(rich)

ok('a newly affordable packet is news',
  attentionFor({ state: rich, quests: [], community: {} })[ROUTE_GARDEN]?.level === 'new')

const seenGarden = seenAfterVisit(ROUTE_GARDEN, { state: rich })
ok('after visiting, the same packet is not news again',
  !attentionFor({ state: rich, quests: [], community: {}, seen: { [ROUTE_GARDEN]: seenGarden } })[ROUTE_GARDEN],
  JSON.stringify(seenGarden))

const richer = { coins: 10_000_000 }
ok('being rich forever does not glow forever',
  !attentionFor({
    state: richer, quests: [], community: {},
    seen: { [ROUTE_GARDEN]: seenAfterVisit(ROUTE_GARDEN, { state: richer }) },
  })[ROUTE_GARDEN])

const market = { othersListings: 3 }
const seenMarket = seenAfterVisit(ROUTE_COMMUNITY, { community: market })
ok('after visiting, the same listings are not news again',
  !attentionFor({ state: { coins: 0 }, quests: [], community: market, seen: { [ROUTE_COMMUNITY]: seenMarket } })[ROUTE_COMMUNITY])

ok('but one MORE listing is news again',
  attentionFor({
    state: { coins: 0 }, quests: [], community: { othersListings: 4 },
    seen: { [ROUTE_COMMUNITY]: seenMarket },
  })[ROUTE_COMMUNITY]?.level === 'new')

// A friend request is a person waiting on you, so looking at the tab is not
// the same as dealing with it. It must survive a visit.
ok('a friend request survives a visit — only answering it clears it',
  attentionFor({
    state: { coins: 0 }, quests: [], community: { incoming: 1, othersListings: 0 },
    seen: { [ROUTE_COMMUNITY]: seenAfterVisit(ROUTE_COMMUNITY, { community: { incoming: 1 } }) },
  })[ROUTE_COMMUNITY]?.level === 'ready')

// Likewise a finished flower: it is still finished after you glance at the tab.
ok('a finished flower survives a visit',
  attentionFor({
    state: done, quests: [], community: {},
    seen: { [ROUTE_GARDEN]: seenAfterVisit(ROUTE_GARDEN, { state: done }) },
  })[ROUTE_GARDEN]?.level === 'ready')

// — your own listings are not news to you —
ok('your own listing is not news',
  !attentionFor({ state: { coins: 0 }, quests: [], community: { othersListings: 0, mine: 5 } })[ROUTE_COMMUNITY])

console.log(`\n${pass}/${pass + fail} passed`)
process.exit(fail ? 1 : 0)
