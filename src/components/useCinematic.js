import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

// The runtime both garden cinematics are driven by.
//
// Their compositions are pure functions of authored time T, and the naive way
// to play one is to hold T in React state. That re-renders every element every
// frame with fresh inline style objects — enough reconciliation to drop frames
// on a piece with ~70 moving parts.
//
// Instead the tree renders ONCE. Every animated element registers an
// `apply(T, el)` through `track()`, and the animation loop calls those directly
// against the DOM, so React does no work at all during playback. Elements
// should only ever write `transform` and `opacity` from inside `apply`: those
// stay on the compositor, where anything touching geometry (`height`, `left`,
// `width`, `background-color` on a large surface) forces layout or paint and
// is exactly what makes a piece stutter.
export function useCinematic({ duration, start = 0, onDone }) {
  const done = useRef(false)
  // Callers pass an inline arrow, so `onDone`'s identity changes every render.
  // Held in a ref, the loop effect can mount once and stay mounted — depending
  // on it directly tore the effect down and restarted the clock continuously.
  const cb = useRef(onDone)
  cb.current = onDone

  // Rebuilt on each render: the ref callbacks are fresh closures every time, so
  // React re-invokes all of them and the list refills.
  const reg = useRef([])
  reg.current = []
  const track = apply => el => { if (el) reg.current.push([el, apply]) }

  const paint = T => {
    const list = reg.current
    for (let i = 0; i < list.length; i++) list[i][1](T, list[i][0])
  }

  const finish = useCallback(() => {
    if (done.current) return
    done.current = true
    cb.current()
  }, [])

  // Paint frame zero synchronously, before the browser shows anything —
  // otherwise the first painted frame is whatever the static styles say, which
  // flashes the piece at its resting pose before it has begun.
  useLayoutEffect(() => { paint(start) })

  useEffect(() => {
    let raf
    const t0 = performance.now()
    const tick = now => {
      // Time comes from the wall clock, not a frame counter, so a backgrounded
      // tab resumes at the right point instead of fast-forwarding the frames
      // it missed.
      const T = start + (now - t0) / 1000
      paint(Math.min(T, duration))
      if (T >= duration) { finish(); return }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [start, duration, finish])

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') finish() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [finish])

  return { track, finish }
}

// The compositions are authored at a fixed 1920x1080 and scaled to fit rather
// than reflowed — every offset in them is in stage pixels and only holds at
// that aspect.
export function useStageScale() {
  const [scale, setScale] = useState(() =>
    Math.min(window.innerWidth / 1920, window.innerHeight / 1080))
  useEffect(() => {
    const fit = () => setScale(Math.min(window.innerWidth / 1920, window.innerHeight / 1080))
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [])
  return scale
}

export const prefersReducedMotion = () =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
