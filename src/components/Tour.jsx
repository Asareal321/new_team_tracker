import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { TOUR_STEPS } from '../lib/tourSteps'
import Trak from './Trak'
import './Tour.css'

// The guided walk, over the live app.
//
// It is mounted in Layout rather than on a page, because it changes route as
// it goes — that is the whole point of it. Each step names a selector; the
// overlay cuts a hole over whatever matches and stands a card next to it.
//
// The hard part is that the element may not be there yet: the route has just
// changed, the page is still fetching, the band is still empty. So finding an
// anchor is a poll with a deadline, and missing it is not an error — the step
// simply centres itself and says its piece. A tour that blocks on a selector
// would be a tour that traps you.

const FIND_TIMEOUT = 1600
const PAD = 8

function firstMatch(selectors) {
  for (const sel of selectors || []) {
    const el = document.querySelector(sel)
    if (el && el.getBoundingClientRect().width > 0) return el
  }
  return null
}

export default function Tour({ onDone }) {
  const steps = TOUR_STEPS
  const [i, setI] = useState(0)
  const [rect, setRect] = useState(null)
  const [searching, setSearching] = useState(true)
  const navigate = useNavigate()
  const location = useLocation()
  const elRef = useRef(null)

  const step = steps[i]
  const atEnd = i === steps.length - 1

  const end = useCallback(() => onDone?.(), [onDone])
  const next = useCallback(() => (atEnd ? end() : setI(n => n + 1)), [atEnd, end])
  const back = useCallback(() => setI(n => Math.max(0, n - 1)), [])

  // Route first. The anchor hunt below waits for whatever this renders.
  useEffect(() => {
    if (step.route && location.pathname !== step.route) navigate(step.route)
  }, [step.route, location.pathname, navigate])

  // Find the thing this step is about, giving the page time to produce it.
  useEffect(() => {
    let raf = 0
    const deadline = performance.now() + FIND_TIMEOUT
    setSearching(true)
    setRect(null)
    elRef.current = null

    if (!step.anchor) { setSearching(false); return undefined }

    const hunt = () => {
      if (step.route && location.pathname !== step.route) {
        raf = requestAnimationFrame(hunt)
        return
      }
      const el = firstMatch(step.anchor)
      if (el) {
        elRef.current = el
        el.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' })
        // One more frame so the measurement is of where it settled.
        setTimeout(() => {
          if (elRef.current === el) setRect(el.getBoundingClientRect())
          setSearching(false)
        }, 320)
        return
      }
      if (performance.now() > deadline) { setSearching(false); return }
      raf = requestAnimationFrame(hunt)
    }
    raf = requestAnimationFrame(hunt)
    return () => cancelAnimationFrame(raf)
  }, [i, step.anchor, step.route, location.pathname])

  // Keep the hole over the element if the page moves under it.
  useEffect(() => {
    if (!elRef.current) return undefined
    const sync = () => elRef.current && setRect(elRef.current.getBoundingClientRect())
    window.addEventListener('resize', sync)
    window.addEventListener('scroll', sync, true)
    return () => {
      window.removeEventListener('resize', sync)
      window.removeEventListener('scroll', sync, true)
    }
  }, [i, rect === null])

  useEffect(() => {
    const onKey = e => {
      if (e.key === 'Escape') end()
      else if (e.key === 'ArrowRight' || e.key === 'Enter') next()
      else if (e.key === 'ArrowLeft') back()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, back, end])

  const hole = rect && {
    top: Math.max(0, rect.top - PAD),
    left: Math.max(0, rect.left - PAD),
    width: rect.width + PAD * 2,
    height: rect.height + PAD * 2,
  }

  return (
    <div className="tour-root" role="dialog" aria-modal="true" aria-label="Guided tour">
      {/* Four panels around the hole rather than one box-shadow, so the cut-out
          edge stays crisp and the highlighted element keeps its own colours. */}
      {hole ? (
        <>
          <div className="tour-mask" style={{ top: 0, left: 0, right: 0, height: hole.top }} />
          <div className="tour-mask" style={{ top: hole.top + hole.height, left: 0, right: 0, bottom: 0 }} />
          <div className="tour-mask" style={{ top: hole.top, left: 0, width: hole.left, height: hole.height }} />
          <div className="tour-mask" style={{ top: hole.top, left: hole.left + hole.width, right: 0, height: hole.height }} />
          <div className="tour-ring" style={hole} aria-hidden="true" />
        </>
      ) : (
        <div className="tour-mask tour-mask-all" />
      )}

      <TourCard
        step={step}
        hole={hole}
        searching={searching}
        n={i + 1}
        total={steps.length}
        atEnd={atEnd}
        onNext={next}
        onBack={i > 0 ? back : null}
        onEnd={end}
      />
    </div>
  )
}

// Placed under the hole when there is room, above it when there isn't, and in
// the middle of the screen when there is no hole at all.
function TourCard({ step, hole, searching, n, total, atEnd, onNext, onBack, onEnd }) {
  const [size, setSize] = useState({ w: 320, h: 200 })
  const ref = useRef(null)

  useEffect(() => {
    if (ref.current) {
      const r = ref.current.getBoundingClientRect()
      setSize({ w: r.width, h: r.height })
    }
  }, [step.key, hole?.top, hole?.left])

  let style = null
  if (hole) {
    const vw = window.innerWidth
    const vh = window.innerHeight
    const below = hole.top + hole.height + 14
    const fitsBelow = below + size.h < vh - 12
    const top = fitsBelow ? below : Math.max(12, hole.top - size.h - 14)
    let left = hole.left + hole.width / 2 - size.w / 2
    left = Math.min(Math.max(12, left), Math.max(12, vw - size.w - 12))
    style = { top, left }
  }

  return (
    <div className={`tour-card${hole ? '' : ' tour-card-centred'}`} style={style} ref={ref}>
      <div className="tour-card-head">
        <Trak mood={step.mood} size={48} />
        <div className="tour-card-heading">
          <span className="tour-count">{n} of {total}</span>
          <h3 className="tour-title">{step.title}</h3>
        </div>
      </div>
      <p className="tour-body">{step.body}</p>
      {searching && step.anchor && <p className="tour-hunting">Looking for it…</p>}

      <div className="tour-actions">
        <button className="tour-skip" onClick={onEnd}>Skip the tour</button>
        <span className="tour-spacer" />
        {onBack && <button className="btn-ghost tour-btn" onClick={onBack}>Back</button>}
        <button className="btn-primary tour-btn" onClick={onNext}>
          {atEnd ? 'Done' : 'Next'}
        </button>
      </div>
    </div>
  )
}
