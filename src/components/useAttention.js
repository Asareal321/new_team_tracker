import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useGarden } from '../context/GardenContext'
import { myFriends, marketOpen, isUnmigrated } from '../lib/community'
import { attentionFor, signatures } from '../lib/attention'
import { readSeen, writeSeen, SEEN_EVENT } from '../lib/seenState'

// How often to ask the server whether anything happened. Friend requests and
// listings are other people's actions, so there is nothing local to react to.
// A minute is often enough to feel live and rare enough to be free.
const POLL_MS = 60_000

// Everything a signal can be computed from. Gathered once here so the rail and
// the garden's own tabs are answering the same question.
export function useAttention() {
  const { user } = useAuth()
  const { state, flowers, quests } = useGarden() || {}
  const location = useLocation()

  const [community, setCommunity] = useState(null)
  const [seen, setSeen] = useState(() => readSeen(user?.id))
  // One failure is a blip; a missing migration is permanent. Stop asking.
  const stopped = useRef(false)

  useEffect(() => { setSeen(readSeen(user?.id)) }, [user?.id])

  // Another copy of this hook wrote something. Catch up.
  useEffect(() => {
    const sync = () => setSeen(readSeen(user?.id))
    window.addEventListener(SEEN_EVENT, sync)
    return () => window.removeEventListener(SEEN_EVENT, sync)
  }, [user?.id])

  const poll = useCallback(async () => {
    if (!user || stopped.current) return
    try {
      const [friends, listings] = await Promise.all([myFriends(), marketOpen(60, 0)])
      setCommunity({
        incoming: friends?.incoming?.length ?? 0,
        othersListings: (listings || []).filter(l => !l.mine).length,
      })
    } catch (err) {
      if (isUnmigrated(err)) stopped.current = true
      setCommunity({ incoming: 0, othersListings: 0 })
    }
  }, [user])

  useEffect(() => {
    poll()
    const id = setInterval(poll, POLL_MS)
    const onWake = () => { if (document.visibilityState === 'visible') poll() }
    document.addEventListener('visibilitychange', onWake)
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', onWake) }
  }, [poll])

  const input = { state, flowers, quests, community }

  // Going to look is what puts a glow out: record the cause you were shown.
  const markSeen = useCallback(scope => {
    if (!user || !scope) return
    const sig = signatures({ state, flowers, quests, community })[scope]
    // A scope with nothing to say still gets a record, so the next thing that
    // happens there counts as new rather than as a first sighting.
    setSeen(writeSeen(user.id, scope, sig ?? ''))
  }, [user, state, flowers, quests, community])

  // The rail's routes clear themselves by being navigated to.
  useEffect(() => { markSeen(location.pathname) }, [location.pathname, markSeen])

  const signals = attentionFor({ ...input, seen })
  return { signals, markSeen, refresh: poll }
}

export default useAttention
