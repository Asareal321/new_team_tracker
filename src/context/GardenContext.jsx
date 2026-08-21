import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../auth/AuthContext'
import {
  SEEDS, seedByKey, cloudShaveSeconds, cloudIdleCoins, remainingSeconds,
  nextExpansion, STARTING_PLOTS, packetByKey, rollPacket,
  ADD_TASK_REWARD, DAILY_CAPS, CLOUD_EXPECTED_COINS,
  localDay, todayBucket, advanceStreak,
} from '../lib/garden'
import { newlyUnlocked } from '../lib/achievements'
import { questView } from '../lib/quests'
import { streakReward } from '../lib/streak'
import { isDevUser } from '../lib/devMode'
import CloudLayer from '../components/CloudLayer'
import { cloudOutcome, cloudStatsPatch, cloudNotice, pendingClouds } from '../lib/clouds'
import DevPanel from '../components/DevPanel'
import RewardToasts from '../components/RewardToasts'
import StreakPanel from '../components/StreakPanel'

export const GardenContext = createContext(null)

export const useGarden = () => useContext(GardenContext)

// PostgREST reports an unknown column as PGRST204, with the name quoted in the
// message: "Could not find the 'quests' column of 'garden_state' in the schema
// cache". The code is checked as well as the text so a future rewording of the
// message downgrades this to a plain error rather than a wrong guess.
function missingColumnFrom(error) {
  if (!error) return null
  const m = /Could not find the '([^']+)' column/.exec(error.message || '')
  if (!m) return null
  if (error.code && error.code !== 'PGRST204') return null
  return m[1]
}

// Which migration adds each column, so the message can name the file to run
// rather than leaving the user to guess.
const COLUMN_MIGRATIONS = {
  quests: 'migration-garden-quests.sql',
  share_code: 'migration-garden-share.sql',
  daily: 'migration-garden-progress.sql',
  streak: 'migration-garden-progress.sql',
  stats: 'migration-garden-progress.sql',
  achievements: 'migration-garden-progress.sql',
}

export class MissingColumnError extends Error {
  constructor(column) {
    const file = COLUMN_MIGRATIONS[column]
    super(
      `The database is missing its '${column}' column`
      + (file ? `. Run ${file} in the Supabase SQL editor.` : '.')
    )
    this.name = 'MissingColumnError'
    this.column = column
    this.migration = file || null
  }
}

// An upper bound on the retry loop in `save`. There are only a handful of
// columns a migration can add, and a loop that can't terminate is worse than a
// write that gives up.
const MAX_MISSING_COLUMNS = 8

const DEFAULT_STATE = {
  coins: 0,
  seeds: 0,
  quiet_mode: false,
  onboarded: false,
  seed_inventory: {},
  packet_inventory: {},
  // Every species ever obtained, and how many times — the herbarium's record.
  // Deliberately not derived from what you currently hold: selling a flower
  // shouldn't un-discover it.
  discovered: {},
  plot_count: STARTING_PLOTS,
  unlocked_rarity: 1,
  growing_seed: null,
  growing_started_at: null,
  growing_grow_seconds: null,
  shaved_seconds: 0,
  // Shave time a cloud produced beyond what the flower it hit still needed.
  // Held until the user picks the seed that should receive it.
  overflow_seconds: 0,
  // Progress records — see migration-garden-progress.sql.
  daily: { day: null, seeds: 0, coins: 0, clouds: 0 },
  streak: { current: 0, best: 0, lastDay: null },
  stats: {},
  achievements: {},
  // Which of today's three quests have been claimed — see lib/quests.js. Which
  // quests today offers isn't stored: it's a function of the date.
  quests: { day: null, claimed: [] },
}

// A burst cloud's mark on the lifetime record. `bestCloudTier` is the highest
// tier ever reached, which is what the storm-chaser achievements read — a
// running count would let a hundred Commons stand in for one Legendary.
function cloudStats(state, tier) {
  const cur = state?.stats || {}
  return {
    ...cur,
    cloudsPopped: (cur.cloudsPopped || 0) + 1,
    bestCloudTier: Math.max(cur.bestCloudTier || 0, tier),
  }
}

// Where a flower waits mid-swap. Off-grid and negative, so no plot renders it
// and it can't collide with a real index.
const PARKED_PLOT = -1

// A swap that dies between its writes — tab closed, connection dropped — leaves
// a flower parked off-grid, where nothing would ever show it again. Every load
// puts strays back in the first free plot, so a flower can't be lost to a
// half-finished rearrange.
async function rescueParked(rows) {
  const parked = rows.filter(f => f.plot_index < 0)
  if (!parked.length) return rows
  const taken = new Set(rows.filter(f => f.plot_index >= 0).map(f => f.plot_index))
  const fixed = []
  for (const flower of parked) {
    let plot = 0
    while (taken.has(plot)) plot += 1
    taken.add(plot)
    const { error } = await supabase.from('garden_flowers').update({ plot_index: plot }).eq('id', flower.id)
    if (error) {
      console.error('[trakkit] could not rescue a parked flower', error.message)
      continue
    }
    fixed.push({ ...flower, plot_index: plot })
  }
  return rows.filter(f => f.plot_index >= 0).concat(fixed)
}

