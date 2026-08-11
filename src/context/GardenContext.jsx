import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../auth/AuthContext'
import {
  SEEDS, seedByKey, cloudShaveSeconds, cloudIdleCoins,
  nextExpansion, STARTING_PLOTS,
} from '../lib/garden'
import CloudLayer from '../components/CloudLayer'

export const GardenContext = createContext(null)

export const useGarden = () => useContext(GardenContext)

const DEFAULT_STATE = {
  coins: 0,
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

  // Called whenever a task lands in Done, on any board. The cloud floats over
  // the current page and expires on its own if ignored.
  const spawnCloud = useCallback(() => {
    if (!user) return
    setClouds(prev => [...prev, {
      id: crypto.randomUUID(),
      // Keep clouds off the sidebar and away from the very edges.
      left: 30 + Math.random() * 40,
      top: 20 + Math.random() * 35,
    }])
  }, [user])

  const dismissCloud = useCallback(id => {
    setClouds(prev => prev.filter(c => c.id !== id))
  }, [])

  // A popped cloud shaves time off whatever is growing. With an empty plot
  // the effort still counts — it converts to coins instead.
  const popCloud = useCallback(async (id, clicks) => {
    dismissCloud(id)
    const current = stateRef.current
    if (!current || clicks < 1) return null
    if (current.growing_seed) {
      const shaved = cloudShaveSeconds(clicks)
      await save({ shaved_seconds: (current.shaved_seconds || 0) + shaved })
      return { type: 'shave', amount: shaved }
    }
    const coins = cloudIdleCoins(clicks)
    await save({ coins: (current.coins || 0) + coins })
    return { type: 'coins', amount: coins }
  }, [save, dismissCloud])

  // --- garden actions -----------------------------------------------------

  const plantSeed = useCallback(async seedKey => {
    const seed = seedByKey(seedKey)
    if (!seed) throw new Error('Unknown seed')
    if (seed.rarity > (stateRef.current?.unlocked_rarity ?? 1)) throw new Error('Seed not unlocked yet')
    if (stateRef.current?.growing_seed) throw new Error('Something is already growing')
    await save({
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
    spawnCloud, plantSeed, placeFlower, sellGrown, sellPlanted, unlockSeed, expandGarden,
  }

  return (
    <GardenContext.Provider value={value}>
      {children}
      <CloudLayer clouds={clouds} onPop={popCloud} onExpire={dismissCloud} />
    </GardenContext.Provider>
  )
}
