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
export function cloudStatsPatch(outcome) {
  return outcome.banks > 0 ? { pendingClouds: outcome.banks } : {}
}

export function pendingClouds(state) {
  return Math.max(0, state?.stats?.pendingClouds || 0)
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
