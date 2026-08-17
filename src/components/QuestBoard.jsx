import { useState } from 'react'
import { useGarden } from '../context/GardenContext'
import Trak from './Trak'
import './QuestBoard.css'

// Trak's three quests for the day.
//
// The rewards have to be claimed rather than paid automatically: an amount
// that lands silently while you're on another page isn't a reward. So a
// finished quest sits here with its button lit, and Trak says so from the
// board's greenhouse strip.

function line(quests) {
  const claimable = quests.filter(q => q.claimable).length
  const done = quests.filter(q => q.claimed).length
  if (claimable) return `${claimable === 1 ? 'One of these is' : `${claimable} of these are`} finished — come and get paid.`
  if (done === quests.length) return 'All three, done and paid. Nothing more from me until tomorrow.'
  if (done) return 'Good. Here’s what’s left.'
  return 'Three things for today. They reset at midnight, so there’s no saving them up.'
}

export default function QuestBoard() {
  const { quests, claimQuest } = useGarden()
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState('')

  async function claim(key) {
    setBusy(key)
    setError('')
    try { await claimQuest(key) }
    catch (e) { setError(e?.message || String(e)) }
    finally { setBusy(null) }
  }

  const anyClaimable = quests.some(q => q.claimable)

  return (
    <div className="quest-board">
      <div className="quest-intro">
        <Trak mood={anyClaimable ? 'happy' : 'think'} size={96} pettable />
        <div>
          <p className="quest-hello">Trak has work for you</p>
          <p className="quest-line">{line(quests)}</p>
        </div>
      </div>

      {error && <p className="quest-error">{error}</p>}

      <div className="quest-grid">
        {quests.map(q => (
          <div key={q.key} className={`quest-card${q.claimed ? ' claimed' : ''}${q.claimable ? ' ready' : ''}`}>
            <span className="quest-icon" aria-hidden="true">{q.icon}</span>
            <div className="quest-body">
              <p className="quest-tier">{q.reward.label}</p>
              <p className="quest-name">{q.name}</p>
              <p className="quest-blurb">{q.blurb}</p>

              <div className="quest-bar"><span style={{ width: `${q.pct}%` }} /></div>
              <p className="quest-count">{q.value} / {q.goal}</p>
            </div>

            <div className="quest-pay">
              <span className="quest-reward">
                {q.reward.coins} 🪙{q.reward.seeds ? ` · ${q.reward.seeds} 🌱` : ''}
              </span>
              {q.claimed ? (
                <span className="quest-done">Claimed</span>
              ) : (
                <button
                  className="btn-primary btn-sm"
                  disabled={!q.claimable || busy === q.key}
                  onClick={() => claim(q.key)}
                >
                  {busy === q.key ? '…' : 'Claim'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <p className="quest-note">
        Quest payouts sit outside the daily caps — the caps are there to stop a cheap
        action being farmed, and a quest is already limited to three a day.
      </p>
    </div>
  )
}
