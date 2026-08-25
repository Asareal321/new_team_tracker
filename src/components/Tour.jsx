import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { stepsFor, PHONE_QUERY } from '../lib/tourSteps'
import { useIsNarrow } from './useSwipeReveal'
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
//
// A step may also say `act: 'click'`, which means the tour stops driving and
// waits for you to click the thing it is pointing at — that is how you get to
// the archive, the garden rooms and the other tabs. The masks are four panels
// around the hole rather than one sheet with a cut-out, so the highlighted
// control is genuinely clickable. There is no per-step skip on those: not
// wanting to do it is a reason to leave the tour, not to be walked past the
// one part that is not a paragraph. The button comes back only if the control
// cannot be found at all, which is the single case that would trap you.
//
// And the walk itself differs by screen. A phone has no chevrons on a row and
// no braindump tray; a desktop has no swipe. Steps carry `only: 'phone' |
// 'desktop'` and the list is filtered on the same breakpoint the board uses,
// so the tour can never teach a gesture this screen does not have.

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
  // Same hook the rows use, so the tour and the board can't disagree about
  // which app you are looking at. Rotating a tablet mid-walk re-filters the
  // list; the index is clamped below rather than reset, because throwing you
  // back to step one for turning your phone would be its own bug.
  const phone = useIsNarrow(PHONE_QUERY)
  const steps = useMemo(() => stepsFor({ phone }), [phone])
  const [i, setI] = useState(0)
  const [rect, setRect] = useState(null)
  const [searching, setSearching] = useState(true)
  const navigate = useNavigate()
  const location = useLocation()
  const elRef = useRef(null)

  // Clamped rather than reset: the list can get shorter under you if the
  // screen changes width mid-walk.
  const at = Math.min(i, steps.length - 1)
  const step = steps[at]
  const atEnd = at >= steps.length - 1

  const end = useCallback(() => onDone?.(), [onDone])
  const next = useCallback(() => (atEnd ? end() : setI(n => n + 1)), [atEnd, end])
  const back = useCallback(() => setI(n => Math.max(0, n - 1)), [])

  // Route only when the step isn't asking you to travel yourself. A click step
  // that pointed at the Garden tab and then jumped there anyway would be the
  // old tour wearing a hint.
  useEffect(() => {
    if (step.act === 'click') return
    if (step.route && location.pathname !== step.route) navigate(step.route)
  }, [step.act, step.route, location.pathname, navigate])

  // Waiting for the click. Matching on the selector rather than on the element
  // we measured, because the control usually re-renders on the way (the tab
  // gains `active`, the nav link gains `active`) and the node we held is gone
  // by the time the event lands.
  useEffect(() => {
    if (step.act !== 'click') return undefined
    const onClick = e => {
      const hit = (step.anchor || []).some(sel => e.target.closest?.(sel))
      // Let the app's own handler run first — it is the thing doing the
      // navigating; we only follow it.
      if (hit) setTimeout(() => setI(n => (n + 1 <= steps.length - 1 ? n + 1 : n)), 0)
    }
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [i, step.act, step.anchor, steps.length])

  // Find the thing this step is about, giving the page time to produce it.
  useEffect(() => {
    let raf = 0
    const deadline = performance.now() + FIND_TIMEOUT
    setSearching(true)
    setRect(null)
    elRef.current = null

    if (!step.anchor) { setSearching(false); return undefined }

    const hunt = () => {
      if (step.act !== 'click' && step.route && location.pathname !== step.route) {
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
  }, [i, step.anchor, step.act, step.route, location.pathname])

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
      // A waiting step is waiting on the real control, so the arrow key does
      // not stand in for it. Escape still leaves — that is the way out.
      else if ((e.key === 'ArrowRight' || e.key === 'Enter') && step.act !== 'click') next()
      else if (e.key === 'ArrowLeft') back()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, back, end, step.act])

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
        n={at + 1}
        total={steps.length}
        atEnd={atEnd}
        waiting={step.act === 'click'}
        // The hunt has finished and found nothing, so there is no control for
        // "your turn" to refer to. That is the only time a click step offers a
        // way past itself.
        lost={step.act === 'click' && !searching && rect === null}
        onNext={next}
        onBack={at > 0 ? back : null}
        onEnd={end}
      />
    </div>
  )
}

// Placed under the hole when there is room, above it when there isn't, and in
// the middle of the screen when there is no hole at all.
function TourCard({ step, hole, searching, n, total, atEnd, waiting, lost, onNext, onBack, onEnd }) {
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
      {waiting && !searching && !lost && <p className="tour-waiting">Your turn — click it.</p>}
      {lost && <p className="tour-hunting">I can&rsquo;t find that one on this screen.</p>}

      <div className="tour-actions">
        <button className="tour-skip" onClick={onEnd}>Skip the tour</button>
        <span className="tour-spacer" />
        {onBack && <button className="btn-ghost tour-btn" onClick={onBack}>Back</button>}
        {/* A waiting step has no Next: the click is the step. The exception is
            a control that isn't there to be clicked — then the way on is the
            only thing standing between you and the rest of the walk. */}
        {(!waiting || lost) && (
          <button className="btn-primary tour-btn" onClick={onNext}>
            {atEnd ? 'Done' : 'Next'}
          </button>
        )}
      </div>
    </div>
  )
}
