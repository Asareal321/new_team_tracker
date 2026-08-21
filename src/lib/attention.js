// What the nav should be pointing at.
//
// The app has several places where something can quietly become worth doing —
// a flower finishes, a quest completes, someone asks to be your friend, a
// packet comes into reach. None of them announce themselves, so you only find
// out by going and looking, which is the opposite of how it should work.
//
// This turns the state you already have into a per-route signal. It is a pure
// function on purpose: what counts as "worth a glow" is a judgement, and a
// judgement should be testable without a browser.
//
// Two levels, and the difference matters:
//
//   • `ready`  — something is finished and waiting for you. Loud: it pulses.
//   • `new`    — something appeared that you haven't seen. Quiet: a dot.
//
// A signal clears by being visited, never by a timer. `seen` is what the nav
// has already shown you; see lib/seenState.js.

import { remainingSeconds, PACKETS, seedByKey } from './garden.js'

export const ROUTE_BOARD = '/'
export const ROUTE_COMMUNITY = '/community'
export const ROUTE_GARDEN = '/garden'

// The best packet the purse can currently reach, as an index into PACKETS.
// Seed-priced packets are always affordable and so never count as news.
export function affordablePacketTier(state) {
  const coins = state?.coins ?? 0
  let best = -1
  PACKETS.forEach((p, i) => {
    if (p.currency === 'coins' && coins >= p.cost) best = Math.max(best, i)
  })
  return best
}

function garden(state, quests, seen) {
  const reasons = []
  let level = null

  // A finished flower is the loudest thing in the app: it is done, it is
  // yours, and nothing else happens until you go and take it.
  if (state?.growing_seed && remainingSeconds(state) === 0) {
    const seed = seedByKey(state.growing_seed)
    reasons.push(`Your ${seed ? seed.name.toLowerCase() : 'flower'} is ready`)
    level = 'ready'
  }

  // Overflow is a decision you have been handed and haven't made.
  if ((state?.overflow_seconds ?? 0) > 0) {
    reasons.push('Banked time is waiting for a seed')
    level = 'ready'
  }

  const claimable = (quests || []).filter(q => q.claimable).length
  if (claimable > 0) {
    reasons.push(claimable === 1 ? 'A quest is finished' : `${claimable} quests are finished`)
    level = 'ready'
  }

  // Newly in reach, not merely affordable — otherwise this glows forever once
  // you are rich.
  const tier = affordablePacketTier(state)
  if (tier > (seen?.packetTier ?? -1)) {
    const packet = PACKETS[tier]
    if (packet) {
      reasons.push(`You can afford the ${packet.name.toLowerCase()}`)
      if (!level) level = 'new'
    }
  }

  return level ? { level, count: claimable, reasons } : null
}

function community(data, seen) {
  const reasons = []
  let level = null

  const incoming = data?.incoming ?? 0
  if (incoming > 0) {
    reasons.push(incoming === 1 ? 'A friend request' : `${incoming} friend requests`)
    level = 'ready'
  }

  // Listings by other people only. Your own going up is not news to you.
  const listings = data?.othersListings ?? 0
  if (listings > (seen?.marketCount ?? 0)) {
    const n = listings - (seen?.marketCount ?? 0)
    reasons.push(n === 1 ? 'Something new on the market' : `${n} new on the market`)
    if (!level) level = 'new'
  }

  return level ? { level, count: incoming, reasons } : null
}

// `seen` is keyed by route. Anything absent has never been seen.
export function attentionFor({ state, quests, community: communityData, seen = {} } = {}) {
  const out = {}
  const g = garden(state, quests, seen[ROUTE_GARDEN])
  if (g) out[ROUTE_GARDEN] = g
  const c = community(communityData, seen[ROUTE_COMMUNITY])
  if (c) out[ROUTE_COMMUNITY] = c
  return out
}

// What to record when a route is visited, so the same news isn't news twice.
export function seenAfterVisit(route, { state, community: communityData } = {}) {
  if (route === ROUTE_GARDEN) return { packetTier: affordablePacketTier(state) }
  if (route === ROUTE_COMMUNITY) return { marketCount: communityData?.othersListings ?? 0 }
  return {}
}

// One line for the tooltip, so hovering a glowing tab says why it glows.
export function attentionTitle(signal) {
  if (!signal) return null
  return signal.reasons.join(' · ')
}
