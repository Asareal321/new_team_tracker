import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSpheres } from '../context/SpheresContext'
import { useGarden } from '../context/GardenContext'
import { seedByKey } from '../lib/garden'
import SphereMosaic from './SphereMosaic'

// The one thing you do every day: say what you moved, and where.
//
// The sphere is required and the goal is not — "general progress on
// Recruiting" is still progress, and making people invent a goal to file a
// sentence under would teach them to stop writing sentences. When the box
// lives on a sphere's own page the sphere is fixed and the picker disappears.
// On Today (`mosaic`) the picker is the mosaic of your areas; shared spheres,
// which the mosaic leaves out, keep a plain list underneath.

// `aside` (with `mosaic`) lays it out as Today's dashboard: a sticky bar on
// top, the mosaic filling the left, and whatever Today passes on the right.
export default function LogBox({ sphereId: fixedSphere = null, autoFocus = false, onLogged, mosaic = false, aside = null }) {
  const { areas, spheres, goals, addLog, boostInfo } = useSpheres()
  const { state } = useGarden() || {}
  const [sphereId, setSphereId] = useState(fixedSphere || '')
  const [goalId, setGoalId] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const target = fixedSphere || sphereId
  const boost = target && boostInfo ? boostInfo(target) : null
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

  const sharedList = live.filter(s => s.team_id)
  const sharedPicked = sharedList.some(s => s.id === sphereId)

  async function submit(e) {
    e.preventDefault()
    if (!target || !note.trim() || busy) return
    setBusy(true)
    setError('')
    try {
      const row = await addLog({ sphereId: target, goalId: goalId || null, note })
      setNote('')
      // Back out to the whole mosaic, so the tile you just fed is seen growing.
      if (mosaic) { setSphereId(''); setGoalId('') }
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
        <p>Make a sphere first — a part of your life you want to move forward. Use <strong>+ Area</strong> in your sphere list to start.</p>
      </div>
    )
  }

  const pickedLabel = target
    ? <>→ <strong>{spheres.find(s => s.id === target)?.name}</strong>{goalId ? <> · {openGoals.find(g => g.id === goalId)?.title}</> : null}</>
    : 'pick a sphere below'

  if (mosaic && !fixedSphere) {
    return (
      <div className="lb-dash">
        <form className="lb-bar" onSubmit={submit}>
          <label className="lb-bar-note">
            <span className="sr-only">What did you make progress on?</span>
            <input
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="What did you move forward?"
              maxLength={500}
              autoFocus={autoFocus}
            />
            <span className="lb-bar-target">{pickedLabel}</span>
          </label>
          {sharedPicked && openGoals.length > 0 && (
            <select value={goalId} onChange={e => setGoalId(e.target.value)} aria-label="Goal (optional)" className="lb-select lb-bar-goal">
              <option value="">No goal</option>
              {openGoals.map(g => <option key={g.id} value={g.id}>{g.title}</option>)}
            </select>
          )}
          <button className="btn-primary lb-go" disabled={!target || !note.trim() || busy}>
            {busy ? 'Logging…' : 'Log it'}
          </button>
        </form>
        {error && <p className="lb-error">{error}</p>}
        {boost?.boost && <p className="lb-boost">⚡ {boost.label}</p>}
        <div className="lb-dash-grid">
          <div className="lb-dash-main">
            <SphereMosaic sphereId={sharedPicked ? '' : sphereId} goalId={goalId}
              onPick={p => { setSphereId(p.sphereId); setGoalId(p.goalId) }} />
            <div className="lb-dash-under">
              {sharedList.length > 0 && (
                <label className="mo-shared">
                  <span>Or a shared sphere</span>
                  <select className="lb-select" value={sharedPicked ? sphereId : ''}
                    onChange={e => { setSphereId(e.target.value); setGoalId('') }}>
                    <option value="">Choose…</option>
                    {sharedList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </label>
              )}
              <NextPlant state={state} />
            </div>
          </div>
          {aside && <aside className="lb-dash-side">{aside}</aside>}
        </div>
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
      {mosaic && !fixedSphere && (
        <SphereMosaic sphereId={sharedPicked ? '' : sphereId} goalId={goalId}
          onPick={p => { setSphereId(p.sphereId); setGoalId(p.goalId) }} />
      )}
      {mosaic && !fixedSphere && sharedList.length > 0 && (
        <label className="mo-shared">
          <span>Or a shared sphere</span>
          <select className="lb-select" value={sharedPicked ? sphereId : ''}
            onChange={e => { setSphereId(e.target.value); setGoalId('') }}>
            <option value="">Choose…</option>
            {sharedList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </label>
      )}
      <div className="lb-row">
        {!fixedSphere && !mosaic && (
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
        {(!mosaic || fixedSphere || sharedPicked) && (
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
        )}
        {mosaic && !fixedSphere && (
          <span className="lb-picked">
            {target
              ? <>Logging to <strong>{spheres.find(s => s.id === target)?.name}</strong>{goalId ? <> · {openGoals.find(g => g.id === goalId)?.title}</> : null}</>
              : 'Pick a sphere above'}
          </span>
        )}
        <button className="btn-primary lb-go" disabled={!target || !note.trim() || busy}>
          {busy ? 'Logging…' : 'Log it'}
        </button>
      </div>
      {boost?.boost && <p className="lb-boost">⚡ {boost.label}</p>}
      <NextPlant state={state} />
      {error && <p className="lb-error">{error}</p>}
    </form>
  )
}

// What the next log will plant, said where you log — so a packet you opened is
// visibly the reason your next plant is a rose. Says what is knowable without
// rolling: a pinned seed by name, otherwise "something from your bag".
function NextPlant({ state }) {
  if (!state) return null
  const inv = state.seed_inventory || {}
  const held = Object.values(inv).reduce((n, v) => n + v, 0)
  const pinned = (inv[state.prefs?.plantNext] || 0) > 0 ? seedByKey(state.prefs.plantNext) : null
  return (
    <p className="lb-plant">
      {pinned
        ? <>Plants a <strong>{pinned.emoji} {pinned.name}</strong> from your bag</>
        : held
          ? <>Plants a seed from your bag ({held} left)</>
          : <>Plants a free sprout — open a packet for something rarer</>}
      {' · '}
      <Link to="/garden">Seed bag</Link>
    </p>
  )
}
