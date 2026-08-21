import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useGarden } from '../context/GardenContext'
import { myFriends, marketOpen, isUnmigrated } from '../lib/community'
import { attentionFor, seenAfterVisit } from '../lib/attention'
import { readSeen, writeSeen } from '../lib/seenState'

// How often to ask the server whether anything happened. Friend requests and
// listings are other people's actions, so there is nothing local to react to.
// A minute is often enough to feel live and rare enough to be free.
const POLL_MS = 60_000

export default function useAttention() {
  const { user } = useAuth()
  const { state, quests } = useGarden() || {}
  const location = useLocation()

  const [community, setCommunity] = useState(null)
  const [seen, setSeen] = useState(() => readSeen(user?.id))
  // One failure is a blip; a missing migration is permanent. Stop asking.
  const stopped = useRef(false)

  useEffect(() => { setSeen(readSeen(user?.id)) }, [user?.id])

  const poll = useCallback(async () => {
    if (!user || stopped.current) return
    try {
      const [friends, listings] = await Promise.all([myFriends(), marketOpen(60, 0)])
      setCommunity({
        incoming: friends?.incoming?.length ?? 0,
        othersListings: (listings || []).filter(l => !l.mine).length,
      })
    } catch (err) {
      // Without the community migration there is nothing to report, and
      // retrying every minute would only fill the console.
      if (isUnmigrated(err)) stopped.current = true
      setCommunity({ incoming: 0, othersListings: 0 })
    }
  }, [user])

  useEffect(() => {
    poll()
    const id = setInterval(poll, POLL_MS)
    // Coming back to the tab is exactly when you want it to be current.
    const onWake = () => { if (document.visibilityState === 'visible') poll() }
    document.addEventListener('visibilitychange', onWake)
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', onWake) }
  }, [poll])

  // Visiting a place is what marks its news as seen. Done on arrival rather
  // than departure, because a glance is the whole interaction for most of it.
  useEffect(() => {
    if (!user) return
    const patch = seenAfterVisit(location.pathname, { state, community })
    if (!patch || Object.keys(patch).length === 0) return
    setSeen(writeSeen(user.id, location.pathname, patch))
  }, [location.pathname, user, state, community])

  // A route the user is standing on shouldn't shout at them.
  const signals = attentionFor({ state, quests, community, seen })
  delete signals[location.pathname]
  return { signals, refresh: poll }
}
