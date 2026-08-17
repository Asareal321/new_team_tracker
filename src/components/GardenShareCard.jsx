import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import './GardenShareCard.css'

// Your garden's share code, and the box for someone else's.
//
// Visiting already worked for people you share a community with. A code is for
// everyone else: it's yours to hand out, it doesn't expire, and resetting it is
// the way to take it back. See migration-garden-share.sql — the code doesn't
// widen what a visitor can read, it only lets them find one garden.

export default function GardenShareCard() {
  const navigate = useNavigate()
  const [code, setCode] = useState(null)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')
  const [visitCode, setVisitCode] = useState('')

  async function run(fn) {
    setBusy(true)
    setError('')
    try {
      const { data, error } = await fn()
      if (error) throw error
      setCode(data)
    } catch (e) {
      const msg = e?.message || String(e)
      setError(/function|does not exist/i.test(msg)
        ? 'Shared gardens need a one-time database migration — run migration-garden-share.sql in the Supabase SQL editor.'
        : msg)
    } finally {
      setBusy(false)
    }
  }

  const reveal = () => run(() => supabase.rpc('my_garden_code'))
  const reset = () => {
    if (!window.confirm('Reset your code? Anyone still using the old one will lose access.')) return
    run(() => supabase.rpc('reset_garden_code'))
  }

  async function copy() {
    if (!code) return
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      setError('Couldn’t reach the clipboard — select the code and copy it by hand.')
    }
  }

  function visit(e) {
    e.preventDefault()
    const c = visitCode.trim().toUpperCase()
    if (c) navigate(`/garden/visit/${c}`)
  }

  return (
    <div className="gs-card">
      <div className="gs-row">
        <div className="gs-copy">
          <strong>Share your garden</strong>
          <p className="gs-hint">
            A code anyone can use to look around your greenhouse, garden, herbarium and
            awards. They can only look — there are no controls on a visit.
          </p>
        </div>
        {code ? (
          <div className="gs-code-block">
            <span className="gs-code">{code}</span>
            <button className="btn-ghost btn-sm" onClick={copy} disabled={busy}>
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button className="btn-ghost btn-sm" onClick={reset} disabled={busy}>Reset</button>
          </div>
        ) : (
          <button className="btn-primary btn-sm" onClick={reveal} disabled={busy}>
            {busy ? 'One moment…' : 'Get my code'}
          </button>
        )}
      </div>

      <form className="gs-visit" onSubmit={visit}>
        <label className="gs-label" htmlFor="gs-visit-code">Visit a garden</label>
        <input
          id="gs-visit-code"
          value={visitCode}
          onChange={e => setVisitCode(e.target.value.toUpperCase())}
          placeholder="Their code"
          maxLength={8}
          autoComplete="off"
        />
        <button type="submit" className="btn-ghost btn-sm" disabled={!visitCode.trim()}>Go</button>
      </form>

      {error && <p className="auth-error">{error}</p>}
    </div>
  )
}
