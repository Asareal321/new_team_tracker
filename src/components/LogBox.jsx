import { useMemo, useState } from 'react'
import { useSpheres } from '../context/SpheresContext'

// The one thing you do every day: say what you moved, and where.
//
// The sphere is required and the goal is not — "general progress on
// Recruiting" is still progress, and making people invent a goal to file a
// sentence under would teach them to stop writing sentences. When the box
// lives on a sphere's own page the sphere is fixed and the picker disappears.

export default function LogBox({ sphereId: fixedSphere = null, autoFocus = false, onLogged }) {
  const { areas, spheres, goals, addLog } = useSpheres()
  const [sphereId, setSphereId] = useState(fixedSphere || '')
  const [goalId, setGoalId] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const target = fixedSphere || sphereId
  const live = spheres.filter(s => !s.archived_at)
  const openGoals = useMemo(
    () => goals.filter(g => g.sphere_id === target && g.status === 'active'),
    [goals, target],
  )

  // Spheres grouped the way the sidebar groups them, so the picker reads like
  // the place you already know rather than one long alphabetical list.
  const groups = useMemo(() => {
    const out = areas.map(a => ({ key: a.id, label: a.name, items: live.filter(s => s.area_id === a.id) }))
    const shared = live.filter(s => s.team_id)
    if (shared.length) out.push({ key: 'shared', label: 'Shared', items: shared })
    return out.filter(g => g.items.length)
  }, [areas, live])

  async function submit(e) {
    e.preventDefault()
    if (!target || !note.trim() || busy) return
    setBusy(true)
    setError('')
    try {
      const row = await addLog({ sphereId: target, goalId: goalId || null, note })
      setNote('')
      onLogged?.(row)
    } catch (err) {
      setError(err?.message || String(err))
    } finally {
      setBusy(false)
    }
  }

  if (!live.length) {
    return (
      <div className="lb lb-empty">
        <p>Make a sphere first — a part of your life you want to move forward. Use <strong>+ Area</strong> in the sidebar to start.</p>
      </div>
    )
  }

  return (
    <form className="lb" onSubmit={submit}>
      <label className="lb-note">
        <span className="sr-only">What did you make progress on?</span>
        <input
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="What did you move forward? e.g. Read chapter 4"
          maxLength={500}
          autoFocus={autoFocus}
        />
      </label>
      <div className="lb-row">
        {!fixedSphere && (
          <select
            value={sphereId}
            onChange={e => { setSphereId(e.target.value); setGoalId('') }}
            aria-label="Sphere"
            className="lb-select"
            required
          >
            <option value="">Which sphere?</option>
            {groups.map(g => (
              <optgroup key={g.key} label={g.label}>
                {g.items.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </optgroup>
            ))}
          </select>
        )}
        <select
          value={goalId}
          onChange={e => setGoalId(e.target.value)}
          aria-label="Goal (optional)"
          className="lb-select"
          disabled={!target || !openGoals.length}
        >
          <option value="">{openGoals.length ? 'Towards a goal? (optional)' : 'No open goals'}</option>
          {openGoals.map(g => <option key={g.id} value={g.id}>{g.title}</option>)}
        </select>
        <button className="btn-primary lb-go" disabled={!target || !note.trim() || busy}>
          {busy ? 'Logging…' : 'Log it'}
        </button>
      </div>
      {error && <p className="lb-error">{error}</p>}
    </form>
  )
}
