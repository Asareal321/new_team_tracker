import { useCallback, useEffect, useRef, useState } from 'react'
import { planFill, activeBlock } from '../lib/calendarFill'
import { fetchTodaysEvents, isConnected, clearToken, CalendarAuthError } from '../lib/googleCalendar'
import { localDay } from '../lib/garden'

// Watching the calendar and filling the board from it.
//
// Deliberately conservative about acting. This rearranges work you did not ask
// it to rearrange, so:
//
//   • it only acts when the block CHANGES, not on every poll — otherwise a
//     task you moved by hand would be dragged back thirty seconds later;
//   • it does nothing at all when the block ends. Half-finished work is not
//     tidied away from under you;
//   • one fill per block per day, so re-entering a block you already worked
//     from does not wipe what you did in it.
const POLL_MS = 60_000
const OPT_IN_KEY = 'trakkit.calendarFill'

export function calendarFillEnabled() {
  try { return localStorage.getItem(OPT_IN_KEY) === 'on' } catch { return false }
}

export function setCalendarFillEnabled(on) {
  try { localStorage.setItem(OPT_IN_KEY, on ? 'on' : 'off') } catch { /* ignore */ }
}

export default function useCalendarFill({ tasks, projects, onApply }) {
  const [enabled, setEnabled] = useState(calendarFillEnabled)
  const [connected, setConnected] = useState(isConnected)
  const [block, setBlock] = useState(null)
  // The project the block names, if any. Separate from `block` because "there
  // is a block" and "the block means something to the board" are different
  // facts, and the strip used to show the first while implying the second.
  const [matched, setMatched] = useState(null)
  const [error, setError] = useState('')
  const [lastFilled, setLastFilled] = useState(null)

  // Which block we have already acted on, as `${day}:${eventId}`.
  const actedOn = useRef(new Set())
  // Read at poll time so the timer doesn't need re-creating on every keystroke.
  const latest = useRef({ tasks, projects, onApply })
  latest.current = { tasks, projects, onApply }

  const poll = useCallback(async () => {
    if (!enabled || !isConnected()) return
    try {
      const events = await fetchTodaysEvents()
      setError('')
      const now = new Date()
      const current = activeBlock(events, now.getTime())
      setBlock(current)
      if (!current) { setMatched(null); return }

      // One fill per block per day. Ending a block does nothing by design, so
      // this is the only guard against re-filling what you just worked out of.
      const stamp = `${localDay(now)}:${current.id}`
      if (actedOn.current.has(stamp)) return

      const { tasks: t, projects: p, onApply: apply } = latest.current
      const { project, moves } = planFill({
        block: current, projects: p, tasks: t, today: localDay(now),
      })
      setMatched(project)
      if (!project) return
      actedOn.current.add(stamp)
      if (moves.length === 0) return

      await apply(moves, { project, block: current })
      setLastFilled({ project: project.name, count: moves.filter(m => m.status !== 'braindump').length })
    } catch (err) {
      if (err instanceof CalendarAuthError) { setConnected(false); clearToken() }
      setError(err.message)
    }
  }, [enabled])

  useEffect(() => {
    if (!enabled) return undefined
    poll()
    const id = setInterval(poll, POLL_MS)
    const onWake = () => { if (document.visibilityState === 'visible') poll() }
    document.addEventListener('visibilitychange', onWake)
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', onWake) }
  }, [enabled, poll])

  // Coming back from the Google round-trip, the token lands in sessionStorage
  // before this mounts — but only after the auth event fires, so re-check.
  useEffect(() => {
    const id = setInterval(() => setConnected(isConnected()), 2000)
    return () => clearInterval(id)
  }, [])

  const toggle = useCallback(on => {
    setCalendarFillEnabled(on)
    setEnabled(on)
    if (!on) { setBlock(null); setMatched(null); setLastFilled(null) }
  }, [])

  return { enabled, connected, block, matched, error, lastFilled, toggle, refresh: poll }
}
