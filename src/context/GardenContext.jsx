import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../auth/AuthContext'
import {
  SEEDS, seedByKey, cloudShaveSeconds, cloudIdleCoins, remainingSeconds,
  nextExpansion, STARTING_PLOTS, TASK_REWARD, packetByKey, rollPacket,
} from '../lib/garden'
import { isDevUser } from '../lib/devMode'
import CloudLayer from '../components/CloudLayer'
import DevPanel from '../components/DevPanel'

export const GardenContext = createContext(null)

export const useGarden = () => useContext(GardenContext)

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
  // Whether the current grow's payoff cinematic has already played. A finished
  // flower waits in the greenhouse until it's kept or sold, so without this it
  // would replay on every visit.
  harvest_celebrated: false,
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
    const { error } = await supabase
      .from('garden_state')
      .upsert({ user_id, ...fields, updated_at: new Date().toISOString() })
    if (error) {
      console.error('[trakkit] garden save failed', error.message)
      load()
      throw error
    }
  }, [user, load])

  // --- clouds -------------------------------------------------------------

  // Called once the task-completion modal is dismissed. The cloud holds the
  // centre of the screen until it's tapped out or collected — no timer.
  // `startTier` and `preview` are for the dev panel: a preview cloud looks and
  // behaves identically but banks nothing, so testing can't inflate the garden.
  const spawnCloud = useCallback(({ startTier = 1, preview = false } = {}) => {
    if (!user) return
    // Quiet mode keeps the rewards but drops the interruption. Dev previews
    // still show, or the panel would appear broken to whoever set it.
    if (stateRef.current?.quiet_mode && !preview) return
    setClouds(prev => [...prev, { id: crypto.randomUUID(), startTier, preview }])
  }, [user])

  const dismissCloud = useCallback(id => {
    setClouds(prev => prev.filter(c => c.id !== id))
  }, [])

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
      await save({
        shaved_seconds: (current.shaved_seconds || 0) + applied,
        overflow_seconds: (current.overflow_seconds || 0) + over,
      })
      return { type: 'shave', amount: applied, overflow: over }
    }
    const coins = cloudIdleCoins(tier)
    await save({ coins: (current.coins || 0) + coins })
    return { type: 'coins', amount: coins }
  }, [save, dismissCloud, clouds])

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
        harvest_celebrated: false,
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

  // Called when a task lands in Done. Seeds are what you spend to plant;
  // coins are what the shop takes. Both come from finishing work.
  const bankTaskReward = useCallback(() => save({
    seeds: (stateRef.current?.seeds || 0) + TASK_REWARD.seeds,
    coins: (stateRef.current?.coins || 0) + TASK_REWARD.coins,
  }), [save])

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
    await save({ packet_inventory: packets, seed_inventory: inv, discovered })
    // `isNew` is what the reveal uses to call out a first find.
    return { ...seedByKey(wonKey), isNew }
  }, [save])

  // The payoff cinematic has played for this grow; don't show it again.
  const markHarvestCelebrated = useCallback(
    () => save({ harvest_celebrated: true }),
    [save],
  )

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
    await save({
      seed_inventory: inv,
      growing_seed: seed.key,
      growing_started_at: new Date().toISOString(),
      growing_grow_seconds: seed.growSeconds,
      shaved_seconds: applied,
      overflow_seconds: banked - applied,
      harvest_celebrated: false,
    })
    return { seed, applied, remainingOverflow: banked - applied }
  }, [save])

  const clearGrowing = useCallback(
    extra => save({
      growing_seed: null,
      growing_started_at: null,
      growing_grow_seconds: null,
      shaved_seconds: 0,
      harvest_celebrated: false,
      ...extra,
    }),
    [save],
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
    await clearGrowing()
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

  const sellGrown = useCallback(async () => {
    const seed = seedByKey(stateRef.current?.growing_seed)
    if (!seed) throw new Error('Nothing is ready to sell')
    await clearGrowing({ coins: (stateRef.current?.coins || 0) + seed.sellValue })
    return seed.sellValue
  }, [clearGrowing])

  const sellPlanted = useCallback(async flowerId => {
    const flower = flowers.find(f => f.id === flowerId)
    const seed = seedByKey(flower?.seed_key)
    if (!flower || !seed) return 0
    setFlowers(prev => prev.filter(f => f.id !== flowerId))
    const { error } = await supabase.from('garden_flowers').delete().eq('id', flowerId)
    if (error) {
      setFlowers(prev => [...prev, flower])
      throw error
    }
    await save({ coins: (stateRef.current?.coins || 0) + seed.sellValue })
    return seed.sellValue
  }, [flowers, save])

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
    spawnCloud, bankTaskReward, setQuietMode, completeOnboarding, buyPacket, openPacket, plantSeed, markHarvestCelebrated, placeFlower, moveFlower, sellGrown, sellPlanted, unlockSeed, expandGarden,
    isDev, devOpen, openDevPanel: () => setDevOpen(true),
  }

  return (
    <GardenContext.Provider value={value}>
      {children}
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
          onClearLog={() => setDevLog([])}
        />
      )}
    </GardenContext.Provider>
  )
}
