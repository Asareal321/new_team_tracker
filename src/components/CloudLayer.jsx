import { useRef, useState } from 'react'
import { CLOUD_MAX_TAPS, cloudTier, rollCloudGrowth, formatDuration } from '../lib/garden'
import './CloudLayer.css'

// The rain cloud you get for finishing a task. It arrives front and centre;
// each of four taps *might* bump it up the rarity ladder — sometimes by more
// than one tier — and the tier it ends on is what gets shaved off your growing
// flower. There's no timer: it waits as long as you like. Only one is shown at
// a time; extras queue behind it so each gets the centre of the screen.
export default function CloudLayer({ clouds, onPop }) {
  const [toasts, setToasts] = useState([])
  const cloud = clouds[0]

  function showToast(reward) {
    if (!reward) return
    const toast = {
      id: crypto.randomUUID(),
      text: reward.type === 'shave'
        ? `−${formatDuration(reward.amount)} grow time`
        : `+${reward.amount} coins`,
    }
    setToasts(prev => [...prev, toast])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== toast.id)), 2600)
  }

  if (!cloud && !toasts.length) return null

  return (
    <div className={`cloud-layer${cloud ? ' active' : ''}`}>
      {cloud && (
        <Cloud
          key={cloud.id}
          onPop={async tier => showToast(await onPop(cloud.id, tier))}
        />
      )}
      <div className="cloud-toasts">
        {toasts.map(t => <div key={t.id} className="cloud-toast">{t.text}</div>)}
      </div>
    </div>
  )
}

function Cloud({ onPop }) {
  const [tier, setTier] = useState(1)
  const [taps, setTaps] = useState(0)
  const [bursting, setBursting] = useState(false)
  // `n` bumps on every tap so remounting restarts the CSS animation; `type`
  // says whether the roll grew the cloud or fizzled.
  const [anim, setAnim] = useState({ n: 0, type: null, gain: 0 })
  // Taps and tier are mirrored in refs: fast tapping fires several handlers
  // before React re-renders, and reading the state values there would be stale.
  const tierRef = useRef(1)
  const tapsRef = useRef(0)
  const settled = useRef(false)

  const info = cloudTier(tier)
  const tapsLeft = CLOUD_MAX_TAPS - taps

  function settle(finalTier) {
    if (settled.current) return
    settled.current = true
    setBursting(true)
    setTimeout(() => onPop(finalTier), 380)
  }

  function handleTap() {
    if (settled.current) return
    const nextTaps = tapsRef.current + 1
    const nextTier = rollCloudGrowth(tierRef.current)
    const gain = nextTier - tierRef.current
    tapsRef.current = nextTaps
    tierRef.current = nextTier
    setTaps(nextTaps)
    setTier(nextTier)
    setAnim({ n: nextTaps, type: gain >= 2 ? 'leap' : gain === 1 ? 'grow' : 'wobble', gain })
    if (nextTaps >= CLOUD_MAX_TAPS) settle(nextTier)
  }

  return (
    // The tier vars and data-tier live on the stage, not the button, so the
    // full-viewport backdrop sheen (.cloud-stage::before) can be tinted to
    // match whatever the cloud has grown into.
    <div
      className="cloud-stage"
      data-tier={tier}
      style={{ '--tier-color': info.color, '--tier-glow': info.glow }}
    >
      <button
        className={`cloud-drop${bursting ? ' bursting' : ''}`}
        onClick={handleTap}
        aria-label={`${info.name} rain cloud — tap to grow it, ${tapsLeft} taps left`}
      >
        {/* Tap affordance: stops once the interaction is clearly understood. */}
        {taps === 0 && (
          <span className="cloud-ring-set" aria-hidden="true">
            <span className="cloud-ring" />
            <span className="cloud-ring cloud-ring-2" />
          </span>
        )}
        <span className="cloud-art" key={anim.n} data-anim={anim.type || undefined}>
          <span className="puff puff-a" />
          <span className="puff puff-b" />
          <span className="puff puff-c" />
          <span className="cloud-base" />
          {/* The humble tiers get drifting wisps so they aren't lifeless, then
              hand off to rain and lightning as the ladder climbs. */}
          {tier <= 2 && (
            <span className="cloud-wisps">
              {Array.from({ length: 3 }, (_, i) => <span key={i} className="wisp" style={{ '--i': i }} />)}
            </span>
          )}
          {tier >= 2 && (
            <span className="cloud-rain">
              {Array.from({ length: tier >= 4 ? 7 : 5 }, (_, i) => <span key={i} className="drop" style={{ '--i': i }} />)}
            </span>
          )}
          {tier >= 4 && <span className="cloud-bolt">⚡</span>}
          {tier >= 5 && <span className="cloud-aura" />}
          {tier >= 5 && (
            <span className="cloud-sparkles">
              {Array.from({ length: 6 }, (_, i) => <span key={i} className="spark" style={{ '--i': i }} />)}
            </span>
          )}
        </span>
        {/* A tap that vaulted more than one tier deserves to be shouted about. */}
        {anim.gain >= 2 && <span className="cloud-leap" key={`leap-${anim.n}`}>+{anim.gain} tiers!</span>}
      </button>

      <div className="cloud-meta">
        <span className="cloud-rarity">{info.name}</span>
        <span className="cloud-reward">−{info.shaveMinutes} min grow time</span>
        <div className="cloud-taps">
          {Array.from({ length: CLOUD_MAX_TAPS }, (_, i) => (
            <span key={i} className={`tap-pip${i < taps ? ' used' : ''}`} />
          ))}
        </div>
        <span className="cloud-hint">
          {taps === 0 ? 'Tap it — each tap might grow it' : tapsLeft > 0 ? `${tapsLeft} tap${tapsLeft === 1 ? '' : 's'} left` : 'Bursting!'}
        </span>
        {/* With no timer the cloud would otherwise sit over the page forever,
            so there's an explicit way out that still banks what you've got. */}
        {tapsLeft > 0 && (
          <button className="cloud-collect" onClick={() => settle(tierRef.current)}>
            Collect now
          </button>
        )}
      </div>
    </div>
  )
}
