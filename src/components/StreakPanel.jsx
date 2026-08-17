import { useEffect, useState } from 'react'
import { streakWeek } from '../lib/streak'
import './StreakPanel.css'

// "Streak continued" — the panel from the Streak Continued design.
//
// Unlike the pack opening and the fully-grown cinematic, this is authored
// entirely in CSS keyframes with staggered delays, exactly as the design is.
// There is no rAF runtime here because nothing needs one: every element plays a
// single entrance and then sits still, so the browser can own the whole
// sequence and React renders once.
//
// Departures from the source composition:
//
//  * The design's day strip is a fixed M–S with every day ticked. trakkit
//    doesn't store per-day history, so the strip is the last seven calendar
//    days ending today and only the days this run covers are ticked (see
//    lib/streak.js). A row of seven ticks on a two-day streak would be a
//    picture of someone else's fortnight.
//  * The milestone banner unlocks a named seed in the design. Here it hands
//    over a packet, because trakkit's seeds come out of packets — announcing a
//    species would promise something the shop doesn't sell.
//  * The design's coin swarm flies to a rail counter that trakkit doesn't have
//    on this screen. The coins fly outward with the confetti instead.

// Deterministic scatter — the same panel twice should look the same, and
// Math.random() in a render is a re-render away from reshuffling itself.
function rand(i) {
  const x = Math.sin(i * 127.1 + 9.7) * 43758.5453
  return x - Math.floor(x)
}

function Burst({ milestone }) {
  const palette = milestone
    ? [['#DC8818', '#894C06'], ['#90D94F', '#3E8637'], ['#89582C', '#653C1F'], ['#FEFCF7', '#D9D0C1']]
    : [['#90D94F', '#3E8637'], ['#89582C', '#653C1F'], ['#D3EEB4', '#9FCC77'], ['#DC8818', '#894C06']]
  const count = milestone ? 46 : 34

  const chips = []
  for (let i = 0; i < count; i++) {
    const a = rand(i) * Math.PI * 2
    const dist = 200 + rand(i + 50) * 320
    const [bg, edge] = palette[i % palette.length]
    const w = 9 + Math.round(rand(i + 90) * 9)
    chips.push(
      <span
        key={`c${i}`}
        className="sp-chip"
        style={{
          width: w,
          height: rand(i + 20) > 0.5 ? w : Math.round(w * 2.1),
          background: bg,
          border: `1px solid ${edge}`,
          borderRadius: rand(i + 30) > 0.6 ? 9999 : 2,
          '--dx': `${Math.cos(a) * dist}px`,
          '--dy': `${Math.sin(a) * dist - 40}px`,
          '--rot': `${Math.round(-260 + rand(i + 70) * 520)}deg`,
          animationDuration: `${900 + Math.round(rand(i + 11) * 500)}ms`,
          animationDelay: `${740 + Math.round(rand(i + 5) * 260)}ms`,
        }}
      />
    )
  }
  for (let i = 0; i < 6; i++) {
    chips.push(
      <span
        key={`coin${i}`}
        className="sp-coin-fly"
        style={{
          '--mx': `${-90 + i * 36}px`,
          '--my': '-40px',
          '--dx': `${Math.cos(0.7 + i) * 420}px`,
          '--dy': `${Math.sin(0.7 + i) * 260 + 180}px`,
          animationDelay: `${1180 + i * 80}ms`,
        }}
      />
    )
  }
  return <span className="sp-burst" aria-hidden="true">{chips}</span>
}

export default function StreakPanel({ streak, prevStreak, coins, totalCoins, packet, onDismiss }) {
  const milestone = !!packet
  const week = streakWeek(streak)
  // Remounting the whole tree restarts every CSS animation, which is what
  // Replay means here.
  const [take, setTake] = useState(0)

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onDismiss() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onDismiss])

  return (
    <div className="sp-overlay" role="dialog" aria-modal="true" aria-label={`Streak continued — ${streak} days`}>
      <div className="sp-scrim" />

      <div className="sp-card" key={take}>
        <span className="sp-sheen" aria-hidden="true" />

        <span className="sp-eyebrow">
          {milestone ? `Streak continued · day ${streak}` : 'Streak continued'}
        </span>

        <div className="sp-headline">
          {/* The flame: three nested teardrops that ignite in sequence, then
              flicker on their own timings so the shape never settles. */}
          <div className="sp-flame" aria-hidden="true">
            <span className="sp-spark sp-spark-1" />
            <span className="sp-spark sp-spark-2" />
            <span className="sp-flame-outer" />
            <span className="sp-flame-mid" />
            <span className="sp-flame-core" />
            <span className="sp-flame-ring" />
          </div>

          {/* An odometer: yesterday's number sits above today's and the column
              rolls up to it. */}
          <div className="sp-odometer">
            <div className="sp-roll">
              <span className="sp-num">{prevStreak}</span>
              <span className="sp-num">{streak}</span>
            </div>
          </div>

          <span className="sp-days">days in a row</span>
        </div>

        <p className="sp-blurb">
          {milestone
            ? `${streak} days without dropping the board. The garden noticed.`
            : 'Another day on the board. The streak holds.'}
        </p>

        <div className="sp-week">
          {week.map((d, i) => (
            <span
              key={d.key}
              className={`sp-day${d.done ? ' on' : ''}${d.today ? ' today' : ''}`}
              style={{ animationDelay: `${380 + i * 70}ms` }}
            >
              <span className="sp-day-letter">{d.letter}</span>
              <span className="sp-day-mark">{d.done ? '✓' : '·'}</span>
              {d.today && d.done && (
                <span className="sp-day-ring" style={{ animationDelay: `${500 + i * 70}ms` }} />
              )}
            </span>
          ))}
        </div>

        <div className="sp-coins">
          <span className="sp-coin" aria-hidden="true">c</span>
          <span className="sp-coin-amount">+{coins.toLocaleString()} coins</span>
          <span className="sp-coin-total">banked · {totalCoins.toLocaleString()} total</span>
        </div>

        {milestone && (
          <div className="sp-milestone">
            <span className="sp-milestone-icon" aria-hidden="true">{packet.emoji}</span>
            <span className="sp-milestone-text">
              <span className="sp-milestone-title">{packet.name} earned</span>
              <span className="sp-milestone-sub">It’s in your tray — open it in the greenhouse.</span>
            </span>
          </div>
        )}

        <div className="sp-actions">
          <button className="sp-btn primary" onClick={onDismiss} autoFocus>Keep it going</button>
          <button className="sp-btn" onClick={() => setTake(t => t + 1)}>Replay</button>
        </div>
      </div>

      <Burst key={`b${take}`} milestone={milestone} />
    </div>
  )
}
