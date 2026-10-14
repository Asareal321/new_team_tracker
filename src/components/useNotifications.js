import { useCallback, useEffect, useRef, useState } from 'react'
import { useGarden } from '../context/GardenContext'
import { planNotifications } from '../lib/notificationPlan'
import {
  notificationsAvailable, notificationStatus, requestNotifications,
  scheduleNotifications, notificationSettings, setNotificationSettings,
} from '../lib/nativeBridge'

// Keeping the phone's alarms in step with the app.
//
// The plan cannot re-check itself when it fires — a notification scheduled for
// 2pm arrives at 2pm whatever happened at 1pm. The answer is to rebuild it
// often and cheaply: every time the board or the garden changes, and every
// time the app comes back to the foreground. Anyone who opens the app at all
// gets an accurate plan; the stale case is the phone left in a pocket, which
// is why the copy asks questions rather than making claims.
//
// A no-op everywhere except the iOS shell.

export default function useNotifications({ spheres = [], logs = [] } = {}) {
  const { state } = useGarden()
  const [status, setStatus] = useState('unavailable')
  const [settings, setSettings] = useState(notificationSettings)
  const latest = useRef({ state, spheres, logs, settings })
  latest.current = { state, spheres, logs, settings }

  useEffect(() => {
    if (!notificationsAvailable()) return
    notificationStatus().then(setStatus)
  }, [])

  const rebuild = useCallback(() => {
    if (!notificationsAvailable()) return
    const { state: g, spheres: sp, logs: l, settings: s } = latest.current
    if (!g) return
    scheduleNotifications(planNotifications({
      garden: g, spheres: sp || [], logs: l || [], settings: s,
    }))
  }, [])

  // State changed under us.
  useEffect(() => {
    if (status !== 'authorized') return
    rebuild()
  }, [status, rebuild, state, spheres, logs, settings])

  // Back from the background, where the day may well have moved on.
  useEffect(() => {
    if (status !== 'authorized') return undefined
    const onShow = () => { if (!document.hidden) rebuild() }
    document.addEventListener('visibilitychange', onShow)
    return () => document.removeEventListener('visibilitychange', onShow)
  }, [status, rebuild])

  const ask = useCallback(async () => {
    const next = await requestNotifications()
    setStatus(next)
    return next
  }, [])

  const update = useCallback(patch => {
    setSettings(prev => {
      const next = { ...prev, ...patch }
      setNotificationSettings(next)
      return next
    })
  }, [])

  return {
    available: notificationsAvailable(),
    status,
    settings,
    ask,
    update,
  }
}
