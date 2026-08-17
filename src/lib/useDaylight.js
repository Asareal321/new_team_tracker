import { useEffect, useState } from 'react'
import { phaseFor, msUntilNextHour, PHASES } from './daylight'

// ?sky=dusk pins the phase. It's how the other three can be looked at without
// waiting for evening, and being a URL rather than a setting means it can be
// sent to someone else.
function pinned() {
  const want = new URLSearchParams(window.location.search).get('sky')
  return PHASES.find(p => p.key === want) || null
}

// The current sky phase, kept true while the tab stays open. A garden left
// open through sunset should get dark on its own.
export default function useDaylight() {
  const [phase, setPhase] = useState(() => pinned() || phaseFor())

  useEffect(() => {
    if (pinned()) return
    let timer
    const tick = () => {
      setPhase(phaseFor())
      timer = setTimeout(tick, msUntilNextHour())
    }
    timer = setTimeout(tick, msUntilNextHour())
    return () => clearTimeout(timer)
  }, [])

  return phase
}
