import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../auth/AuthContext'
import {
  SEEDS, seedByKey, cloudShaveSeconds, cloudIdleCoins,
  nextExpansion, STARTING_PLOTS, TASK_REWARD,
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
  plot_count: STARTING_PLOTS,
  unlocked_rarity: 1,
  growing_seed: null,
  growing_started_at: null,
  growing_grow_seconds: null,
  shaved_seconds: 0,
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
    setState(rows || { user_id: user.id, ...DEFAULT_STATE })
    setFlowers(flowerRows || [])
    setReady(true)
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
    // Preview clouds report what they *would* have paid, but write nothing.
    if (cloud?.preview) {
      return current.growing_seed
        ? { type: 'shave', amount: cloudShaveSeconds(tier), preview: true }
        : { type: 'coins', amount: cloudIdleCoins(tier), preview: true }
    }
    if (current.growing_seed) {
      const shaved = cloudShaveSeconds(tier)
      await save({ shaved_seconds: (current.shaved_seconds || 0) + shaved })
      return { type: 'shave', amount: shaved }
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

  const devUnlockAll = useCallback(() => save({ unlocked_rarity: SEEDS.length }), [save])

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

  const plantSeed = useCallback(async seedKey => {
    const seed = seedByKey(seedKey)
    if (!seed) throw new Error('Unknown seed')
    if (seed.rarity > (stateRef.current?.unlocked_rarity ?? 1)) throw new Error('Seed not unlocked yet')
    if (stateRef.current?.growing_seed) throw new Error('Something is already growing')
    if ((stateRef.current?.seeds || 0) < 1) throw new Error('No seeds in the tray — finish a task to bank one')
    await save({
      seeds: stateRef.current.seeds - 1,
      growing_seed: seed.key,
      growing_started_at: new Date().toISOString(),
      growing_grow_seconds: seed.growSeconds,
      shaved_seconds: 0,
    })
  }, [save])

  const clearGrowing = useCallback(
    extra => save({
      growing_seed: null,
      growing_started_at: null,
      growing_grow_seconds: null,
      shaved_seconds: 0,
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
    spawnCloud, bankTaskReward, setQuietMode, plantSeed, placeFlower, sellGrown, sellPlanted, unlockSeed, expandGarden,
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
