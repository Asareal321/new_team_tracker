import { useState } from 'react'
import { SEEDS } from '../lib/garden'
import { STREAK_MILESTONES, streakCoins } from '../lib/streak'
import { PHASES } from '../lib/daylight'
import Onboarding from './Onboarding'
import './DevPanel.css'

// Developer tools, gated to the accounts in VITE_DEV_EMAIL. Previews never
// write to Supabase. The garden shortcuts DO write, because there's no way to
// reach those states otherwise; they're marked as such.
// Both ends of the curve, every milestone, and the day after the last one —
// the payout flattens there, and a preview that never shows the flat part
// hides the only surprising thing about the numbers.
const STREAK_PREVIEWS = [1, 2, 3, 7, 12, 30, 100, 200]

export default function DevPanel({
  state,
  onClose,
  onAddCoins, onUnlockAll, onReset,
  onResetOnboarding, onResetQuests, onCompleteQuests, onShowStreak,
}) {
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  // 'setup' | 'replay' | null. A previewed tour writes nothing: its onFinish
  // just closes it, so the steps and their copy can be read through without
  // planting a seed or creating a project every time.
  const [preview, setPreview] = useState(null)

  async function run(fn) {
    setError('')
    setBusy(true)
    try {
      await fn()
    } catch (e) {
      setError(e?.message || String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="devpanel">
      <header className="dev-head">
        <span className="dev-title">Dev tools</span>
        <button className="dev-x" onClick={onClose} aria-label="Close dev panel">✕</button>
      </header>

      {error && <p className="dev-error">{error}</p>}

      <section className="dev-section">
        <h4>Garden <span className="dev-note warn">writes to your real garden</span></h4>
        <p className="dev-state">
          {state ? `${state.coins} coins · ${Object.values(state.seed_inventory || {}).reduce((a, b) => a + b, 0)} seeds in the bag of ${SEEDS.length} kinds` : 'no state'}
        </p>
        <div className="dev-row">
          <button className="dev-btn" disabled={busy} onClick={() => run(() => onAddCoins(500))}>+500 coins</button>
          <button className="dev-btn" disabled={busy} onClick={() => run(() => onUnlockAll())}>Unlock seeds</button>
        </div>
        <button
          className="dev-btn danger"
          disabled={busy}
          onClick={() => {
            if (window.confirm('Reset the garden? This deletes every planted flower and zeroes your coins.')) run(() => onReset())
          }}
        >
          Reset garden
        </button>
      </section>

      <section className="dev-section">
        <h4>Garden sky <span className="dev-note">preview · never saves</span></h4>
        <p className="dev-hint">
          The garden lights itself from the local clock. These pin it with ?sky= so the
          other three can be seen without waiting for evening.
        </p>
        <div className="dev-grid four">
          {PHASES.map(p => (
            <button
              key={p.key}
              className="dev-btn"
              onClick={() => window.location.assign(`/garden?sky=${p.key}`)}
              title={`${p.label} — ${p.from}:00 to ${p.to}:00`}
            >{p.label}</button>
          ))}
        </div>
        <button className="dev-btn subtle" onClick={() => window.location.assign('/garden')}>
          Back to the real hour
        </button>
      </section>

      <section className="dev-section">
        <h4>Streak panel <span className="dev-note">preview · never saves</span></h4>
        <p className="dev-hint">
          It fires on the first task you finish each day, so this is the only way to
          watch it twice. Each day below rolls the odometer from the one before it;
          the marked ones pay a packet.
        </p>
        <div className="dev-grid four">
          {STREAK_PREVIEWS.map(d => (
            <button
              key={d}
              className="dev-btn"
              onClick={() => onShowStreak(d)}
              title={STREAK_MILESTONES[d]
                ? `Day ${d} — milestone, pays the ${STREAK_MILESTONES[d]} packet`
                : `Day ${d} — ordinary, pays ${streakCoins(d)} coins`}
            >
              day {d}{STREAK_MILESTONES[d] ? ' ★' : ''}
            </button>
          ))}
        </div>
      </section>

      <section className="dev-section">
        <h4>Onboarding <span className="dev-note">preview writes nothing</span></h4>
        <p className="dev-hint">
          Preview walks the steps without saving. Reset clears the onboarded flag and the
          growing slot, so the real first run — seed, project, first task — happens again
          the next time the board loads.
        </p>
        <div className="dev-row">
          <button className="dev-btn" onClick={() => setPreview('setup')}>Preview first run</button>
          <button className="dev-btn" onClick={() => setPreview('replay')}>Preview replay</button>
        </div>
        <button
          className="dev-btn danger"
          disabled={busy}
          onClick={() => {
            if (!window.confirm('Reset first run? Anything currently growing is cleared.')) return
            run(async () => { await onResetOnboarding(); window.location.assign('/') })
          }}
        >
          Reset first run <span className="dev-note warn">writes</span>
        </button>
      </section>

      <section className="dev-section">
        <h4>Quests <span className="dev-note warn">writes to your real garden</span></h4>
        <p className="dev-hint">
          Complete fills today's counters past every goal so the claim path can be
          exercised; reset clears today's claims so the same three can be claimed again.
        </p>
        <div className="dev-row">
          <button className="dev-btn" disabled={busy} onClick={() => run(() => onCompleteQuests())}>Complete today's</button>
          <button className="dev-btn" disabled={busy} onClick={() => run(() => onResetQuests())}>Reset claims</button>
        </div>
      </section>

      {preview && (
        <Onboarding
          mode={preview}
          displayName="Dev"
          onClose={() => setPreview(null)}
          onFinish={async () => setPreview(null)}
        />
      )}

      <footer className="dev-foot">Ctrl/Cmd + Shift + D toggles this panel</footer>
    </div>
  )
}
