import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useSpheres } from '../context/SpheresContext'
import { isNativeApp } from '../lib/nativeBridge'
import { MARKER } from '../lib/calendarFill'

// The calendar's one say in the spheres model: an event named after a sphere
// is a focus hour, and logs in that sphere pay double until it ends.
//
// Opt-in and switchable from right here, because it changes what your work
// pays without being asked — anything that does that should say so where it
// happens. Not pitched inside the iOS app: connecting is offered on the web,
// and the phone simply benefits once you have.

const time = iso => new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })

export default function FocusStrip() {
  const { connectCalendar } = useAuth() || {}
  const { focus, calendar } = useSpheres()
  if (!calendar) return null
  const { on, connected, error, toggle } = calendar

  if (isNativeApp() && !(on && connected)) return null

  if (!on) {
    return (
      <div className="sph-focus off">
        <span className="sph-focus-icon" aria-hidden="true">📅</span>
        <span className="sph-focus-say">
          Let your calendar set <strong>focus hours</strong>: an event named after a sphere makes
          logs there pay double while it runs.
        </span>
        <button className="btn-ghost btn-sm" onClick={() => toggle(true)}>Turn on</button>
      </div>
    )
  }

  if (!connected) {
    return (
      <div className="sph-focus">
        <span className="sph-focus-icon" aria-hidden="true">📅</span>
        <span className="sph-focus-say">
          <strong>Connect Google Calendar.</strong> Read-only — trakkit never writes to it, and
          you can disconnect whenever you like.
        </span>
        <button className="btn-primary btn-sm" onClick={() => connectCalendar?.()}>Connect</button>
        <button className="btn-ghost btn-sm" onClick={() => toggle(false)}>Turn off</button>
      </div>
    )
  }

  const next = focus?.upcoming?.[0]
  return (
    <div className={`sph-focus${focus?.sphere ? ' live' : ''}`}>
      <span className="sph-focus-icon" aria-hidden="true">{focus?.sphere ? '⏱️' : '📅'}</span>
      <span className="sph-focus-say">
        {error ? <span className="sph-focus-err">{error}</span>
          : focus?.sphere ? (
            <>
              Focus hour on <Link to={`/spheres/${focus.sphere.id}`}><strong>{focus.sphere.name}</strong></Link>
              {' '}until {time(focus.block.end)} — logs there pay double.
              {focus.overlapping > 1 && (
                <span className="sph-focus-note"> {focus.overlapping} events overlap; add <code>{MARKER}</code> to a title to pick one.</span>
              )}
            </>
          ) : next ? (
            <>Next focus hour: <strong>{next.sphereName}</strong> at {time(next.start)}.</>
          ) : (
            <>Watching today&rsquo;s calendar. Name an event after a sphere to make it a focus hour.</>
          )}
      </span>
      <button className="btn-ghost btn-sm" onClick={() => toggle(false)}>Turn off</button>
    </div>
  )
}
