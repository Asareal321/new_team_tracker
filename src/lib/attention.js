// What the nav should be pointing at.
//
// Several things in the app can quietly become worth doing — a flower
// finishes, a quest completes, a packet comes into reach, someone asks to be
// your friend. None announce themselves, so you only find out by going and
// looking, which is backwards.
//
// This turns state you already have into a signal per *scope*. A scope is a
// place you can navigate to: a route in the rail, or a room inside the garden.
// It is a pure function on purpose — what counts as "worth a glow" is a
// judgement, and a judgement should be testable without a browser.
//
// Two levels:
//
//   • `ready` — something is finished and waiting for you. Loud: it pulses.
//   • `new`   — something appeared since you last looked. Quiet: a dot.
//
// Clearing is by *signature*, not by a timer and not by level. Every signal
// carries a short string describing its cause; visiting a scope records that
// string, and a signal stays quiet while its signature matches what you were
// last shown. So going to look is what puts a glow out — and if the cause then
// changes (a second friend request, a different flower ready), the signature
// changes with it and it speaks up again.
//
// The one asymmetry: a `new` signal with no record at all is not shown. It
// means "this appeared since you last looked", and on a first run there is no
// last look — a brand new account should not open onto a lit-up rail.

import { remainingSeconds, PACKETS, seedByKey, SEEDS } from './garden.js'

export const ROUTE_BOARD = '/'
export const ROUTE_COMMUNITY = '/community'
export const ROUTE_GARDEN = '/garden'

// Rooms inside the garden page. Prefixed so they can share one seen-store with
// the routes without ever colliding with a path.
export const GARDEN_GREENHOUSE = 'garden:greenhouse'
export const GARDEN_BEDS = 'garden:garden'
export const GARDEN_HERBARIUM = 'garden:herbarium'
export const GARDEN_SHOP = 'garden:shop'

// Which rail tab a garden room reports up to.
export const GARDEN_SCOPES = [GARDEN_GREENHOUSE, GARDEN_BEDS, GARDEN_HERBARIUM, GARDEN_SHOP]

export function affordablePacketTier(state) {
  const coins = state?.coins ?? 0
  let best = -1
  PACKETS.forEach((p, i) => {
    if (p.currency === 'coins' && coins >= p.cost) best = Math.max(best, i)
  })
  return best
}

const packetsHeld = state =>
  Object.values(state?.packet_inventory || {}).reduce((n, v) => n + (Number(v) || 0), 0)

const speciesFound = state => Object.keys(state?.discovered || {}).length

// Every raw signal, before anything is silenced. Each is a scope, a level, a
// signature, and the sentence that explains it.
function raw({ state, flowers, quests, community }) {
  const out = {}
  const add = (scope, level, signature, reason, count = 0) => {
    const prev = out[scope]
    if (!prev) { out[scope] = { level, signature, reasons: [reason], count }; return }
    prev.reasons.push(reason)
    prev.signature += `|${signature}`
    prev.count = Math.max(prev.count, count)
    if (level === 'ready') prev.level = 'ready'
  }

  // — the board: quests are claimed on the greenhouse strip, not in the garden —
  const claimable = (quests || []).filter(q => q.claimable).length
  if (claimable > 0) {
    add(ROUTE_BOARD, 'ready', `quests:${claimable}`,
      claimable === 1 ? 'A quest is finished' : `${claimable} quests are finished`, claimable)
  }

  // — the greenhouse —
  if (state?.growing_seed && remainingSeconds(state) === 0) {
    const seed = seedByKey(state.growing_seed)
    add(GARDEN_GREENHOUSE, 'ready', `ready:${state.growing_seed}`,
      `Your ${seed ? seed.name.toLowerCase() : 'flower'} is ready`)
  }
  if ((state?.overflow_seconds ?? 0) > 0) {
    add(GARDEN_GREENHOUSE, 'ready', 'overflow', 'Banked time is waiting for a seed')
  }
  // Clouds your finished tasks earned, waiting to be let in.
  const pending = state?.stats?.pendingClouds || 0
  if (pending > 0) {
    add(GARDEN_GREENHOUSE, 'ready', `clouds:${pending}`,
      pending === 1 ? 'A cloud is waiting' : `${pending} clouds are waiting`, pending)
  }

  const packets = packetsHeld(state)
  if (packets > 0) {
    add(GARDEN_GREENHOUSE, 'ready', `packets:${packets}`,
      packets === 1 ? 'A packet to open' : `${packets} packets to open`, packets)
  }

  // — the beds —
  const planted = flowers?.length ?? 0
  const plots = state?.plot_count ?? 0
  if (plots > 0 && planted >= plots) {
    add(GARDEN_BEDS, 'ready', `full:${planted}/${plots}`, 'Your garden is full')
  }

  // — the herbarium —
  const found = speciesFound(state)
  if (found > 0) {
    add(GARDEN_HERBARIUM, 'new', `found:${found}`,
      found >= SEEDS.length ? 'Every species found' : 'A new species in the herbarium')
  }

  // — the shop —
  const tier = affordablePacketTier(state)
  if (tier >= 0) {
    const packet = PACKETS[tier]
    add(GARDEN_SHOP, 'new', `tier:${tier}`, `You can afford the ${packet.name.toLowerCase()}`)
  }

  // — community —
  const incoming = community?.incoming ?? 0
  if (incoming > 0) {
    add(ROUTE_COMMUNITY, 'ready', `friends:${incoming}`,
      incoming === 1 ? 'A friend request' : `${incoming} friend requests`, incoming)
  }
  const listings = community?.othersListings ?? 0
  if (listings > 0) {
    add(ROUTE_COMMUNITY, 'new', `market:${listings}`, 'Something new on the market')
  }

  return out
}

// The signature of every scope right now, whether or not it is glowing. This
// is what a visit records, and what a first run primes itself with.
export function signatures(input) {
  const all = raw(input)
  const out = {}
  for (const [scope, sig] of Object.entries(all)) out[scope] = sig.signature
  return out
}

function shown(scope, signal, seen) {
  const mark = seen?.[scope]
  if (mark === signal.signature) return false      // you have been shown this
  if (signal.level === 'new' && mark === undefined) return false  // no last look
  return true
}

export function attentionFor({ state, flowers, quests, community, seen = {} } = {}) {
  const all = raw({ state, flowers, quests, community })
  const out = {}
  for (const [scope, signal] of Object.entries(all)) {
    if (shown(scope, signal, seen)) out[scope] = signal
  }

  // The rail's garden tab reports whatever its rooms are saying, so you can
  // see there is something to go for without knowing which room it is in.
  const rooms = GARDEN_SCOPES.map(s => out[s]).filter(Boolean)
  if (rooms.length > 0) {
    const roll = {
      level: rooms.some(r => r.level === 'ready') ? 'ready' : 'new',
      count: rooms.reduce((n, r) => Math.max(n, r.count), 0),
      reasons: rooms.flatMap(r => r.reasons),
      signature: rooms.map(r => r.signature).join('|'),
    }
    // Visiting the garden puts the rail out even though the rooms stay lit —
    // you have been told, and the rooms themselves are the next signpost.
    if (seen[ROUTE_GARDEN] !== roll.signature) out[ROUTE_GARDEN] = roll
  }

  return out
}

// One line for the tooltip, so hovering a lit tab says why it is lit.
export function attentionTitle(signal) {
  if (!signal) return null
  return signal.reasons.join(' · ')
}
