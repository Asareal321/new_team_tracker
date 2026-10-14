import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useSpheres } from '../context/SpheresContext'
import { useTeam } from '../context/TeamContext'
import { projectColorIndex } from '../lib/projectColors'
import '../pages/Spheres.css'

// Areas and their spheres, down the rail.
//
// The number beside a sphere is this week's logs. It is there so the rail
// itself shows the imbalance — a column of 6, 4, 0, 0 says the same thing as
// the balance nudge, without anyone having to open anything.

function InlineAdd({ label, placeholder, onAdd, className = '' }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  // A refused write has to say so. This form used to swallow the error, so a
  // database rejection looked exactly like Enter doing nothing.
  const [error, setError] = useState('')

  if (!open) {
    return <button className={`st-add ${className}`} onClick={() => setOpen(true)}>{label}</button>
  }
  async function submit(e) {
    e.preventDefault()
    if (!name.trim() || busy) return
    setBusy(true)
    setError('')
    try {
      await onAdd(name)
      setName('')
      setOpen(false)
    } catch (err) {
      setError(err?.message || String(err))
    } finally {
      setBusy(false)
    }
  }
  return (
    <form className={`st-form ${className}`} onSubmit={submit}>
      <input autoFocus value={name} onChange={e => { setName(e.target.value); setError('') }} placeholder={placeholder}
        maxLength={60} disabled={busy} aria-invalid={!!error}
        onKeyDown={e => e.key === 'Escape' && (setOpen(false), setError(''))} aria-label={placeholder} />
      {error && <p className="st-error" role="alert">Couldn’t save that: {error}</p>}
    </form>
  )
}

// `onPage` is the copy drawn on Today for phones, where the rail has no room.
export default function SphereTree({ onPage = false } = {}) {
  const { areas, spheres, counts, addArea, addSphere, loading } = useSpheres()
  const { teams } = useTeam() || {}
  const live = spheres.filter(s => !s.archived_at)
  const week = id => counts.bySphere[id]?.week || 0

  if (loading) return null

  const sphereLink = s => (
    <NavLink key={s.id} to={`/spheres/${s.id}`}
      className={({ isActive }) => `st-sphere pc-${projectColorIndex(s.id)}${isActive ? ' active' : ''}`}>
      <span className="st-dot" aria-hidden="true" />
      <span className="st-name">{s.name}</span>
      <span className={`st-week${week(s.id) ? '' : ' zero'}`} title="Logs this week">{week(s.id)}</span>
    </NavLink>
  )

  // Every community you're in gets a section, even before it has a sphere,
  // so starting one is a click away for any member.
  const shared = (teams || [])
    .map(t => ({ team: t, items: live.filter(s => s.team_id === t.id) }))

  return (
    <div className={`st${onPage ? ' st-page' : ''}`} aria-label="Spheres">
      <div className="st-head">
        <span className="st-title">Spheres</span>
      </div>

      {areas.map(a => (
        <div key={a.id} className="st-area">
          <span className="st-area-name">{a.name}</span>
          {live.filter(s => s.area_id === a.id).map(sphereLink)}
          <InlineAdd label="+ Sphere" placeholder="Name a sphere" className="st-add-sphere"
            onAdd={name => addSphere({ areaId: a.id, name })} />
        </div>
      ))}

      {shared.map(({ team, items }) => (
        <div key={team.id} className="st-area">
          <span className="st-area-name">{team.name} <small>shared</small></span>
          {items.map(sphereLink)}
          <InlineAdd label="+ Shared sphere" placeholder={`A sphere for ${team.name}`} className="st-add-sphere"
            onAdd={name => addSphere({ teamId: team.id, name })} />
        </div>
      ))}

      <InlineAdd label="+ Area" placeholder="e.g. Academics" onAdd={addArea} />
    </div>
  )
}
