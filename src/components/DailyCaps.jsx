import { DAILY_CAPS, todayBucket, liveStreak } from '../lib/garden'
import './DailyCaps.css'

// Today's three allowances and the streak, shown on the board's greenhouse
// strip. They belong next to the work that earns them: every one of these is
// spent by something you do on the board, so a cap discovered only by visiting
// the garden reads as an unexplained refusal.

// One allowance. Shows what's LEFT rather than what's been used — "6 seeds
// left today" is the number you act on.
function CapMeter({ icon, label, used, cap }) {
  const left = Math.max(0, cap - used)
  const pct = Math.min(100, (used / cap) * 100)
  return (
    <div className={`cap-meter${left === 0 ? ' spent' : ''}`}>
      <div className="cap-head">
        <span className="cap-icon" aria-hidden="true">{icon}</span>
        <span className="cap-label">{label}</span>
      </div>
      <div className="cap-bar"><span style={{ width: `${pct}%` }} /></div>
      <span className="cap-left">
        {left === 0 ? 'All used for today' : `${left.toLocaleString()} of ${cap.toLocaleString()} left`}
      </span>
    </div>
  )
}

export default function DailyCaps({ state }) {
  // A bucket from an earlier day counts as zero, so the caps roll over at the
  // user's own midnight without anything having to reset them.
  const daily = todayBucket(state?.daily)
  const streak = liveStreak(state?.streak)
  const best = state?.streak?.best || 0

  return (
    <div className="daily-caps">
      <span className="caps-title">Today</span>
      <div className="cap-row">
        <CapMeter icon="🌱" label="Seeds from adding tasks"    used={daily.seeds}  cap={DAILY_CAPS.seeds} />
        <CapMeter icon="🪙" label="Coins from clearing Doing"  used={daily.coins}  cap={DAILY_CAPS.coins} />
        <CapMeter icon="☁️" label="Clouds from finished tasks" used={daily.clouds} cap={DAILY_CAPS.clouds} />
      </div>
      <p className="caps-note">
        Caps reset at midnight. Finishing tasks past the cloud cap still counts
        toward your streak and your awards.
      </p>
      <p className="caps-streak">
        <span aria-hidden="true">{streak > 0 ? '🔥' : '🌑'}</span>
        {streak > 0
          ? 'Finish at least one task tomorrow to keep the streak going.'
          : 'Finish a task today to start a streak.'}
        {best > 0 && ` Best: ${best} ${best === 1 ? 'day' : 'days'}.`}
      </p>
    </div>
  )
}
