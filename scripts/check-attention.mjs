// The nav's glow.
//
// A signal is only worth anything if it means something. Two failure modes
// kill it, and both are quiet:
//
//   • it glows when nothing is waiting, so people learn to ignore it;
//   • it keeps glowing after you have been and looked, which is the same thing
//     one step later.
//
// So most of what is written down here is the glow going OUT. Clearing is by
// signature: going to look records the cause you were shown, and the same
// cause never glows twice — but a changed cause is news again.

import {
  attentionFor, signatures, primeSignatures, attentionTitle, affordablePacketTier, affordable,
  ROUTE_BOARD, ROUTE_COMMUNITY, ROUTE_GARDEN,
  GARDEN_GREENHOUSE, GARDEN_BEDS, GARDEN_HERBARIUM, GARDEN_SHOP,
} from '../src/lib/attention.js'
import { PACKETS } from '../src/lib/garden.js'

let pass = 0, fail = 0
function ok(name, cond, detail = '') {
  if (cond) { pass++; console.log(`ok    ${name}`) }
  else { fail++; console.log(`FAIL  ${name}${detail ? `  — ${detail}` : ''}`) }
}

const HOUR = 3600
const ago = h => new Date(Date.now() - h * HOUR * 1000).toISOString()

const empty = { coins: 0, plot_count: 8, discovered: {}, packet_inventory: {} }
const done = { ...empty, growing_seed: 'daisy', growing_started_at: ago(4), growing_grow_seconds: 3 * HOUR }
const growing = { ...empty, growing_seed: 'daisy', growing_started_at: ago(1), growing_grow_seconds: 3 * HOUR }

// Look at everything, so nothing is "new" any more.
const seenAll = input => signatures(input)

// — silence when there is nothing to say —

ok('an empty app glows nowhere',
  Object.keys(attentionFor({ state: empty, flowers: [], quests: [], community: {} })).length === 0)

ok('a flower still growing is not news',
  !attentionFor({ state: growing, flowers: [], quests: [], community: {} })[GARDEN_GREENHOUSE])

ok('an unclaimable quest is not news',
  !attentionFor({ state: empty, flowers: [], quests: [{ claimable: false }], community: {} })[ROUTE_BOARD])

// A first run must not open onto a lit-up rail. Everything incremental stays
// quiet until there is a previous look to be newer than.
const firstRun = attentionFor({
  state: { ...empty, coins: 999_999, discovered: { daisy: 1 } },
  flowers: [], quests: [], community: { othersListings: 5 },
})
ok('a first run does not glow for things that merely exist',
  !firstRun[GARDEN_SHOP] && !firstRun[GARDEN_HERBARIUM] && !firstRun[ROUTE_COMMUNITY],
  Object.keys(firstRun).join(', '))

// — quests belong to the board, where they are claimed —

const q = attentionFor({ state: empty, flowers: [], quests: [{ claimable: true }, { claimable: true }], community: {} })
ok('a finished quest lights the TASKBOARD, not the garden', !!q[ROUTE_BOARD] && !q[ROUTE_GARDEN])
ok('a finished quest is loud', q[ROUTE_BOARD].level === 'ready')
ok('the quest count rides the badge', q[ROUTE_BOARD].count === 2)

// — the garden's own rooms —

const g1 = attentionFor({ state: done, flowers: [], quests: [], community: {} })
ok('a finished flower lights the greenhouse', g1[GARDEN_GREENHOUSE]?.level === 'ready')
ok('it says which flower', /daisy/i.test(attentionTitle(g1[GARDEN_GREENHOUSE])))
ok('and it lights the garden tab in the rail too', g1[ROUTE_GARDEN]?.level === 'ready')

const g2 = attentionFor({
  state: { ...empty, packet_inventory: { common: 2 } }, flowers: [], quests: [], community: {},
})
ok('packets waiting light the greenhouse', g2[GARDEN_GREENHOUSE]?.level === 'ready')

const full = { ...empty, plot_count: 3 }
const g3 = attentionFor({ state: full, flowers: [{}, {}, {}], quests: [], community: {} })
ok('a full garden lights the beds', g3[GARDEN_BEDS]?.level === 'ready')
ok('a garden with room does not',
  !attentionFor({ state: full, flowers: [{}, {}], quests: [], community: {} })[GARDEN_BEDS])

// — going to look is what puts it out —

const doneInput = { state: done, flowers: [], quests: [], community: {} }
const afterGreenhouse = attentionFor({ ...doneInput, seen: seenAll(doneInput) })
ok('visiting clears the greenhouse glow', !afterGreenhouse[GARDEN_GREENHOUSE])
ok('visiting clears the rail glow with it', !afterGreenhouse[ROUTE_GARDEN])

