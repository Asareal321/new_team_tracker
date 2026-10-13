import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../auth/AuthContext'
import { useGarden } from './GardenContext'
import { SEEDS } from '../lib/garden'
import { tally } from '../lib/spheres'

// The spheres model, loaded once and shared.
//
// Everything a sphere page or the Today page needs is small enough to hold in
// memory for one person: their areas, every sphere they can see (their own,
// plus any shared by a community they are in), the goals on those spheres, and
// the logs. Logs are the one table that grows without bound, so they are read
// newest first and capped — the cap is generous enough that a garden's size is
// still honest for a long time, and phase 4's history page will page past it.

const LOG_LIMIT = 2000

// Exported for the render harness only; everything in the app goes through
// useSpheres().
export const SpheresContext = createContext(null)

// Until packets decide what grows (phase 3), every log plants one of the
// common seeds, picked from its own id so that a plant never changes once it
// has been drawn.
const COMMON = SEEDS.filter(s => s.rarity === 1)
export function seedFor(id) {
  let h = 0
  for (const c of String(id)) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return COMMON[h % COMMON.length]?.key ?? 'sprig'
}

export function SpheresProvider({ children }) {
  const { user } = useAuth()
  const { rewardLog } = useGarden()
  const [areas, setAreas] = useState([])
  const [spheres, setSpheres] = useState([])
  const [goals, setGoals] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!user) return
    setError('')
    // RLS decides what each of these returns: your own areas, the spheres you
    // can see, and only the goals and logs that belong to those.
    const [a, s, g, l] = await Promise.all([
      supabase.from('areas').select('*').order('position').order('created_at'),
      supabase.from('spheres').select('*').order('position').order('created_at'),
      supabase.from('goals').select('*').order('end_date'),
      supabase.from('progress_logs').select('*').order('logged_at', { ascending: false }).limit(LOG_LIMIT),
    ])
    const failed = [a, s, g, l].find(r => r.error)
    if (failed) setError(failed.error.message)
    setAreas(a.data || [])
    setSpheres(s.data || [])
    setGoals(g.data || [])
    setLogs(l.data || [])
    setLoading(false)
  }, [user])

  useEffect(() => { load() }, [load])

  // — writes ————————————————————————————————————————————————————————————————

  const addArea = useCallback(async name => {
    const { data, error: e } = await supabase.from('areas')
      .insert({ user_id: user.id, name: name.trim(), position: areas.length })
      .select().single()
    if (e) throw e
    setAreas(prev => [...prev, data])
    return data
  }, [user, areas.length])

  const addSphere = useCallback(async ({ areaId = null, teamId = null, name }) => {
    const siblings = spheres.filter(s => (areaId ? s.area_id === areaId : s.team_id === teamId))
    const { data, error: e } = await supabase.from('spheres')
      .insert({ user_id: user.id, area_id: areaId, team_id: teamId, name: name.trim(), position: siblings.length })
      .select().single()
    if (e) throw e
    setSpheres(prev => [...prev, data])
    return data
  }, [user, spheres])

  const renameSphere = useCallback(async (id, name) => {
    const { error: e } = await supabase.from('spheres').update({ name: name.trim() }).eq('id', id)
    if (e) throw e
    setSpheres(prev => prev.map(s => (s.id === id ? { ...s, name: name.trim() } : s)))
  }, [])

  const addGoal = useCallback(async ({ sphereId, title, end_date, notes = null }) => {
    const { data, error: e } = await supabase.from('goals')
      .insert({ sphere_id: sphereId, user_id: user.id, title: title.trim(), end_date, notes: notes?.trim() || null })
      .select().single()
    if (e) throw e
    setGoals(prev => [...prev, data].sort((x, y) => (x.end_date < y.end_date ? -1 : 1)))
    return data
  }, [user])

  const setGoalStatus = useCallback(async (id, status) => {
    const closed_at = status === 'active' ? null : new Date().toISOString()
    const { error: e } = await supabase.from('goals').update({ status, closed_at }).eq('id', id)
    if (e) throw e
    setGoals(prev => prev.map(g => (g.id === id ? { ...g, status, closed_at } : g)))
  }, [])

  // The day's one paid action. The row is written first and the reward second,
  // so a failed write can never have paid out; the id is minted here so the
  // plant can be drawn from it before the round trip.
  const addLog = useCallback(async ({ sphereId, goalId = null, note, boost = false }) => {
    const id = crypto.randomUUID()
    const row = {
      id, sphere_id: sphereId, goal_id: goalId || null, user_id: user.id,
      note: note.trim(), seed_key: seedFor(id), logged_at: new Date().toISOString(),
    }
    const { error: e } = await supabase.from('progress_logs').insert(row)
    if (e) throw e
    setLogs(prev => [row, ...prev])
    await rewardLog({ boost })
    return row
  }, [user, rewardLog])

  const deleteLog = useCallback(async id => {
    const { error: e } = await supabase.from('progress_logs').delete().eq('id', id)
    if (e) throw e
    setLogs(prev => prev.filter(l => l.id !== id))
  }, [])

  const counts = useMemo(() => tally(logs), [logs])

  const value = {
    loading, error, reload: load,
    areas, spheres, goals, logs, counts,
    addArea, addSphere, renameSphere, addGoal, setGoalStatus, addLog, deleteLog,
  }
  return <SpheresContext.Provider value={value}>{children}</SpheresContext.Provider>
}

export function useSpheres() {
  const ctx = useContext(SpheresContext)
  if (!ctx) throw new Error('useSpheres must be used inside SpheresProvider')
  return ctx
}
