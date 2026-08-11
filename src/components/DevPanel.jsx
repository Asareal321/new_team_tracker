import { useState } from 'react'
import { CLOUD_TIERS, SEEDS, seedByKey, remainingSeconds, formatDuration } from '../lib/garden'
import './DevPanel.css'

// Developer tools, gated to the accounts in VITE_DEV_EMAIL. Cloud controls are
// preview-only — they never write to Supabase — so animations can be inspected
// without inflating a real garden. The garden shortcuts below DO write, because
// there's no way to reach those states otherwise; they're marked as such.
export default function DevPanel({
  state, cloud, log,
  onClose, onSpawn, onReplay,
  onAddCoins, onUnlockAll, onFinishGrowth, onReset, onClearLog,
}) {
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

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

  const growing = seedByKey(state?.growing_seed)
  const remaining = remainingSeconds(state)

  return (
    <div className="devpanel">
      <header className="dev-head">
        <span className="dev-title">Dev tools</span>
        <button className="dev-x" onClick={onClose} aria-label="Close dev panel">✕</button>
      </header>

      {error && <p className="dev-error">{error}</p>}

      <section className="dev-section">
        <h4>Spawn cloud <span className="dev-note">preview · never saves</span></h4>
        <div className="dev-grid">
          {CLOUD_TIERS.map(t => (
            <button
              key={t.tier}
              className="dev-btn tier"
              style={{ '--tier-color': t.color }}
              onClick={() => onSpawn(t.tier)}
              title={`Spawn at ${t.name} — ${t.shaveMinutes} min, ${(t.growChance * 100).toFixed(0)}% to grow`}
            >
              {t.name}
            </button>
          ))}
        </div>
      </section>

      <section className="dev-section">
        <h4>Replay animation</h4>
        {!cloud && <p className="dev-hint">Spawn a cloud first.</p>}
        <div className="dev-row">
          {['grow', 'leap', 'wobble', 'burst'].map(type => (
            <button key={type} className="dev-btn" disabled={!cloud} onClick={() => onReplay(type)}>
              {type}
            </button>
          ))}
        </div>
      </section>

      <section className="dev-section">
        <h4>Roll log</h4>
        {!log.length && <p className="dev-hint">Tap a cloud to see what each tap rolled.</p>}
        {log.length > 0 && (
          <>
            <ul className="dev-log">
              {log.map((entry, i) => (
                <li key={`${entry.at}-${i}`} className={entry.gain ? 'hit' : 'miss'}>
                  <span className="dev-log-tap">tap {entry.tap}</span>
                  <span>
                    {CLOUD_TIERS[entry.from - 1].name} → {CLOUD_TIERS[entry.to - 1].name}
                  </span>
                  <span className="dev-log-gain">{entry.gain ? `+${entry.gain}` : 'no change'}</span>
                </li>
              ))}
            </ul>
            <button className="dev-btn subtle" onClick={onClearLog}>Clear log</button>
          </>
        )}
      </section>

      <section className="dev-section">
        <h4>Garden <span className="dev-note warn">writes to your real garden</span></h4>
        <p className="dev-state">
          {state ? `${state.coins} coins · ${state.plot_count} beds · rarity ${state.unlocked_rarity}/${SEEDS.length}` : 'no state'}
          {growing && ` · growing ${growing.name} (${formatDuration(remaining)})`}
        </p>
        <div className="dev-row">
          <button className="dev-btn" disabled={busy} onClick={() => run(() => onAddCoins(500))}>+500 coins</button>
          <button className="dev-btn" disabled={busy} onClick={() => run(() => onUnlockAll())}>Unlock seeds</button>
          <button className="dev-btn" disabled={busy || !growing} onClick={() => run(() => onFinishGrowth())}>Finish growth</button>
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

      <footer className="dev-foot">Ctrl/Cmd + Shift + D toggles this panel</footer>
    </div>
  )
}
