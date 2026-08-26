import { useCallback, useEffect, useRef, useState } from 'react'
import { planFill, chooseBlock } from '../lib/calendarFill'
import {
  fetchTodaysEvents, fetchViaServer, hasStoredConnection, isConnected,
  clearToken, CalendarAuthError,
} from '../lib/googleCalendar'
import { localDay } from '../lib/garden'

// Watching the calendar and filling the board from it.
//
// Deliberately conservative about acting. This rearranges work you did not ask
// it to rearrange, so:
//
//   • it only acts when the block CHANGES, not on every poll — otherwise a
//     task you moved by hand would be dragged back thirty seconds later;
//   • when the block ends it puts back only what it parked — see the focus
//     record in BoardPage. Half-finished work is not tidied away from under
//     you, and what you did during the hour stays exactly as you left it;
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
  // How many events cover this minute, so the strip can admit when it had to
  // choose between them rather than pretending there was only one.
  const [overlapping, setOverlapping] = useState(0)
  const [error, setError] = useState('')
  const [lastFilled, setLastFilled] = useState(null)

  // Which block we have already acted on, as `${day}:${eventId}`.
  const actedOn = useRef(new Set())
  // Read at poll time so the timer doesn't need re-creating on every keystroke.
  const latest = useRef({ tasks, projects, onApply })
  latest.current = { tasks, projects, onApply }

  const poll = useCallback(async () => {
    if (!enabled) return
    try {
      // Server first: it holds a refresh token and can always mint a working
      // access token, so it is the only route that survives the hour. The
      // browser token is the fallback for before the Edge Function exists —
      // and fetchViaServer returns null rather than throwing for that case,
      // so a missing deployment is not mistaken for a lost connection.
      let events = await fetchViaServer()
      if (events === null) {
        if (!isConnected()) return
        events = await fetchTodaysEvents()
      }
      setError('')
      const now = new Date()
      // Which of the overlapping events to follow, decided by chooseBlock:
      // marked first, then the more specific one. See lib/calendarFill.js.
      const choice = chooseBlock({ events, projects: latest.current.projects, now: now.getTime() })
      const current = choice.block
      setBlock(current)
      setOverlapping(choice.overlapping)
      if (!current) { setMatched(null); return }

      // One fill per block per day. Ending a block does nothing by design, so
      // this is the only guard against re-filling what you just worked out of.
      const stamp = `${localDay(now)}:${current.id}`
      if (actedOn.current.has(stamp)) return

      const { tasks: t, projects: p, onApply: apply } = latest.current
      const { project, moves, parked } = planFill({
        block: current, projects: p, tasks: t, today: localDay(now),
      })
      setMatched(project)
      if (!project) return
      actedOn.current.add(stamp)
      if (moves.length === 0) return

      // `parked` goes with it: the page writes it down before it moves
      // anything, so a reload mid-apply can still rebuild the board.
      await apply(moves, { project, block: current, parked })
      setLastFilled({ project: project.name, count: moves.filter(m => m.status !== 'braindump').length })
    } catch (err) {
      // Only a real authorisation failure ends the connection. Everything
      // else is this minute's problem, not the connection's.
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

  // Connected means "there is a stored connection, OR this tab still holds a
  // usable token". Checked on a timer because the token lands asynchronously
  // after the Google round-trip, once the auth event fires.
  useEffect(() => {
    let alive = true
    const check = async () => {
      const stored = await hasStoredConnection()
      if (alive) setConnected(stored || isConnected())
    }
    check()
    const id = setInterval(check, 15_000)
    return () => { alive = false; clearInterval(id) }
  }, [])

  const toggle = useCallback(on => {
    setCalendarFillEnabled(on)
    setEnabled(on)
    if (!on) { setBlock(null); setMatched(null); setOverlapping(0); setLastFilled(null) }
  }, [])

  return { enabled, connected, block, matched, overlapping, error, lastFilled, toggle, refresh: poll }
}
