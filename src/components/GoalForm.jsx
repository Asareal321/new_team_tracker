import { useMemo, useState } from 'react'
import { useSpheres } from '../context/SpheresContext'
import { checkGoal } from '../lib/spheres'

// A goal: something you are moving toward, with a date on it.
//
// The date is the one requirement. The S and the M of SMART are offered as
// questions under the title, live, and disappear as soon as the wording
// answers them — advice you can ignore, not a gate you have to get through.

export default function GoalForm({ sphereId, onDone }) {
  const { addGoal } = useSpheres()
  const [title, setTitle] = useState('')
  const [endDate, setEndDate] = useState('')
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [tried, setTried] = useState(false)

  const check = useMemo(() => checkGoal({ title, end_date: endDate }), [title, endDate])
  const fieldError = f => (tried ? check.errors.find(e => e.field === f)?.text : null)

  async function submit(e) {
    e.preventDefault()
    setTried(true)
    if (!check.ok || busy) return
    setBusy(true)
    setError('')
    try {
      await addGoal({ sphereId, title, end_date: endDate, notes })
      onDone?.()
    } catch (err) {
      setError(err?.message || String(err))
      setBusy(false)
    }
  }

  return (
    <form className="gf" onSubmit={submit}>
      <label className="gf-field">
        <span>Goal</span>
        <input value={title} onChange={e => setTitle(e.target.value)} maxLength={140} autoFocus
          placeholder="e.g. Finish 3 practice midterms" />
        {fieldError('title') && <em className="gf-err">{fieldError('title')}</em>}
      </label>
      {title.trim() && check.hints.length > 0 && (
        <ul className="gf-hints" aria-live="polite">
          {check.hints.map(h => (
            <li key={h.letter}><span className="gf-letter">{h.letter}</span>{h.text}</li>
          ))}
        </ul>
      )}
      <label className="gf-field gf-date">
        <span>By when</span>
        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required />
        {fieldError('end_date') && <em className="gf-err">{fieldError('end_date')}</em>}
      </label>
      <label className="gf-field">
        <span>Why it matters <small>(optional)</small></span>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} maxLength={1000} />
      </label>
      {error && <p className="gf-err">{error}</p>}
      <div className="gf-actions">
        <button type="button" className="btn-ghost" onClick={() => onDone?.()}>Cancel</button>
        <button className="btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Add goal'}</button>
      </div>
    </form>
  )
}
