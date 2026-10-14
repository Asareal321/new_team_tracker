import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../auth/AuthContext'
import { useGarden } from './GardenContext'
import { tally, focusFor, boostFor, ownLogs } from '../lib/spheres'
import { activeWindow } from '../lib/planningHours'
import {
  fetchTodaysEvents, fetchViaServer, hasStoredConnection, isConnected, clearToken, CalendarAuthError,
} from '../lib/googleCalendar'
import { calendarFillEnabled, setCalendarFillEnabled } from '../components/useCalendarFill'

// The spheres model, loaded once and shared.
//
// Everything a sphere page or the Today page needs is small enough to hold in
// memory for one person: their areas, every sphere they can see (their own,
// plus any shared by a community they are in), the goals on those spheres, and
// the logs. Logs are the one table that grows without bound, so they are read
// newest first and capped — the cap is generous enough that a garden's size is
// still honest for a long time, and phase 4's history page will page past it.

const LOG_LIMIT = 2000

// How often the calendar is asked what is happening now. A block that started
// a minute ago being noticed a minute late costs one log at single pay at most.
const CALENDAR_POLL_MS = 60_000

// Exported for the render harness only; everything in the app goes through
// useSpheres().
export const SpheresContext = createContext(null)

export function SpheresProvider({ children }) {
  const { user } = useAuth()
  const { state: garden, rewardLog, choosePlant, recordGoalSet, beginFocus, endFocus } = useGarden() || {}
  const [areas, setAreas] = useState([])
  const [spheres, setSpheres] = useState([])
  const [goals, setGoals] = useState([])
  const [logs, setLogs] = useState([])
  const [members, setMembers] = useState({})
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
    // Names for whoever logs in a shared sphere. Only the communities that
    // actually have one are asked about; a personal-only account asks nothing.
    const teamIds = [...new Set((s.data || []).map(x => x.team_id).filter(Boolean))]
    if (teamIds.length) {
      const { data: m } = await supabase.from('team_members')
        .select('user_id, profiles(id, display_name)').in('team_id', teamIds)
      setMembers(Object.fromEntries((m || []).filter(r => r.profiles)
        .map(r => [r.profiles.id, r.profiles.display_name || 'Someone'])))
    } else setMembers({})
    setLoading(false)
  }, [user])

  useEffect(() => { load() }, [load])

  // Teammates log from their own devices. Coming back to the tab is when a
  // shared garden is most likely to have grown, so re-read then — only when
  // there is a shared sphere to have changed.
  const hasShared = spheres.some(x => x.team_id)
  useEffect(() => {
    if (!hasShared) return undefined
    const onBack = () => { if (document.visibilityState === 'visible') load() }
    document.addEventListener('visibilitychange', onBack)
    return () => document.removeEventListener('visibilitychange', onBack)
  }, [hasShared, load])

  // — the calendar: focus blocks ———————————————————————————————————————————
  //
  // A calendar event that names one of your spheres makes that hour a focus
  // block, and logs in that sphere pay double until it ends. Watched here
  // rather than on a page so it holds wherever you are in the app — the glow
  // and the doubled payout should not depend on which tab is open.
  //
  // Opt-in, behind the same switch the old board's calendar fill used, so
  // anyone who already turned it on does not have to again.
  const [calendarOn, setCalendarOn] = useState(calendarFillEnabled)
  const [calendarConnected, setCalendarConnected] = useState(isConnected)
  const [events, setEvents] = useState([])
  const [calendarError, setCalendarError] = useState('')
  const [minute, setMinute] = useState(0)

  const pollCalendar = useCallback(async () => {
    if (!calendarOn || !user) return
    try {
      // The server holds the refresh token and can always mint a working
      // access token; the tab's own token is the fallback for before the Edge
      // Function existed. null means "no answer", not "disconnected".
      let next = await fetchViaServer()
      if (next === null) {
        if (!isConnected()) return
        next = await fetchTodaysEvents()
      }
      setCalendarError('')
      setEvents(next || [])
    } catch (err) {
      if (err instanceof CalendarAuthError) { setCalendarConnected(false); clearToken() }
      setCalendarError(err?.message || String(err))
    }
  }, [calendarOn, user])

  useEffect(() => {
    if (!calendarOn) { setEvents([]); return undefined }
    pollCalendar()
    const id = setInterval(() => { pollCalendar(); setMinute(m => m + 1) }, CALENDAR_POLL_MS)
    const onWake = () => { if (document.visibilityState === 'visible') { pollCalendar(); setMinute(m => m + 1) } }
    document.addEventListener('visibilitychange', onWake)
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', onWake) }
  }, [calendarOn, pollCalendar])

  // The connection lands asynchronously after the Google round-trip, so it is
  // re-checked on a timer rather than read once.
  useEffect(() => {
    let alive = true
    const check = async () => {
      const stored = await hasStoredConnection()
      if (alive) setCalendarConnected(stored || isConnected())
    }
    check()
    const id = setInterval(check, 15_000)
    return () => { alive = false; clearInterval(id) }
  }, [])

  const toggleCalendar = useCallback(on => {
    setCalendarFillEnabled(on)
    setCalendarOn(on)
  }, [])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const focus = useMemo(() => focusFor({ events, spheres, now: new Date() }), [events, spheres, minute])
  const planning = activeWindow(garden?.prefs, new Date())

  // The block is written to the garden state so the glow on Today can say so
  // from any tab. Only when it changes — this runs on every poll.
  const focusId = focus.block?.id || null
  const storedSphereFocus = garden?.focus?.sphereId ? garden.focus.blockId : null
  useEffect(() => {
    if (!beginFocus || !endFocus) return
    if (focusId && storedSphereFocus !== focusId) {
      beginFocus({
        blockId: focusId, sphereId: focus.sphere.id, sphereName: focus.sphere.name, until: focus.block.end,
      })
    } else if (!focusId && storedSphereFocus) {
      endFocus()
    }
  // focus.sphere/block are read only when focusId changed, so they are in step.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusId, storedSphereFocus, beginFocus, endFocus])

  // Read at log time through a ref, so a log written the instant a block
  // starts is judged by the block, not by the render before it.
  const boostRef = useRef({ focus, planning })
  boostRef.current = { focus, planning }
  const boostInfo = useCallback(
    sphereId => boostFor({ sphereId, focus: boostRef.current.focus, planning: boostRef.current.planning }),
    [],
  )

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
    // A community's first shared sphere: fetch its members' names.
    if (teamId) load()
    return data
  }, [user, spheres, load])

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
    await recordGoalSet()
    return data
  }, [user, recordGoalSet])

  const setGoalStatus = useCallback(async (id, status) => {
    const closed_at = status === 'active' ? null : new Date().toISOString()
    const { error: e } = await supabase.from('goals').update({ status, closed_at }).eq('id', id)
    if (e) throw e
    setGoals(prev => prev.map(g => (g.id === id ? { ...g, status, closed_at } : g)))
  }, [])

  // The day's one paid action. The row is written first and the reward second,
  // so a failed write can never have paid out or spent a seed. The id is
  // minted here so the plant can be drawn from it before the round trip —
  // packets decide what it is; see pickPlant in lib/spheres.
  const addLog = useCallback(async ({ sphereId, goalId = null, note }) => {
    const { window } = boostInfo(sphereId)
    const id = crypto.randomUUID()
    const plant = choosePlant(id)
    const row = {
      id, sphere_id: sphereId, goal_id: goalId || null, user_id: user.id,
      note: note.trim(), seed_key: plant.seedKey, logged_at: new Date().toISOString(),
    }
    const { error: e } = await supabase.from('progress_logs').insert(row)
    if (e) throw e
    setLogs(prev => [row, ...prev])
    await rewardLog({ window, sphereId, goalId, seedKey: plant.seedKey, consume: plant.consume })
    return row
  }, [user, rewardLog, choosePlant, boostInfo])

  const deleteLog = useCallback(async id => {
    const { error: e } = await supabase.from('progress_logs').delete().eq('id', id)
    if (e) throw e
    setLogs(prev => prev.filter(l => l.id !== id))
  }, [])

  // A sphere's counts and garden are everyone's; "mine" is for your own day.
  const counts = useMemo(() => tally(logs), [logs])
  const myLogs = useMemo(() => ownLogs(logs, user?.id), [logs, user])
  const nameOf = useCallback(id => (id === user?.id ? 'You' : members[id] || 'Someone'), [members, user])

  const value = {
    loading, error, reload: load,
    areas, spheres, goals, logs, myLogs, counts, nameOf,
    addArea, addSphere, renameSphere, addGoal, setGoalStatus, addLog, deleteLog,
    focus, planning, boostInfo,
    calendar: {
      on: calendarOn, connected: calendarConnected, error: calendarError,
      toggle: toggleCalendar, refresh: pollCalendar,
    },
  }
  return <SpheresContext.Provider value={value}>{children}</SpheresContext.Provider>
}

export function useSpheres() {
  const ctx = useContext(SpheresContext)
  if (!ctx) throw new Error('useSpheres must be used inside SpheresProvider')
  return ctx
}
