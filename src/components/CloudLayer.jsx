import { useEffect, useRef, useState } from 'react'
import {
  CLOUD_MAX_TAPS, CLOUD_LIFETIME_MS, cloudTier, rollCloudGrowth, formatDuration,
} from '../lib/garden'
import './CloudLayer.css'

// The rain cloud you get for finishing a task. It arrives front and centre;
// tapping it *might* bump it up a rarity tier, and the tier it ends on is what
// gets shaved off your growing flower. Only one is shown at a time — extras
// queue behind it so each gets the centre of the screen.
export default function CloudLayer({ clouds, onPop, onExpire }) {
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
          onExpire={() => onExpire(cloud.id)}
        />
      )}
      <div className="cloud-toasts">
        {toasts.map(t => <div key={t.id} className="cloud-toast">{t.text}</div>)}
      </div>
    </div>
  )
}

function Cloud({ onPop, onExpire }) {
  const [tier, setTier] = useState(1)
  const [taps, setTaps] = useState(0)
  const [bursting, setBursting] = useState(false)
  // `n` bumps on every tap so remounting restarts the CSS animation; `type`
  // says whether the roll grew the cloud or fizzled.
  const [anim, setAnim] = useState({ n: 0, type: null })
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

  // The cloud drifts off on its own. Whatever tier it reached still pays out —
  // walking away entirely is the only way to get nothing.
  useEffect(() => {
    const timer = setTimeout(() => {
      if (settled.current) return
      settled.current = true
      onExpire()
    }, CLOUD_LIFETIME_MS)
    return () => clearTimeout(timer)
  }, [onExpire])

  function handleTap() {
    if (settled.current) return
    const nextTaps = tapsRef.current + 1
    const nextTier = rollCloudGrowth(tierRef.current)
    const grew = nextTier !== tierRef.current
    tapsRef.current = nextTaps
    tierRef.current = nextTier
    setTaps(nextTaps)
    setTier(nextTier)
    setAnim(a => ({ n: a.n + 1, type: grew ? 'grow' : 'wobble' }))
    if (nextTaps >= CLOUD_MAX_TAPS) settle(nextTier)
  }

  return (
    <div className="cloud-stage">
      <button
        className={`cloud-drop${bursting ? ' bursting' : ''}`}
        data-tier={tier}
        style={{ '--tier-color': info.color, '--tier-glow': info.glow }}
        onClick={handleTap}
        aria-label={`${info.name} rain cloud — tap to grow it, ${tapsLeft} taps left`}
      >
        <span className="cloud-art" key={anim.n} data-anim={anim.type || undefined}>
          <span className="puff puff-a" />
          <span className="puff puff-b" />
          <span className="puff puff-c" />
          <span className="cloud-base" />
          {tier >= 2 && (
            <span className="cloud-rain">
              {Array.from({ length: tier >= 4 ? 7 : 4 }, (_, i) => <span key={i} className="drop" style={{ '--i': i }} />)}
            </span>
          )}
          {tier >= 4 && <span className="cloud-bolt">⚡</span>}
          {tier >= 5 && (
            <span className="cloud-sparkles">
              {Array.from({ length: 6 }, (_, i) => <span key={i} className="spark" style={{ '--i': i }} />)}
            </span>
          )}
        </span>
      </button>

      <div className="cloud-meta">
        <span className="cloud-rarity" style={{ '--tier-color': info.color }}>{info.name}</span>
        <span className="cloud-reward">−{info.shaveMinutes} min grow time</span>
        <div className="cloud-taps">
          {Array.from({ length: CLOUD_MAX_TAPS }, (_, i) => (
            <span key={i} className={`tap-pip${i < taps ? ' used' : ''}`} />
          ))}
        </div>
        <span className="cloud-hint">
          {taps === 0 ? 'Tap it — each tap might grow it' : tapsLeft > 0 ? `${tapsLeft} tap${tapsLeft === 1 ? '' : 's'} left` : 'Bursting!'}
        </span>
        <div className="cloud-timer"><span /></div>
      </div>
    </div>
  )
}
