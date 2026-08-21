import { useState } from 'react'
import { listFlower } from '../lib/community'
import './ListFlowerModal.css'

// Putting a flower on the market.
//
// The price is yours to pick and there is no suggested value, deliberately.
// Flowers used to convert to coins at a fixed rate, which set a floor under
// every price — nobody accepts less from a person than the game pays
// automatically. Printing that number here would put the floor straight back.
export default function ListFlowerModal({ flower, seed, onDone, onCancel }) {
  const [price, setPrice] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const n = Number(price)
  const valid = Number.isInteger(n) && n > 0

  async function submit(e) {
    e.preventDefault()
    if (!valid || busy) return
    setBusy(true); setError('')
    try {
      await listFlower(flower.id, n)
      onDone?.(seed.name, n)
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <form className="lf-modal" onClick={e => e.stopPropagation()} onSubmit={submit}>
        <h3 className="lf-title">Sell your {seed.name.toLowerCase()}</h3>
        <p className="lf-body">
          It leaves your garden now and waits on the market until someone buys it.
          You can take it back at any time.
        </p>
        <label className="lf-label" htmlFor="lf-price">Price in coins</label>
        <input
          id="lf-price"
          className="lf-price"
          type="number"
          min="1"
          step="1"
          inputMode="numeric"
          autoFocus
          value={price}
          onChange={e => setPrice(e.target.value)}
          placeholder="e.g. 120"
        />
        {error && <p className="lf-error">{error}</p>}
        <div className="lf-actions">
          <button type="button" className="btn-ghost" onClick={onCancel} disabled={busy}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={!valid || busy}>
            {busy ? 'Listing…' : 'Put it up'}
          </button>
        </div>
      </form>
    </div>
  )
}
