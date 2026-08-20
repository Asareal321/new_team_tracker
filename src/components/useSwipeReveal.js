import { useCallback, useEffect, useRef, useState } from 'react'
import { axisOf, offsetFor, settle, shouldSuppressClick, REVEAL_WIDTH } from '../lib/swipe'

// Is this a screen where the swipe applies? The chevrons stay on a desktop —
// there's width for them there, and no one swipes with a mouse.
export function useIsNarrow(query = '(max-width: 820px)') {
  const [narrow, setNarrow] = useState(
    () => typeof matchMedia === 'function' && matchMedia(query).matches
  )
  useEffect(() => {
    if (typeof matchMedia !== 'function') return
    const mq = matchMedia(query)
    const on = e => setNarrow(e.matches)
    mq.addEventListener('change', on)
    setNarrow(mq.matches)
    return () => mq.removeEventListener('change', on)
  }, [query])
  return narrow
}

// Swipe a row aside to reveal what's behind it.
//
// Pointer events rather than touch events, so the same code answers a trackpad
// drag; `touch-action: pan-y` on the element is what leaves vertical scrolling
// to the browser instead of trying to reproduce it here.
export default function useSwipeReveal({ enabled = true, onOpen } = {}) {
  const [open, setOpen] = useState(false)
  const [dragX, setDragX] = useState(null)
  const g = useRef(null)

  // Never leave a row open on a screen where it can't be closed by swiping.
  useEffect(() => { if (!enabled) setOpen(false) }, [enabled])

  const close = useCallback(() => { setOpen(false); setDragX(null) }, [])

  const onPointerDown = useCallback(e => {
    if (!enabled || e.pointerType === 'mouse' && e.button !== 0) return
    g.current = { x: e.clientX, y: e.clientY, axis: null, wasOpen: open, moved: false }
  }, [enabled, open])

  const onPointerMove = useCallback(e => {
    const s = g.current
    if (!s) return
    const dx = e.clientX - s.x
    const dy = e.clientY - s.y
    if (!s.axis) {
      s.axis = axisOf(dx, dy)
      // Vertical: hand the gesture back to the browser and stop watching.
      if (s.axis === 'v') { g.current = null; setDragX(null); return }
      if (!s.axis) return
    }
    s.moved = true
    setDragX(offsetFor(dx, s.wasOpen))
  }, [])

  const endGesture = useCallback(e => {
    const s = g.current
    if (!s) return
    g.current = null
    setDragX(null)
    if (s.axis !== 'h') return
    const dx = e.clientX - s.x
    const dy = e.clientY - s.y
    const next = settle(dx, s.wasOpen) === 'open'
    setOpen(next)
    if (next && !s.wasOpen) onOpen?.()
    // The click that follows a swipe would otherwise also open the task.
    if (shouldSuppressClick(dx, dy)) {
      s.suppress = true
      const swallow = ev => { ev.preventDefault(); ev.stopPropagation() }
      window.addEventListener('click', swallow, { capture: true, once: true })
      // If no click follows — the pointer ended outside a button — the listener
      // would sit there and eat the next unrelated click instead.
      setTimeout(() => window.removeEventListener('click', swallow, { capture: true }), 0)
    }
  }, [onOpen])

  const x = dragX ?? (open ? -REVEAL_WIDTH : 0)

  return {
    open,
    close,
    // Applied to the sliding layer.
    style: {
      transform: `translate3d(${x}px, 0, 0)`,
      transition: dragX === null ? 'transform 240ms cubic-bezier(0.22, 0.61, 0.36, 1)' : 'none',
    },
    handlers: enabled
      ? {
        onPointerDown,
        onPointerMove,
        onPointerUp: endGesture,
        onPointerCancel: () => { g.current = null; setDragX(null) },
      }
      : {},
  }
}
