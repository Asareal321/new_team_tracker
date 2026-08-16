import './RewardToasts.css'

// Rewards now fire on the board, not in the garden — a seed for writing a task
// down, coins for clearing Doing, an achievement at any moment. Without
// something on screen those would be silent changes to numbers on another tab.
// Rendered by GardenProvider so they reach every page.
export default function RewardToasts({ notices }) {
  if (!notices.length) return null
  return (
    <div className="reward-toasts" role="status" aria-live="polite">
      {notices.map(n => (
        <div key={n.id} className={`reward-toast kind-${n.kind}`}>
          {n.kind === 'achievement' && <span className="reward-toast-tag">Achievement</span>}
          <span className="reward-toast-text">{n.text}</span>
        </div>
      ))}
    </div>
  )
}
