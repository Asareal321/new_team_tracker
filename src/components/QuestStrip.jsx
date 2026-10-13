import { useState } from 'react'
import { useGarden } from '../context/GardenContext'
import './QuestStrip.css'

// Trak's three quests, on the Today page — where the logging that satisfies
// them happens. They used to live on the board for the same reason: making you
// visit the garden to read them put the rules in a different room from the work.
//
// Because this is the only place they appear, it has to explain them — what
// each one asks, what it pays, when they change, and why the payout doesn't
// count against the day's caps.
function questLine(quests) {
  const claimable = quests.filter(q => q.claimable).length
  const claimed = quests.filter(q => q.claimed).length
  if (claimable) return `${claimable === 1 ? 'One is' : `${claimable} are`} finished — collect below.`
  if (claimed === quests.length) return 'All three done and paid. New ones at midnight.'
  if (claimed) return 'Good. Here’s what’s left of today’s three.'
  return 'Three a day, drawn from the date — everyone gets the same three.'
}

export default function QuestStrip() {
  const { quests, claimQuest, ready, missingColumns } = useGarden()
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState('')

  if (!ready || !quests?.length) return null

  // Claims are recorded in garden_state.quests. Without that column a claim
  // would pay out and not be recorded, so the button is off rather than
  // failing on press — and the strip says what to run, since "could not find
  // the 'quests' column in the schema cache" is a message for whoever owns the
  // database, not for whoever is looking at a rabbit.
  const unmigrated = missingColumns?.includes('quests')

  async function claim(key) {
    setBusy(key)
    setError('')
    try { await claimQuest(key) }
    catch (e) { setError(e?.message || String(e)) }
    finally { setBusy(null) }
  }

  return (
    <section className="quest-strip">
      <div className="qs-head">
        <span className="qs-rabbit" aria-hidden="true">🐇</span>
        <span className="qs-title">Trak’s quests</span>
        <span className="qs-line">{questLine(quests)}</span>
      </div>

      {unmigrated ? (
        <p className="qs-error">
          Quests can’t be collected yet — the garden’s database is missing its
          <code> quests </code> column. Run <code>migration-garden-quests.sql</code> in the
          Supabase SQL editor, then reload. Progress below still counts.
        </p>
      ) : error ? (
        <p className="qs-error">{error}</p>
      ) : null}

      <div className="qs-list">
        {quests.map(q => (
          <div key={q.key} className={`qs-item${q.claimed ? ' done' : ''}${q.claimable ? ' ready' : ''}`}>
            <span className="qs-icon" aria-hidden="true">{q.icon}</span>
            <div className="qs-body">
              <p className="qs-name">{q.name}</p>
              {/* The rule, stated. A quest you have to infer from a name and a
                  fraction is a puzzle rather than a task. */}
              <p className="qs-blurb">{q.blurb}</p>
              <div className="qs-track">
                <span className="qs-bar"><span style={{ width: `${q.pct}%` }} /></span>
                <span className="qs-count">{q.value}/{q.goal}</span>
              </div>
            </div>
            <div className="qs-pay">
              <span className="qs-reward">
                {q.reward.coins} 🪙{q.reward.seeds ? ` · ${q.reward.seeds} 🌱` : ''}
              </span>
              {q.claimed ? (
                <span className="qs-state">Claimed</span>
              ) : (
                <button
                  className="qs-claim"
                  disabled={!q.claimable || unmigrated || busy === q.key}
                  title={unmigrated ? 'Needs migration-garden-quests.sql' : undefined}
                  onClick={() => claim(q.key)}
                >
                  {busy === q.key ? '…' : 'Claim'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <p className="qs-foot">
        All three change at midnight and nothing carries over. What they pay is on top of
        your daily caps — a quest can only be done once a day, so there’s nothing to farm.
      </p>
    </section>
  )
}
