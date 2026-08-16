import { DAILY_CAPS, todayBucket } from '../lib/garden'

// Today's three allowances, shown as chips on the board's greenhouse strip.
// They belong next to the work that earns them: every one of these is spent by
// something you do on the board, so a cap discovered only by visiting the
// garden reads as an unexplained refusal.
//
// The strip has to stay short — it sits above the bands, and the bands are the
// page. So each allowance is one chip rather than a labelled meter, and the
// two things that explain it (what earns it, and when it resets) live in the
// chip's tooltip. Both are true every day, which makes them news on none.

const CAPS = [
  { key: 'seeds',  icon: '🌱', noun: 'seeds',  earns: 'Seeds come from adding tasks.' },
  { key: 'coins',  icon: '🪙', noun: 'coins',  earns: 'Coins come from clearing the Doing band.' },
  { key: 'clouds', icon: '☁️', noun: 'clouds', earns: 'Clouds come from finishing tasks. Finishing past the cap still counts toward your streak and your awards.' },
]

const RESET = 'Resets at midnight.'

export default function DailyCaps({ state }) {
  // A bucket from an earlier day counts as zero, so the caps roll over at the
  // user's own midnight without anything having to reset them.
  const daily = todayBucket(state?.daily)

  return (
    <>
      {CAPS.map(({ key, icon, noun, earns }) => {
        const cap = DAILY_CAPS[key]
        const used = daily[key] || 0
        const left = Math.max(0, cap - used)
        return (
          <span
            key={key}
            className={`gh-chip cap${left === 0 ? ' spent' : ''}`}
            title={`${left.toLocaleString()} of ${cap.toLocaleString()} ${noun} left today. ${earns} ${RESET}`}
          >
            <span aria-hidden="true">{icon}</span>
            {left === 0
              ? `no ${noun} left`
              : `${left.toLocaleString()}/${cap.toLocaleString()} left`}
          </span>
        )
      })}
    </>
  )
}
