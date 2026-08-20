import { DAILY_CAPS, todayBucket } from '../lib/garden'
import { capState } from '../lib/dailyCaps'

// Today's allowances, shown on the board's greenhouse strip — but only while
// one of them is nearly gone.
//
// They belong next to the work that earns them: every one is spent by
// something you do on the board, so a cap discovered only by visiting the
// garden reads as an unexplained refusal. That argument is about the moment a
// cap *bites*, though, and these used to render permanently: three chips
// saying "9/12 left", "210/300 left", "7/10 left" all day. This file already
// said as much about the tooltips — both facts are "true every day, which
// makes them news on none" — and the chips had the same problem.
//
// On a phone that mattered twice over. Six chips wanted 495px in a 217px
// column and wrapped to three rows, which put the strip at 221px before a
// single task was visible.
//
// So a cap is silent until it's worth saying. Below a quarter left it appears,
// tinted; at zero it says so plainly, which is the only moment it has ever
// been news. The full numbers stay in the tooltip and in the garden.

const CAPS = [
  { key: 'seeds',  icon: '🌱', noun: 'seeds',  earns: 'Seeds come from adding tasks.' },
  // Coins moved to task creation when the Doing-clear payout was removed;
  // this line described a mechanic that no longer exists.
  { key: 'coins',  icon: '🪙', noun: 'coins',  earns: 'Coins come from adding tasks, and from the clouds finished tasks bring.' },
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
        const left = Math.max(0, cap - (daily[key] || 0))
        const status = capState(left, cap)
        if (status === 'hidden') return null
        return (
          <span
            key={key}
            className={`gh-chip cap ${status}`}
            title={`${left.toLocaleString()} of ${cap.toLocaleString()} ${noun} left today. ${earns} ${RESET}`}
          >
            <span aria-hidden="true">{icon}</span>
            {status === 'spent'
              ? `no ${noun} left today`
              : `${left.toLocaleString()}/${cap.toLocaleString()} ${noun} left`}
          </span>
        )
      })}
    </>
  )
}