// The rail can be put out on its own — that is the whole point of the roll-up.
// It has to clear using the signature a *visit* records, which is the one
// signatures() hands back for the rail. Deriving it two different ways is the
// bug this case exists for: the rail then never cleared at all.
ok('signatures() knows about the rail roll-up', !!signatures(doneInput)[ROUTE_GARDEN])

const railOnly = attentionFor({
  ...doneInput,
  seen: { [ROUTE_GARDEN]: signatures(doneInput)[ROUTE_GARDEN] },
})
ok('visiting the garden clears the rail but leaves the room lit',
  !railOnly[ROUTE_GARDEN] && !!railOnly[GARDEN_GREENHOUSE])

// And a new cause in any room re-lights the rail, even one already visited.
const moreLater = attentionFor({
  state: { ...done, stats: { pendingClouds: 1 } }, flowers: [], quests: [], community: {},
  seen: { [ROUTE_GARDEN]: signatures(doneInput)[ROUTE_GARDEN] },
})
ok('a new cause re-lights the rail after a visit', !!moreLater[ROUTE_GARDEN])

// — but a changed cause is news again —

const twoQuests = { state: empty, flowers: [], quests: [{ claimable: true }], community: {} }
const seenOne = seenAll(twoQuests)
ok('the same finished quest does not glow twice',
  !attentionFor({ ...twoQuests, seen: seenOne })[ROUTE_BOARD])
ok('but a SECOND finished quest does',
  attentionFor({
    state: empty, flowers: [], quests: [{ claimable: true }, { claimable: true }],
    community: {}, seen: seenOne,
  })[ROUTE_BOARD]?.level === 'ready')

const otherFlower = { ...done, growing_seed: 'tulip' }
ok('a different flower finishing is news again',
  attentionFor({ state: otherFlower, flowers: [], quests: [], community: {}, seen: seenAll(doneInput) })[GARDEN_GREENHOUSE]?.level === 'ready')

// — the shop, in seeds —
//
// Seeds are the first currency you earn: one per task added, and the cheapest
// packet costs several. Reaching that first packet is the earliest thing the
// shop has to say, and it used to be excluded on the grounds that a
// seed-priced packet is "always affordable".

const SEED_PACKET = PACKETS.find(p => p.currency === 'seeds')

ok('no seeds affords nothing', !affordable({ seeds: 0, coins: 0 }).seedPacket)
ok('one seed short affords nothing', !affordable({ seeds: SEED_PACKET.cost - 1 }).seedPacket)
ok('enough seeds affords the packet', !!affordable({ seeds: SEED_PACKET.cost }).seedPacket)

const sprouts = { ...empty, seeds: SEED_PACKET.cost }
const noSeeds = { ...empty, seeds: 0 }
const seenBroke = seenAll({ state: noSeeds, flowers: [], quests: [], community: {} })

const seedLit = attentionFor({ state: sprouts, flowers: [], quests: [], community: {}, seen: { ...seenBroke, [GARDEN_SHOP]: 'afford:-:-1' } })
ok('earning the third seed lights the shop', !!seedLit[GARDEN_SHOP], JSON.stringify(seedLit))
ok('and lights the garden tab in the rail', !!seedLit[ROUTE_GARDEN])
ok('it names what you can afford and the price',
  /garden packet/i.test(attentionTitle(seedLit[GARDEN_SHOP])) && /3 seeds/.test(attentionTitle(seedLit[GARDEN_SHOP])),
  attentionTitle(seedLit[GARDEN_SHOP]))

// Going to look is what puts it out, whether or not you buy anything.
const sproutInput = { state: sprouts, flowers: [], quests: [], community: {} }
ok('visiting the shop clears it even without buying',
  !attentionFor({ ...sproutInput, seen: seenAll(sproutInput) })[GARDEN_SHOP])

// Buying takes you below the price: nothing to say, so nothing is said.
ok('buying the packet leaves the shop quiet',
  !attentionFor({ state: { ...empty, seeds: 0 }, flowers: [], quests: [], community: {}, seen: seenAll(sproutInput) })[GARDEN_SHOP])

// And earning your way back to the SAME packet is not news again — the
// signature is what you can afford, not how much you hold.
ok('re-affording the same packet is not news',
  !attentionFor({ state: sprouts, flowers: [], quests: [], community: {}, seen: seenAll(sproutInput) })[GARDEN_SHOP])

// A seed that changes nothing about what you can buy must not re-light it.
ok('a fourth seed is not news',
  !attentionFor({ state: { ...empty, seeds: SEED_PACKET.cost + 1 }, flowers: [], quests: [], community: {}, seen: seenAll(sproutInput) })[GARDEN_SHOP])

