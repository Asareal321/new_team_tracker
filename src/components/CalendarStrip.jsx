import { useAuth } from '../auth/AuthContext'
import './CalendarStrip.css'

// The calendar's say over the board, and the switch that grants it.
//
// This is opt-in and visible on the board rather than buried in settings, for
// one reason: it moves your work without being asked. Anything that does that
// has to say so where the moving happens, and be switchable off in one click
// from the same place.
export default function CalendarStrip({ enabled, connected, block, matched, error, lastFilled, onToggle, onRefresh }) {
  const { connectCalendar } = useAuth()

  if (!enabled) {
    return (
      <div className="cal-strip off">
        <span className="cal-icon" aria-hidden="true">📅</span>
        <span className="cal-say">
          Let your calendar fill the board — a block named after a project pulls
          that project&rsquo;s tasks in.
        </span>
        <button className="bb-btn" onClick={() => onToggle(true)}>Turn on</button>
      </div>
    )
  }

  if (!connected) {
    return (
      <div className="cal-strip">
        <span className="cal-icon" aria-hidden="true">📅</span>
        <span className="cal-say">
          <strong>Connect Google Calendar.</strong> Read-only — trakkit never writes to
          your calendar, and you can disconnect whenever you like.
        </span>
        <button className="bb-btn primary" onClick={connectCalendar}>Connect</button>
        <button className="bb-btn" onClick={() => onToggle(false)}>Turn off</button>
      </div>
    )
  }

  return (
    <div className={`cal-strip${block && matched ? ' live' : ''}`}>
      <span className="cal-icon" aria-hidden="true">📅</span>
      <span className="cal-say">
        {error ? <span className="cal-error">{error}</span>
          : block && matched ? <><strong>{block.title}</strong> — filling from <b>{matched.name}</b>.</>
          // A block that names no project you have is the common case, and
          // saying "following your calendar" here was a plain untruth: it had
          // matched nothing and moved nothing.
          : block ? (
            <><strong>{block.title}</strong> — no project of yours is named in that.
            {' '}<span className="cal-note">Rename the event or the project so they share a word.</span></>
          )
          : 'No block right now. The board is yours.'}
        {lastFilled && !error && (
          <span className="cal-note"> Filled {lastFilled.count} from {lastFilled.project}.</span>
        )}
      </span>
      <button className="bb-btn" onClick={onRefresh}>Check now</button>
      <button className="bb-btn" onClick={() => onToggle(false)}>Turn off</button>
    </div>
  )
}
