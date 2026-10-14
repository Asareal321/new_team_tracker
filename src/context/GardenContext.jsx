import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../auth/AuthContext'
import {
  SEEDS, seedByKey, STARTING_PLOTS, packetByKey, rollPacket,
  localDay, todayBucket, advanceStreak,
} from '../lib/garden'
import { logReward, pickPlant, takeSeed, logDaily } from '../lib/spheres'
import { newlyUnlocked } from '../lib/achievements'
import { questView } from '../lib/quests'
import { streakReward } from '../lib/streak'
import { isDevUser } from '../lib/devMode'
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
  // Private settings — when you get up and go to bed, and the day those hours
  // start counting. Its own column rather than a corner of `stats`, because
  // `stats` is handed to anyone with a share code. See
  // migration-planning-hours.sql.
  prefs: {},
  streak: { current: 0, best: 0, lastDay: null },
  stats: {},
  achievements: {},
  // Which of today's three quests have been claimed — see lib/quests.js. Which
  // quests today offers isn't stored: it's a function of the date.
  quests: { day: null, claimed: [] },
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
  const [ready, setReady] = useState(false)
  // Columns this database turned out not to have, learned from failed writes.
  // Lets the rest of the garden keep working against a schema that's behind,
  // and lets the features that need those columns say so plainly.
  const [missingColumns, setMissingColumns] = useState([])
  const isDev = isDevUser(user?.email)
  const [devOpen, setDevOpen] = useState(false)
  // Signals the on-screen cloud to replay an animation, and records what each
  // tap rolled so the dev panel can show the randomness instead of hiding it.
  // Every cloud a user pops posts a reward. Keeping the latest state in a ref
  // lets those writes read fresh values without re-creating the callbacks.
  //
  // Assigned on render AND on every write — see save(). Render alone is not
  // enough: setState does not land until React re-renders, so two writes in
  // one tick both read the pre-write state and the second silently undoes the
  // first. That is not hypothetical. Finishing a task from Doing calls
  // rewardTaskDone() and recordDoingCleared() back to back; the second rebuilt
  // `stats` from the stale ref and dropped the cloud the first had just
  // banked, so the toast said a cloud was waiting and the greenhouse was
  // empty.
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
    // Before setState, so anything else writing in this same tick builds on
    // this write rather than on what was last rendered.
    stateRef.current = next
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


  // --- developer tools ----------------------------------------------------

  const devAddCoins = useCallback(
    amount => save({ coins: Math.max(0, (stateRef.current?.coins || 0) + amount) }),
    [save],
  )

  const setQuietMode = useCallback(on => save({ quiet_mode: !!on }), [save])


  // Your hours, taking effect tomorrow.
  //
  // The delay is the whole anti-gaming design: without it, "set bedtime to five
  // minutes from now, write twelve tasks, set it back" is strictly the most
  // efficient way to play, and the habit the feature exists to build is the
  // first casualty. A day's wait costs an honest user nothing — these are
  // supposed to be when you actually get up and go to bed.
  //
  // Clearing both turns the windows off, and that takes effect at once: there
  // is nothing to farm by switching a bonus off.
  const setPlanningHours = useCallback(async ({ wake, bed }) => {
    const cleared = !wake && !bed
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    await save({
      prefs: {
        ...(stateRef.current?.prefs || {}),
        wake: wake || null,
        bed: bed || null,
        effectiveFrom: cleared ? null : localDay(tomorrow),
      },
    })
  }, [save])

  // Onboarding's first packet gives up one seed. It goes into the bag and is
  // pinned, so the first log you write — in setup or straight after — plants
  // that exact flower in that sphere's garden. Nothing grows on a clock any
  // more; a plant is a record of a log.
  // `perkPackets` is what onboarding promised in exchange for something — at
  // present, going public. Granted in the same write that marks onboarding
  // done, so there is no window where the account is set up and the packet is
  // owed. Guarded by `onboarded` on the way in: this runs once per account,
  // and re-running it is the one way it could be farmed.
  const completeOnboarding = useCallback(async (seedKey, { perkPackets = [] } = {}) => {
    if (stateRef.current?.onboarded) return
    const seed = seedByKey(seedKey)
    const discovered = { ...(stateRef.current?.discovered || {}) }
    const bag = { ...(stateRef.current?.seed_inventory || {}) }
    if (seed) {
      discovered[seed.key] = (discovered[seed.key] || 0) + 1
      bag[seed.key] = (bag[seed.key] || 0) + 1
    }

    const packets = { ...(stateRef.current?.packet_inventory || {}) }
    for (const key of perkPackets) packets[key] = (packets[key] || 0) + 1

    await save({
      onboarded: true,
      discovered,
      ...(perkPackets.length ? { packet_inventory: packets } : {}),
      ...(seed ? {
        seed_inventory: bag,
        prefs: { ...(stateRef.current?.prefs || {}), plantNext: seed.key },
      } : {}),
    })
  }, [save])

  // Dev: one of everything in the tray, rather than a rarity gate that no
  // longer exists.
  const devUnlockAll = useCallback(() => save({
    seed_inventory: Object.fromEntries(SEEDS.map(s => [s.key, 3])),
    discovered: Object.fromEntries(SEEDS.map(s => [s.key, 3])),
  }), [save])

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
  // What the next log will plant, and whether it uses a seed up. Pure — see
  // pickPlant — and read from the ref, so a log written straight after a
  // packet is opened draws from the bag that packet just filled.
  const choosePlant = useCallback(id => pickPlant({
    inventory: stateRef.current?.seed_inventory || {},
    pinned: stateRef.current?.prefs?.plantNext || null,
    id,
  }), [])

  // Pin a seed to be planted next (null to go back to drawing at random).
  const setPlantNext = useCallback(key => save({
    prefs: { ...(stateRef.current?.prefs || {}), plantNext: key || null },
  }), [save])

  // A logged piece of progress — the spheres model's one paid action, and the
  // only thing that moves the streak now. It pays coins and a sprout (both
  // capped for the day), spends the seed the log planted, and on the day's
  // first log advances the streak with the same panel finishing a task used
  // to raise. Called after the log row is written, never before, so a failed
  // write can never have paid out or used a seed.
  const rewardLog = useCallback(async ({
    window = null, sphereId = null, goalId = null, seedKey = null, consume = false,
    // Setup's first log: the tour is about to start, and the streak panel
    // would land on top of it. Paid in full, announced with a line instead.
    quiet = false,
  } = {}) => {
    const cur = stateRef.current
    if (!cur) return null
    const daily = todayBucket(cur.daily)
    const day = localDay()
    // The base half against the daily cap, the bonus half (inside a planning
    // hour or a focus block) against that window's own — see logReward.
    const pay = logReward({ daily, window })
    const coins = pay.coins + pay.bonusCoins
    const seeds = pay.seeds + pay.bonusSeeds

    const streakAdvanced = cur.streak?.lastDay !== day
    const nextStreak = advanceStreak(cur.streak, day)
    const streakPay = streakAdvanced ? streakReward(nextStreak.current) : null
    const packets = { ...(cur.packet_inventory || {}) }
    if (streakPay?.packetKey) packets[streakPay.packetKey] = (packets[streakPay.packetKey] || 0) + 1

    const totalCoins = (cur.coins || 0) + coins + (streakPay?.coins || 0)
    await commit({
      coins: totalCoins,
      ...(seeds > 0 ? { seeds: (cur.seeds || 0) + seeds } : {}),
      ...(consume && seedKey ? { seed_inventory: takeSeed(cur.seed_inventory, seedKey) } : {}),
      ...(streakPay?.packetKey ? { packet_inventory: packets } : {}),
      daily: logDaily(daily, {
        sphereId, goalId, coins: pay.coins, seeds: pay.seeds,
        window, bonusCoins: pay.bonusCoins, bonusSeeds: pay.bonusSeeds,
      }),
      streak: nextStreak,
      stats: bumpStats({ progressLogs: 1 }),
    })

    const parts = [seeds > 0 && `+${seeds} 🌱`, coins > 0 && `+${coins} 🪙`].filter(Boolean)
    const doubled = pay.bonusCoins > 0 || pay.bonusSeeds > 0
    const say = () => { if (parts.length) notify(`${parts.join(' ')}${doubled ? ' · doubled' : ''}`) }

    // Quiet mode keeps the reward and the streak, and skips the panel that
    // takes over the screen to announce them — a line in the corner instead.
    if (streakPay && (cur.quiet_mode || quiet)) {
      notify(`🔥 ${nextStreak.current}-day streak${streakPay.coins ? ` · +${streakPay.coins} 🪙` : ''}`)
      say()
    } else if (streakPay) {
      setStreakCue({
        ...streakPay,
        prevStreak: Math.max(0, nextStreak.current - 1),
        totalCoins,
        release: say,
      })
    } else {
      say()
    }
    return { coins, seeds, streak: streakAdvanced ? nextStreak.current : null }
  }, [commit, bumpStats, notify])

  // Setting a goal is a quest counter and nothing else — no payout, since a
  // goal written down is a promise, not progress.
  const recordGoalSet = useCallback(
    () => commit({ daily: bumpDaily({ goals: 1 }) }),
    [commit, bumpDaily],
  )

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
        ? `Not enough sprouts — log progress ${packet.cost - balance} more time${packet.cost - balance === 1 ? '' : 's'}.`
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

  const value = {
    state, flowers, ready, seeds: SEEDS,
    quests: questView(state, todayBucket(state?.daily)),
    claimQuest, missingColumns,
    // Re-read everything. Needed when a SECURITY DEFINER function has changed
    // the garden behind the client's back — listing a flower on the market
    // deletes the bed server-side, and nothing here would otherwise know.
    reload: load,
    devResetOnboarding, devResetQuests, devCompleteQuests, devShowStreak,
    rewardLog, choosePlant, setPlantNext, recordGoalSet, notify, setQuietMode, setPlanningHours, completeOnboarding, buyPacket, openPacket,
    isDev, devOpen, openDevPanel: () => setDevOpen(true),
  }

  return (
    <GardenContext.Provider value={value}>
      {children}
      <RewardToasts notices={notices} />
      {/* Never over the top of setup. Belt and braces alongside the seed no
          longer advancing the streak: anything that raises a cue while the
          account is still being made would land on the setup sheet. */}
      {streakCue && state?.onboarded && (
        <StreakPanel
          streak={streakCue.streak}
          prevStreak={streakCue.prevStreak}
          coins={streakCue.coins}
          totalCoins={streakCue.totalCoins}
          packet={streakCue.packet}
          onDismiss={() => { setStreakCue(null); streakCue.release?.() }}
        />
      )}
      {isDev && devOpen && (
        <DevPanel
          state={state}
          onClose={() => setDevOpen(false)}
          onAddCoins={devAddCoins}
          onUnlockAll={devUnlockAll}
          onReset={devResetGarden}
          onResetOnboarding={devResetOnboarding}
          onResetQuests={devResetQuests}
          onCompleteQuests={devCompleteQuests}
          onShowStreak={devShowStreak}
        />
      )}
    </GardenContext.Provider>
  )
}
