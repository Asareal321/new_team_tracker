import { useState } from 'react'
import { SEEDS, RARITY_COLORS } from '../lib/garden'
import './Onboarding.css'

// Four steps, game first: you own a plant before you own a to-do list. Step 3
// is the switch that makes the plant mean something — it explains that
// finishing work is what grows it.
const STARTER_KEYS = ['daisy', 'tulip', 'orchid']

export default function Onboarding({ displayName, onFinish }) {
  const [step, setStep] = useState(0)
  const [pick, setPick] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [firstTask, setFirstTask] = useState('')

  const chosen = SEEDS.find(s => s.key === pick)

  async function finish() {
    setBusy(true)
    setError('')
    try {
      await onFinish({ seedKey: pick, firstTask: firstTask.trim() })
    } catch (e) {
      setError(e?.message || String(e))
      setBusy(false)
    }
  }

  return (
    <div className="onb-overlay">
      <div className="onb-card">
        <div className="onb-steps" aria-hidden="true">
          {[0, 1, 2, 3].map(i => <span key={i} className={`onb-pip${i <= step ? ' on' : ''}`} />)}
        </div>

        {step === 0 && (
          <>
            <h2 className="onb-title">Pick your first seed</h2>
            <p className="onb-body">
              {displayName ? `Welcome, ${displayName}. ` : ''}Before anything else — choose something to grow.
            </p>
            <div className="onb-seeds">
              {STARTER_KEYS.map(key => {
                const seed = SEEDS.find(s => s.key === key)
                return (
                  <button
                    key={key}
                    className={`onb-seed${pick === key ? ' picked' : ''}`}
                    style={{ '--rarity': RARITY_COLORS[seed.rarity] }}
                    onClick={() => setPick(key)}
                    aria-pressed={pick === key}
                  >
                    <span className="onb-seed-emoji">{seed.emoji}</span>
                    <span className="onb-seed-name">{seed.name}</span>
                  </button>
                )
              })}
            </div>
            <div className="onb-actions">
              <button className="btn-primary" disabled={!pick} onClick={() => setStep(1)}>Plant it</button>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <div className="onb-hero">{chosen?.emoji}</div>
            <h2 className="onb-title">Planted.</h2>
            <p className="onb-body">
              Your {chosen?.name.toLowerCase()} is in the ground. It grows on a real clock — come back
              tomorrow and it will have moved on without you.
            </p>
            <div className="onb-actions">
              <button className="btn-primary" onClick={() => setStep(2)}>What grows it?</button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="onb-hero">✓</div>
            <h2 className="onb-title">Finishing work grows it</h2>
            <p className="onb-body">
              Every task you complete banks a seed and some coins, and drops a rain cloud you can tap
              to cut the wait. Coins buy new species from the shop. That's the whole loop.
            </p>
            <div className="onb-actions">
              <button className="btn-primary" onClick={() => setStep(3)}>Got it</button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="onb-title">Here&rsquo;s your board</h2>
            <p className="onb-body">
              One task to start with. Add anything you like — finishing it is what waters the garden.
            </p>
            <input
              className="onb-input"
              autoFocus
              value={firstTask}
              onChange={e => setFirstTask(e.target.value)}
              placeholder="Your first task"
              onKeyDown={e => e.key === 'Enter' && firstTask.trim() && finish()}
            />
            {error && <p className="onb-error">{error}</p>}
            <div className="onb-actions">
              <button className="btn-ghost" disabled={busy} onClick={() => { setFirstTask(''); finish() }}>Skip</button>
              <button className="btn-primary" disabled={busy || !firstTask.trim()} onClick={finish}>
                {busy ? 'Setting up…' : 'Start'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