// — priming: a quiet signal needs a baseline before it can ever fire —

const primeInput = { state: { ...empty, seeds: SEED_PACKET.cost, discovered: { daisy: 1 } }, flowers: [], quests: [], community: {} }
const primed = primeSignatures(primeInput)
ok('priming covers the quiet scopes', !!primed[GARDEN_SHOP] && !!primed[GARDEN_HERBARIUM])
ok('priming never silences a loud one — a banked cloud still speaks on first run',
  !primeSignatures({ state: { ...empty, stats: { pendingClouds: 1 } }, flowers: [], quests: [], community: {} })[GARDEN_GREENHOUSE])

// — the shop, in coins —

const coinPacket = PACKETS.find(p => p.currency === 'coins')
const poor = { ...empty, coins: 0 }
const rich = { ...empty, coins: coinPacket.cost }
const seenPoor = seenAll({ state: poor, flowers: [], quests: [], community: {} })

ok('a newly affordable coin packet lights the shop',
  attentionFor({ state: rich, flowers: [], quests: [], community: {}, seen: { ...seenPoor, [GARDEN_SHOP]: 'afford:-:-1' } })[GARDEN_SHOP]?.level === 'new')

const richInput = { state: rich, flowers: [], quests: [], community: {} }
ok('after visiting the shop it goes quiet',
  !attentionFor({ ...richInput, seen: seenAll(richInput) })[GARDEN_SHOP])

const richer = { ...empty, coins: 10_000_000 }
const richerInput = { state: richer, flowers: [], quests: [], community: {} }
ok('being rich forever does not glow forever',
  !attentionFor({ ...richerInput, seen: seenAll(richerInput) })[GARDEN_SHOP])
ok('affordablePacketTier finds the best reachable packet', affordablePacketTier(richer) === PACKETS.length - 1)

// — the herbarium —

const herb = { ...empty, discovered: { daisy: 1 } }
const herbInput = { state: herb, flowers: [], quests: [], community: {} }
ok('a new species lights the herbarium',
  attentionFor({ state: { ...empty, discovered: { daisy: 1, tulip: 1 } }, flowers: [], quests: [], community: {}, seen: seenAll(herbInput) })[GARDEN_HERBARIUM]?.level === 'new')
ok('the same species does not light it twice',
  !attentionFor({ ...herbInput, seen: seenAll(herbInput) })[GARDEN_HERBARIUM])

// — banked clouds —
//
// Clouds are put by instead of interrupting, so the greenhouse is the only
// thing that says they exist. If this signal is wrong they are invisible.

const banked = { ...empty, stats: { pendingClouds: 3 } }
const bankedInput = { state: banked, flowers: [], quests: [], community: {} }
ok('waiting clouds light the greenhouse',
  attentionFor(bankedInput)[GARDEN_GREENHOUSE]?.level === 'ready')
ok('the cloud count rides the badge', attentionFor(bankedInput)[GARDEN_GREENHOUSE].count === 3)
ok('and they light the rail too', attentionFor(bankedInput)[ROUTE_GARDEN]?.level === 'ready')
ok('letting them in puts it out',
  !attentionFor({ state: { ...empty, stats: { pendingClouds: 0 } }, flowers: [], quests: [], community: {} })[GARDEN_GREENHOUSE])
ok('one more cloud is news again',
  attentionFor({
    state: { ...empty, stats: { pendingClouds: 4 } }, flowers: [], quests: [], community: {},
    seen: seenAll(bankedInput),
  })[GARDEN_GREENHOUSE]?.level === 'ready')

// — community —

const req = { state: empty, flowers: [], quests: [], community: { incoming: 1 } }
ok('a friend request lights community', attentionFor(req)[ROUTE_COMMUNITY]?.level === 'ready')
ok('the request count rides the badge', attentionFor(req)[ROUTE_COMMUNITY].count === 1)
ok('visiting clears it — the request is still there, the news is not',
  !attentionFor({ ...req, seen: seenAll(req) })[ROUTE_COMMUNITY])
ok('a second request is news again',
  attentionFor({ state: empty, flowers: [], quests: [], community: { incoming: 2 }, seen: seenAll(req) })[ROUTE_COMMUNITY]?.level === 'ready')
ok('your own listings are not news to you',
  !attentionFor({ state: empty, flowers: [], quests: [], community: { othersListings: 0, mine: 5 } })[ROUTE_COMMUNITY])

console.log(`\n${pass}/${pass + fail} passed`)
process.exit(fail ? 1 : 0)
