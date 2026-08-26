// What finishing a task does about clouds.
//
// This used to be three conditions spread through rewardTaskDone, which is a
// React callback and so effectively untestable. It is the piece that decides
// whether you get anything at all for finishing a task, and it went wrong
// quietly — a banked cloud that never banks looks exactly like a cloud that
// banked and failed to light the nav.
//
// A cloud is banked rather than shown. One cloud taking the middle of the
// screen is right; six of them in a row is an interruption you have to fight
// through, so they wait in the greenhouse until you ask for them.

import { DAILY_CAPS, CLOUD_EXPECTED_COINS } from './garden.js'

// `daily` is today's bucket (see todayBucket) — a stale one reads as zero, so
// the cap starts again on its own each day.
export function cloudOutcome({ daily, quiet = false, cap = DAILY_CAPS.clouds } = {}) {
  const earned = daily?.clouds ?? 0
  const underCap = earned < cap
  if (!underCap) return { kind: 'capped', banks: 0, coins: 0 }
  // Quiet mode trades the interruption for its cash value. It has to pay
  // something: dropping the cloud silently would mean finishing a task in
  // quiet mode was worth nothing at all.
  if (quiet) return { kind: 'quiet', banks: 0, coins: CLOUD_EXPECTED_COINS }
  return { kind: 'banked', banks: 1, coins: 0 }
}

// The stats patch for a completion. Separate from the outcome so the caller
// can merge it with everything else one completion writes.
// `startTier` is where the banked cloud should appear when it is let in. A
// cloud earned during a focus hour starts higher, and banking used to be a
// bare count, which threw that away between earning it and popping it.
export function cloudStatsPatch(outcome, { startTier = 1 } = {}) {
  if (outcome.banks <= 0) return {}
  return {
    pendingClouds: outcome.banks,
    pendingTiers: Array.from({ length: outcome.banks }, () => startTier),
  }
}

export function pendingClouds(state) {
  return Math.max(0, state?.stats?.pendingClouds || 0)
}

// The tier each waiting cloud should start at. Older accounts banked a count
// and no tiers, so a short list is padded with ordinary Commons rather than
// treated as a bug — nobody should lose a banked cloud to this changing.
export function pendingTiers(state) {
  const n = pendingClouds(state)
  const recorded = state?.stats?.pendingTiers
  const list = Array.isArray(recorded) ? recorded.slice(0, n) : []
  while (list.length < n) list.push(1)
  return list.map(t => (Number.isFinite(t) && t >= 1 ? t : 1))
}

// What to say once it has happened. The bank is silent by nature — nothing
// appears on screen — so this is the only thing telling you it worked.
export function cloudNotice(outcome, waiting) {
  if (outcome.kind === 'capped') {
    return { text: `☁️ That's all ${DAILY_CAPS.clouds} clouds for today — back tomorrow`, tone: 'capped' }
  }
  if (outcome.kind === 'quiet') return { text: `+${outcome.coins} 🪙 (quiet mode)`, tone: undefined }
  return {
    text: waiting > 1
      ? `☁️ ${waiting} clouds waiting in the greenhouse`
      : '☁️ A cloud is waiting in the greenhouse',
    tone: undefined,
  }
}

// What a popped cloud is worth.
//
// This exists because the two cases were written separately and drifted. A
// cloud that overshot a nearly-finished flower banked the excess as
// `overflow_seconds`, to be spent on whatever you planted next. A cloud popped
// with an empty greenhouse paid a few coins and threw the time away — and an
// Epic is five hours, so "a few coins" was a bad trade nobody agreed to.
//
// They are the same situation: an empty greenhouse is a flower with no time
// left on it. One formula, so they cannot disagree again. Nothing a cloud is
// worth is ever discarded; the only question is whether it lands on the flower
// in front of you or waits for the next one.
export function cloudPayout({ shave = 0, growing = false, left = 0 } = {}) {
  const room = growing ? Math.max(0, left) : 0
  const applied = Math.min(Math.max(0, shave), room)
  return { applied, banked: Math.max(0, shave) - applied }
}