// Gardens that predate the herbarium have no `discovered` record, and an empty
// one would tell a long-time player they've found nothing. What they still hold
// is a lower bound on what they've found, so it seeds the record: the tray, the
// growing slot, and every planted bed. Returns null when there's nothing to add,
// so a normal load doesn't write.
function backfillDiscovered(row, flowerRows) {
  const known = { ...(row?.discovered || {}) }
  const floor = {}
  const bump = key => { if (key) floor[key] = (floor[key] || 0) + 1 }
  for (const [key, n] of Object.entries(row?.seed_inventory || {})) floor[key] = (floor[key] || 0) + n
  bump(row?.growing_seed)
  for (const f of flowerRows || []) bump(f.seed_key)

  let changed = false
  for (const [key, n] of Object.entries(floor)) {
    if ((known[key] || 0) < n) { known[key] = n; changed = true }
  }
  return changed ? known : null
}

export function GardenProvider({ children }) {
  const { user } = useAuth()
  const [state, setState] = useState(null)
  const [flowers, setFlowers] = useState([])
  const [clouds, setClouds] = useState([])
  const [ready, setReady] = useState(false)
  // Columns this database turned out not to have, learned from failed writes.
  // Lets the rest of the garden keep working against a schema that's behind,
  // and lets the features that need those columns say so plainly.
  const [missingColumns, setMissingColumns] = useState([])
  const isDev = isDevUser(user?.email)
  const [devOpen, setDevOpen] = useState(false)
  // Signals the on-screen cloud to replay an animation, and records what each
  // tap rolled so the dev panel can show the randomness instead of hiding it.
  const [devSignal, setDevSignal] = useState({ n: 0, type: null })
  const [devLog, setDevLog] = useState([])
  // Every cloud a user pops posts a reward. Keeping the latest state in a ref
  // lets those writes read fresh values without re-creating the callbacks.
  const stateRef = useRef(null)
  stateRef.current = state

  const load = useCallback(async () => {
    if (!user) return
    const [{ data: rows }, { data: flowerRows }] = await Promise.all([
      supabase.from('garden_state').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('garden_flowers').select('*').eq('user_id', user.id),
    ])
    const base = rows || { user_id: user.id, ...DEFAULT_STATE }

    // A select('*') against a table that's behind on migrations simply returns
    // a row without those keys, so the gap can be spotted on load rather than
    // waiting for a write to fail. That's what lets the quest strip explain
    // itself before you press Claim instead of after.
    if (rows) {
      const absent = Object.keys(DEFAULT_STATE).filter(k => !(k in rows))
      if (absent.length) {
        setMissingColumns(prev => [...new Set([...prev, ...absent])])
        console.warn(
          `[trakkit] garden_state is missing: ${absent.join(', ')}. `
          + 'Run the outstanding migration-garden-*.sql in the Supabase SQL editor.'
        )
      }
    }

    const backfilled = backfillDiscovered(base, flowerRows)
    setState(backfilled ? { ...base, discovered: backfilled } : base)
    setFlowers(await rescueParked(flowerRows || []))
    setReady(true)
    // Persisted after the render so a first look at the herbarium isn't waiting
    // on a write. A failure here only costs the backfill, which retries next load.
    if (backfilled && rows) {
      const { error } = await supabase.from('garden_state')
        .update({ discovered: backfilled }).eq('user_id', user.id)
      if (error) console.error('[trakkit] herbarium backfill failed', error.message)
    }
  }, [user])

  useEffect(() => { load() }, [load])

  // Upsert so the first interaction creates the row lazily — no signup hook
  // needed, and existing accounts get a garden the moment they open the tab.
  const save = useCallback(async patch => {
    if (!user) return
    const next = { ...(stateRef.current || DEFAULT_STATE), ...patch, user_id: user.id }
    setState(next)
    const { user_id, ...fields } = next

    // Drop columns this database doesn't have yet, but only ones this write
    // isn't actually changing.
    //
    // The upsert sends the whole row, so a single un-run migration used to
    // fail *every* garden write — finishing a task, earning coins, the streak,
    // all of it — because the row happened to carry one unknown field. Those
    // writes weren't touching the new column; it was just along for the ride.
    //
    // A write that really does change a missing column is a different matter
    // and still fails. Dropping it would be worse than the error: claiming a
    // quest would pay the coins (that column exists) without recording the
    // claim, so the same quest could be claimed again after a reload.
    const payload = { ...fields }
    for (const col of missingColumns) {
      if (!(col in patch)) delete payload[col]
    }

    // Each attempt can only learn about one missing column — PostgREST reports
    // the first it hits — so this loops rather than trying once.
    for (let attempt = 0; attempt <= MAX_MISSING_COLUMNS; attempt++) {
      const { error } = await supabase
        .from('garden_state')
        .upsert({ user_id, ...payload, updated_at: new Date().toISOString() })
      if (!error) return

      const column = missingColumnFrom(error)
      if (column && !(column in patch) && column in payload) {
        delete payload[column]
        setMissingColumns(prev => (prev.includes(column) ? prev : [...prev, column]))
        console.warn(
          `[trakkit] garden_state has no '${column}' column — skipping it. `
          + 'Run the matching migration-garden-*.sql in the Supabase SQL editor.'
        )
        continue
      }

      // `setState` above was optimistic, so a write that isn't going to happen
      // has to be pulled back to what the database actually holds — otherwise
      // a failed claim leaves the coins on screen until the next reload.
      console.error('[trakkit] garden save failed', error.message)
      load()
      throw column ? new MissingColumnError(column) : error
    }
  }, [user, load, missingColumns])

  // --- progress: caps, streak, stats, achievements -------------------------

  // Short-lived messages for rewards that happen away from the garden tab —
  // adding a task, clearing Doing, unlocking an achievement. Without these the
  // board would silently change numbers on another page.
  const [notices, setNotices] = useState([])
  // The streak celebration waiting to be shown, or null.
  const [streakCue, setStreakCue] = useState(null)
  const notify = useCallback((text, kind = 'reward') => {
    const id = crypto.randomUUID()
    setNotices(prev => [...prev, { id, text, kind }])
    setTimeout(() => setNotices(prev => prev.filter(n => n.id !== id)), 4200)
  }, [])

  // Achievements read the number of planted beds, which lives outside `state`.
  const flowersRef = useRef([])
  flowersRef.current = flowers

  // Every write that can move progress goes through here rather than `save`, so
  // there is exactly one place where achievements are checked. They're derived
  // (see lib/achievements.js), so this only records the moment each was first
  // seen earned — and announces it.
  const commit = useCallback(async patch => {
    const merged = { ...(stateRef.current || DEFAULT_STATE), ...patch }
    const fresh = newlyUnlocked(merged, flowersRef.current.length)
    if (fresh.length) {
      const now = new Date().toISOString()
      patch = {
        ...patch,
        achievements: {
          ...(merged.achievements || {}),
          ...Object.fromEntries(fresh.map(a => [a.key, now])),
        },
      }
    }
    await save(patch)
    for (const a of fresh) notify(`${a.icon} ${a.name} — ${a.blurb}`, 'achievement')
  }, [save, notify])

  // The day's bucket, with `patch` added to it. Same shape as bumpStats, but
  // day-aware: a bucket left over from yesterday reads as zero, so the first
  // write of a new day starts the counts again on its own.
  //
  // Three of these keys (seeds, coins, clouds) are what the daily caps meter.
  // The rest are what quests read. Both are "how much of this happened today",
  // which is why they share one bucket.
  const bumpDaily = useCallback((patch = {}) => {
    const cur = todayBucket(stateRef.current?.daily)
    const next = { ...cur }
    for (const [k, v] of Object.entries(patch)) next[k] = (next[k] || 0) + v
    return next
  }, [])

  const bumpStats = useCallback((patch = {}) => {
    const cur = stateRef.current?.stats || {}
    const next = { ...cur }
    for (const [k, v] of Object.entries(patch)) next[k] = (next[k] || 0) + v
    return next
  }, [])

  // --- quests --------------------------------------------------------------

  // Claiming is deliberate rather than automatic: the payout is the moment
  // Trak hands you something, and an amount that lands silently while you're
  // on another page isn't a reward, it's an accounting entry.
  //
  // Nothing here trusts the caller — the quest has to be one of today's, and
  // it has to actually be finished and unclaimed, so a stale button can't pay
  // twice.
  const claimQuest = useCallback(async key => {
    const cur = stateRef.current
    if (!cur) return null
    const day = localDay()
    const quest = questView(cur, todayBucket(cur.daily)).find(q => q.key === key)
    if (!quest) throw new Error('That quest isn’t one of today’s')
    if (!quest.done) throw new Error('That quest isn’t finished yet')
    if (quest.claimed) throw new Error('Already claimed')

    const record = cur.quests?.day === day ? cur.quests : { day, claimed: [] }
    await commit({
      coins: (cur.coins || 0) + quest.reward.coins,
      ...(quest.reward.seeds ? { seeds: (cur.seeds || 0) + quest.reward.seeds } : {}),
      quests: { day, claimed: [...(record.claimed || []), key] },
      stats: bumpStats({ questsDone: 1 }),
    })
    notify(
      `${quest.icon} ${quest.name} — +${quest.reward.coins} 🪙`
      + (quest.reward.seeds ? ` +${quest.reward.seeds} 🌱` : ''),
      'achievement',
    )
    return quest.reward
  }, [commit, bumpStats, notify])

  // --- clouds -------------------------------------------------------------

  // Called once the task-completion modal is dismissed. The cloud holds the
  // centre of the screen until it's tapped out or collected — no timer.
  // `startTier` and `preview` are for the dev panel: a preview cloud looks and
  // behaves identically but banks nothing, so testing can't inflate the garden.
  // Quiet mode is handled by rewardTaskDone, which pays the cloud's cash value
  // instead of showing one — so by the time anything gets here, a cloud is
  // wanted. Dev previews always show, or the panel looks broken to whoever set it.
  const spawnCloud = useCallback(({ startTier = 1, preview = false } = {}) => {
    if (!user) return
    setClouds(prev => [...prev, { id: crypto.randomUUID(), startTier, preview }])
  }, [user])

  const dismissCloud = useCallback(id => {
    setClouds(prev => prev.filter(c => c.id !== id))
  }, [])

  // Let the banked ones in. The count is zeroed as they are released rather
  // than as they are popped: they are on screen now, and a reload that lost
  // both the bank and the clouds would be worse than one that lost neither.
  const releaseBankedClouds = useCallback(async () => {
    const waiting = pendingClouds(stateRef.current)
    if (waiting < 1) return 0
    setClouds(prev => [
      ...prev,
      ...Array.from({ length: waiting }, () => ({
        id: crypto.randomUUID(), startTier: 1, preview: false,
      })),
    ])
    await commit({ stats: { ...(stateRef.current?.stats || {}), pendingClouds: 0 } })
    return waiting
  }, [commit])

  // A popped cloud shaves time off whatever is growing, scaled by the rarity
  // tier it reached. With nothing planted the effort still counts — it
  // converts to coins instead.
  const popCloud = useCallback(async (id, tier) => {
    const cloud = clouds.find(c => c.id === id)
    dismissCloud(id)
    const current = stateRef.current
    if (!current) return null
    const shave = cloudShaveSeconds(tier)
    // Preview clouds report what they *would* have paid, but write nothing.
    if (cloud?.preview) {
      if (!current.growing_seed) return { type: 'coins', amount: cloudIdleCoins(tier), preview: true }
      const left = remainingSeconds(current) ?? 0
      return { type: 'shave', amount: Math.min(shave, left), overflow: Math.max(0, shave - left), preview: true }
    }
    if (current.growing_seed) {
      // The good tiers now shave more than some species take to grow, so a
      // cloud can finish the flower outright. The excess isn't discarded and
      // isn't silently rolled into the next plant either — it's banked, and the
      // user chooses which seed receives it when they plant next.
      const left = remainingSeconds(current) ?? 0
      const applied = Math.min(shave, left)
      const over = shave - applied
      await commit({
        shaved_seconds: (current.shaved_seconds || 0) + applied,
        overflow_seconds: (current.overflow_seconds || 0) + over,
        stats: cloudStats(current, tier),
        daily: bumpDaily({ popped: 1 }),
      })
      return { type: 'shave', amount: applied, overflow: over }
    }
    const coins = cloudIdleCoins(tier)
    await commit({
      coins: (current.coins || 0) + coins,
      stats: cloudStats(current, tier),
      daily: bumpDaily({ popped: 1 }),
    })
    return { type: 'coins', amount: coins }
  }, [commit, dismissCloud, clouds, bumpDaily])

  // --- developer tools ----------------------------------------------------

  const devReplay = useCallback(type => setDevSignal(sig => ({ n: sig.n + 1, type })), [])

  const pushDevLog = useCallback(entry => {
    setDevLog(prev => [{ ...entry, at: Date.now() }, ...prev].slice(0, 12))
  }, [])

  const devAddCoins = useCallback(
    amount => save({ coins: Math.max(0, (stateRef.current?.coins || 0) + amount) }),
    [save],
  )

  const setQuietMode = useCallback(on => save({ quiet_mode: !!on }), [save])

  // Onboarding plants the chosen seed directly — it deliberately bypasses the
  // seed-tray cost, because the whole point is that you own a plant before you
  // have finished (or even written) a single task.
  const completeOnboarding = useCallback(async seedKey => {
    const seed = seedByKey(seedKey)
    const discovered = { ...(stateRef.current?.discovered || {}) }
    if (seed) discovered[seed.key] = (discovered[seed.key] || 0) + 1
    await save({
      onboarded: true,
      discovered,
      ...(seed ? {
        growing_seed: seed.key,
        growing_started_at: new Date().toISOString(),
        growing_grow_seconds: seed.growSeconds,
        shaved_seconds: 0,
      } : {}),
    })
  }, [save])

  // Dev: one of everything in the tray, rather than a rarity gate that no
  // longer exists.
  const devUnlockAll = useCallback(() => save({
    seed_inventory: Object.fromEntries(SEEDS.map(s => [s.key, 3])),
    discovered: Object.fromEntries(SEEDS.map(s => [s.key, 3])),
  }), [save])

  // Shave the whole remaining grow time so the harvest UI can be reached at
  // once, instead of waiting out a 24-hour Legendary.
  const devFinishGrowth = useCallback(() => {
    const current = stateRef.current
    if (!current?.growing_seed) throw new Error('Nothing is growing')
    return save({ shaved_seconds: current.growing_grow_seconds ?? 0 })
  }, [save])

  // Puts the account back to first-run so the real onboarding — the one that
  // plants a seed, creates a project and writes a task — can be walked through
  // again rather than only previewed. The growing slot is cleared with it,
  // because onboarding plants into that slot and would otherwise refuse.
  const devResetOnboarding = useCallback(() => save({
    onboarded: false,
    growing_seed: null,
    growing_started_at: null,
    growing_grow_seconds: null,
    shaved_seconds: 0,
  }), [save])

  // Backdates today's quest record so the three quests can be finished and
  // claimed again in one sitting.
  const devResetQuests = useCallback(() => save({ quests: { day: null, claimed: [] } }), [save])

  // Fills today's bucket past every quest goal, so the claim path can be
  // exercised without doing a day's work first.
  const devCompleteQuests = useCallback(() => save({
    daily: { ...todayBucket(stateRef.current?.daily), done: 10, added: 10, clears: 3, popped: 10, packets: 3, grown: 2, planted: 3 },
    quests: { day: localDay(), claimed: [] },
  }), [save])

  // Preview only — no coins, no packet, nothing written. The panel fires once
  // a day at most, so without this it can't be looked at on demand.
  const devShowStreak = useCallback((days = 12) => {
    const reward = streakReward(days)
    setStreakCue({
      ...reward,
      prevStreak: Math.max(0, days - 1),
      totalCoins: (stateRef.current?.coins || 0) + reward.coins,
      release: null,
    })
  }, [])

  const devResetGarden = useCallback(async () => {
    if (!user) return
    const { error } = await supabase.from('garden_flowers').delete().eq('user_id', user.id)
    if (error) throw error
    setFlowers([])
    await save({ ...DEFAULT_STATE })
  }, [user, save])

  // Ctrl/Cmd + Shift + D toggles the panel from anywhere in the app.
  useEffect(() => {
    if (!isDev) return
    function onKey(e) {
      if (e.key?.toLowerCase() === 'd' && e.shiftKey && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        setDevOpen(open => !open)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isDev])

  // --- garden actions -----------------------------------------------------

  // --- board rewards ------------------------------------------------------
  //
  // Three rewards at three points in a task's life, each capped per day. The
  // caps are what make the cheap actions safe to reward at all: writing a task
  // down takes a second, so uncapped it would out-earn doing the work.

  // Writing something down is worth a seed — the cheapest reward, for the
  // cheapest action.
  const rewardTaskAdded = useCallback(async () => {
    const cur = stateRef.current
    if (!cur) return null
    const daily = todayBucket(cur.daily)
    // Two currencies, two caps, metered independently — they run out at
    // different rates, and hitting the seed cap shouldn't quietly stop the
    // coins as well.
    const seedGain = Math.min(ADD_TASK_REWARD.seeds, Math.max(0, DAILY_CAPS.seeds - daily.seeds))
    const coinGain = Math.min(ADD_TASK_REWARD.coins, Math.max(0, DAILY_CAPS.coins - daily.coins))
    await commit({
      ...(seedGain > 0 ? { seeds: (cur.seeds || 0) + seedGain } : {}),
      ...(coinGain > 0 ? { coins: (cur.coins || 0) + coinGain } : {}),
      daily: {
        ...daily,
        seeds: daily.seeds + seedGain,
        coins: daily.coins + coinGain,
        added: (daily.added || 0) + 1,
      },
      stats: bumpStats({ tasksAdded: 1 }),
    })
    // One line for both, so writing a task down doesn't stack two toasts.
    const parts = [seedGain > 0 && `+${seedGain} 🌱`, coinGain > 0 && `+${coinGain} 🪙`].filter(Boolean)
    if (parts.length) notify(parts.join(' '))
    return { gain: seedGain, coins: coinGain, capped: seedGain === 0 && coinGain === 0 }
  }, [commit, bumpStats, notify])

  // Emptying the Doing column is recorded but no longer paid.
  //
  // It used to bank 60 coins. That rewarded a *position* rather than work: the
  // same finished task was worth wildly different amounts depending on what
  // happened to be sitting beside it, which is a strange thing to teach. Money
  // now comes from the two ends of a task's life — writing it down, finishing
  // it — and both are the same every time.
  //
  // The count stays because things still ask for it: the "Clear the decks" and
  // "Nothing in flight" quests, and the three Clean slate awards. Dropping the
  // counter would have quietly made those unreachable.
  const recordDoingCleared = useCallback(async () => {
    const cur = stateRef.current
    if (!cur) return null
    const daily = todayBucket(cur.daily)
    await commit({
      daily: { ...daily, clears: (daily.clears || 0) + 1 },
      stats: bumpStats({ doingClears: 1 }),
    })
    return { clears: (cur.stats?.doingClears || 0) + 1 }
  }, [commit, bumpStats])

  // Finishing a task earns a cloud rather than a flat payout, so what it's
  // worth is the cloud's own roll. Past the daily cap the work still counts
  // toward the streak and the stats — only the cloud stops.
  //
  // The cloud is banked, not shown. A cloud takes the middle of the screen
  // until it is tapped out, which is right for one and wrong for a run of
  // six — clearing a backlog turned into six interruptions. So finishing puts
  // one aside, the greenhouse says how many are waiting, and you let them in
  // when you are ready for them.
  const rewardTaskDone = useCallback(async () => {
    const cur = stateRef.current
    if (!cur) return null
    const daily = todayBucket(cur.daily)
    const day = localDay()
    // The streak advances on the day's FIRST finished task, and only then, so
    // this is the one completion in the day that has something extra to say.
    const streakAdvanced = cur.streak?.lastDay !== day
    const underCap = daily.clouds < DAILY_CAPS.clouds
    // Quiet mode trades the interruption for its cash value — it used to just
    // drop the cloud, which now would mean finishing a task paid nothing.
    const quiet = !!cur.quiet_mode
    const paidQuiet = underCap && quiet ? CLOUD_EXPECTED_COINS : 0

    const nextStreak = advanceStreak(cur.streak, day)
    // Paid outside the daily cap, like a quest: once a day, amount fixed by the
    // run's own length. See lib/streak.js.
    const reward = streakAdvanced ? streakReward(nextStreak.current) : null
    const packets = { ...(cur.packet_inventory || {}) }
    if (reward?.packetKey) packets[reward.packetKey] = (packets[reward.packetKey] || 0) + 1

    // Banked, capped, or paid out — decided in lib/clouds.js so it can be
    // tested. Nothing about this appears on screen, so a wrong answer here is
    // silent until you notice the nav never lights.
    const outcome = cloudOutcome({ daily, quiet })
    const banks = outcome.banks > 0

    // pendingClouds is not a statistic. It lives in the stats bag because that
    // bag is jsonb and already saved — a column of its own would mean another
    // migration standing between this and working.
    const nextStats = bumpStats({ tasksDone: 1, ...cloudStatsPatch(outcome) })

    await commit({
      coins: (cur.coins || 0) + paidQuiet + (reward?.coins || 0),
      ...(reward?.packetKey ? { packet_inventory: packets } : {}),
      daily: { ...daily, clouds: daily.clouds + (underCap ? 1 : 0), done: (daily.done || 0) + 1 },
      streak: nextStreak,
      stats: nextStats,
    })

    // Nothing takes the screen now — the cloud is already put by. All that is
    // left is to say so.
    const releaseCloud = () => {
      // Read the count we just wrote, not the ref — a ref updated on render
      // is still one completion behind at this point.
      const notice = cloudNotice(outcome, nextStats.pendingClouds || 0)
      notify(notice.text, notice.tone)
    }

    if (reward) {
      setStreakCue({
        ...reward,
        prevStreak: Math.max(0, nextStreak.current - 1),
        totalCoins: (cur.coins || 0) + paidQuiet + reward.coins,
        release: releaseCloud,
      })
      return { cloud: banks, streak: nextStreak.current }
    }

    releaseCloud()
    if (!underCap) return { cloud: false, capped: true }
    if (quiet) return { cloud: false, quiet: true }
    return { cloud: true }
  }, [commit, bumpStats, notify])

  // Buy a packet and roll it. The roll happens client-side, which is fine for
  // a single-player cosmetic economy — nothing here is competitive and the row
  // is already writable only by its owner.
  const buyPacket = useCallback(async packetKey => {
    const packet = packetByKey(packetKey)
    const current = stateRef.current
    if (!packet || !current) throw new Error('Unknown packet')
    const balance = packet.currency === 'seeds' ? (current.seeds || 0) : (current.coins || 0)
    if (balance < packet.cost) {
      throw new Error(packet.currency === 'seeds'
        ? `Not enough seeds — finish ${packet.cost - balance} more task(s).`
        : 'Not enough coins.')
    }
    // Buying no longer decides what's inside — the packet goes to the shelf
    // sealed, and the roll happens when you tear it open in the greenhouse.
    const packets = { ...(current.packet_inventory || {}) }
    packets[packet.key] = (packets[packet.key] || 0) + 1
    await save({
      packet_inventory: packets,
      ...(packet.currency === 'seeds'
        ? { seeds: current.seeds - packet.cost }
        : { coins: current.coins - packet.cost }),
    })
    return packet
  }, [save])

  // Tear open a packet you already own. The roll happens here, so an unopened
  // packet on the shelf has genuinely not been decided yet.
  const openPacket = useCallback(async packetKey => {
    const packet = packetByKey(packetKey)
    const current = stateRef.current
    if (!packet || !current) throw new Error('Unknown packet')
    const packets = { ...(current.packet_inventory || {}) }
    if (!packets[packet.key]) throw new Error(`No ${packet.name} to open`)
    packets[packet.key] -= 1
    if (packets[packet.key] <= 0) delete packets[packet.key]
    const wonKey = rollPacket(packetKey)
    const inv = { ...(current.seed_inventory || {}) }
    inv[wonKey] = (inv[wonKey] || 0) + 1
    const discovered = { ...(current.discovered || {}) }
    const isNew = !discovered[wonKey]
    discovered[wonKey] = (discovered[wonKey] || 0) + 1
    await commit({
      packet_inventory: packets, seed_inventory: inv, discovered,
      stats: bumpStats({ packetsOpened: 1 }),
      daily: bumpDaily({ packets: 1 }),
    })
    // `isNew` is what the reveal uses to call out a first find.
    return { ...seedByKey(wonKey), isNew }
  }, [save])

  const plantSeed = useCallback(async seedKey => {
    const seed = seedByKey(seedKey)
    if (!seed) throw new Error('Unknown seed')
    if (stateRef.current?.growing_seed) throw new Error('Something is already growing')
    const inv = { ...(stateRef.current?.seed_inventory || {}) }
    if (!inv[seed.key]) throw new Error(`No ${seed.name} seeds — open a packet to find one`)
    inv[seed.key] -= 1
    if (inv[seed.key] <= 0) delete inv[seed.key]
    // Planting is the choice of which flower gets the banked overflow. It's
    // capped at this seed's own grow time, so a huge bank isn't burned on a
    // three-hour Daisy — whatever it can't absorb stays banked for the next one.
    const banked = stateRef.current?.overflow_seconds || 0
    const applied = Math.min(banked, seed.growSeconds)
    await commit({
      seed_inventory: inv,
      daily: bumpDaily({ planted: 1 }),
      growing_seed: seed.key,
      growing_started_at: new Date().toISOString(),
      growing_grow_seconds: seed.growSeconds,
      shaved_seconds: applied,
      overflow_seconds: banked - applied,
    })
    return { seed, applied, remainingOverflow: banked - applied }
  }, [commit, bumpDaily])

  const clearGrowing = useCallback(
    extra => commit({
      growing_seed: null,
      growing_started_at: null,
      growing_grow_seconds: null,
      shaved_seconds: 0,
      ...extra,
    }),
    [commit],
  )

  // Move a finished flower into a plot. Optimistic so the flower lands the
  // instant you pick a plot, then rolls back if the insert is rejected.
  const placeFlower = useCallback(async plotIndex => {
    const seedKey = stateRef.current?.growing_seed
    if (!seedKey) throw new Error('Nothing is ready to plant')
    if (flowers.some(f => f.plot_index === plotIndex)) throw new Error('That plot is taken')
    const row = { id: crypto.randomUUID(), user_id: user.id, seed_key: seedKey, plot_index: plotIndex, created_at: new Date().toISOString() }
    setFlowers(prev => [...prev, row])
    const { error } = await supabase.from('garden_flowers').insert(row)
    if (error) {
      setFlowers(prev => prev.filter(f => f.id !== row.id))
      throw error
    }
    await clearGrowing({ stats: bumpStats({ flowersGrown: 1 }), daily: bumpDaily({ grown: 1 }) })
  }, [flowers, user, clearGrowing])

  // Rearranging the garden. Dropping onto an empty plot moves; dropping onto a
  // planted one swaps the two.
  //
  // The table has `unique (user_id, plot_index)`, and the constraint is not
  // deferrable, so a swap can't be two plain updates — the first would collide
  // with the row it's about to displace. The occupant is parked at PARKED_PLOT
  // (off-grid, so nothing renders it) for the duration. If a later step fails
  // the earlier ones are undone, and `load()` reconciles anything still parked.
  const moveFlower = useCallback(async (flowerId, toPlotIndex) => {
    const moving = flowers.find(f => f.id === flowerId)
    if (!moving || moving.plot_index === toPlotIndex) return
    const occupant = flowers.find(f => f.plot_index === toPlotIndex)
    const from = moving.plot_index
    const snapshot = flowers

    setFlowers(prev => prev.map(f => {
      if (f.id === moving.id) return { ...f, plot_index: toPlotIndex }
      if (occupant && f.id === occupant.id) return { ...f, plot_index: from }
      return f
    }))

    const set = (id, plot_index) =>
      supabase.from('garden_flowers').update({ plot_index }).eq('id', id)

    try {
      if (!occupant) {
        const { error } = await set(moving.id, toPlotIndex)
        if (error) throw error
      } else {
        let { error } = await set(occupant.id, PARKED_PLOT)
        if (error) throw error
        ;({ error } = await set(moving.id, toPlotIndex))
        if (error) {
          await set(occupant.id, toPlotIndex)
          throw error
        }
        ;({ error } = await set(occupant.id, from))
        if (error) {
          await set(moving.id, from)
          await set(occupant.id, toPlotIndex)
          throw error
        }
      }
    } catch (e) {
      setFlowers(snapshot)
      throw e
    }
  }, [flowers])

  // Composting, not selling.
  //
  // A flower used to convert to coins at a fixed rate, which made the shop the
  // only thing flowers were for and set a floor under every price — nobody
  // would ever accept less from a person than the game paid automatically.
  // With a marketplace, what a flower is worth is what someone will give you
  // for it, and that only means anything if the automatic buyer is gone.
  //
  // So the disposal route stays and the payout doesn't: composting clears the
  // pot or the bed and returns nothing. It is for flowers you don't want,
  // which is a real thing to need with a bounded garden.
  const compostGrown = useCallback(async () => {
    const seed = seedByKey(stateRef.current?.growing_seed)
    if (!seed) throw new Error('Nothing is ready')
    await clearGrowing({
      stats: bumpStats({ flowersGrown: 1, composted: 1 }),
      daily: bumpDaily({ grown: 1 }),
    })
    return seed.name
  }, [clearGrowing])

  const compostPlanted = useCallback(async flowerId => {
    const flower = flowers.find(f => f.id === flowerId)
    const seed = seedByKey(flower?.seed_key)
    if (!flower || !seed) return null
    setFlowers(prev => prev.filter(f => f.id !== flowerId))
    const { error } = await supabase.from('garden_flowers').delete().eq('id', flowerId)
    if (error) {
      setFlowers(prev => [...prev, flower])
      throw error
    }
    await save({ stats: bumpStats({ composted: 1 }) })
    return seed.name
  }, [flowers, save, bumpStats])

  const unlockSeed = useCallback(async seedKey => {
    const seed = seedByKey(seedKey)
    const current = stateRef.current
    if (!seed || !current) return
    if (seed.rarity <= current.unlocked_rarity) return
    if (seed.rarity !== current.unlocked_rarity + 1) throw new Error('Unlock the previous rarity first')
    if ((current.coins || 0) < seed.unlockCost) throw new Error('Not enough coins')
    await save({ coins: current.coins - seed.unlockCost, unlocked_rarity: seed.rarity })
  }, [save])

  const expandGarden = useCallback(async () => {
    const current = stateRef.current
    const next = nextExpansion(current?.plot_count ?? STARTING_PLOTS)
    if (!next) throw new Error('Garden is already at max size')
    if ((current?.coins || 0) < next.cost) throw new Error('Not enough coins')
    await save({ coins: current.coins - next.cost, plot_count: next.plotCount })
  }, [save])

  const value = {
    state, flowers, ready, seeds: SEEDS,
    quests: questView(state, todayBucket(state?.daily)),
    claimQuest, missingColumns,
    // Re-read everything. Needed when a SECURITY DEFINER function has changed
    // the garden behind the client's back — listing a flower on the market
    // deletes the bed server-side, and nothing here would otherwise know.
    reload: load,
    devResetOnboarding, devResetQuests, devCompleteQuests, devShowStreak,
    spawnCloud, releaseBankedClouds, rewardTaskAdded, rewardTaskDone, recordDoingCleared, notify, setQuietMode, completeOnboarding, buyPacket, openPacket, plantSeed, placeFlower, moveFlower, compostGrown, compostPlanted, unlockSeed, expandGarden,
    isDev, devOpen, openDevPanel: () => setDevOpen(true),
  }

  return (
    <GardenContext.Provider value={value}>
      {children}
      <RewardToasts notices={notices} />
      {streakCue && (
        <StreakPanel
          streak={streakCue.streak}
          prevStreak={streakCue.prevStreak}
          coins={streakCue.coins}
          totalCoins={streakCue.totalCoins}
          packet={streakCue.packet}
          onDismiss={() => { setStreakCue(null); streakCue.release?.() }}
        />
      )}
      <CloudLayer
        clouds={clouds}
        onPop={popCloud}
        devSignal={isDev ? devSignal : null}
        onRoll={isDev ? pushDevLog : null}
      />
      {isDev && devOpen && (
        <DevPanel
          state={state}
          cloud={clouds[0]}
          log={devLog}
          onClose={() => setDevOpen(false)}
          onSpawn={startTier => spawnCloud({ startTier, preview: true })}
          onReplay={devReplay}
          onAddCoins={devAddCoins}
          onUnlockAll={devUnlockAll}
          onFinishGrowth={devFinishGrowth}
          onReset={devResetGarden}
          onResetOnboarding={devResetOnboarding}
          onResetQuests={devResetQuests}
          onCompleteQuests={devCompleteQuests}
          onShowStreak={devShowStreak}
          onClearLog={() => setDevLog([])}
        />
      )}
    </GardenContext.Provider>
  )
}
