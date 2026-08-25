import { RARITY_COLORS, RARITY_NAMES } from '../lib/garden'
import './FlowerMenu.css'

// What a planted flower can do, on tapping it.
//
// The bed used to carry this itself: a name that appeared on hover and two
// buttons crammed into the foot of a tile that is 112px at best. Hover is not
// a thing a phone has, the labels had to be dropped below 96px, and the whole
// arrangement spent the bed's own space on chrome for something you do rarely.
//
// So the bed goes back to being a bed — soil and a bloom — and everything else
// happens here, where there is room to show the flower properly and to say
// what each action actually does.
export default function FlowerMenu({ seed, onList, onCompost, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="fm-card"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={seed.name}
        style={{ '--rarity': RARITY_COLORS[seed.rarity] }}
      >
        <div className="fm-stage">
          <span className="fm-bloom" aria-hidden="true">{seed.emoji}</span>
        </div>

        <h3 className="fm-name">{seed.name}</h3>
        <p className="fm-rarity">{RARITY_NAMES[seed.rarity]}</p>

        <div className="fm-actions">
          <button className="fm-btn fm-primary" onClick={onList}>
            Put it on the market
            <small>You set the price. It waits there until someone buys it.</small>
          </button>
          <button className="fm-btn fm-danger" onClick={onCompost}>
            Compost it
            <small>Gone for good — nothing comes back.</small>
          </button>
        </div>

        <button className="fm-close" onClick={onClose}>Leave it in the garden</button>
      </div>
    </div>
  )
}
