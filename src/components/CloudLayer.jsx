import { useEffect, useRef, useState } from 'react'
import { CLOUD_MAX_CLICKS, CLOUD_LIFETIME_MS, formatDuration } from '../lib/garden'
import './CloudLayer.css'

// Rain clouds spawned by completing a task. Click one repeatedly to fatten it
// up before it drifts away — the bigger it gets, the more grow time it shaves
// off the seed in your garden.
export default function CloudLayer({ clouds, onPop, onExpire }) {
  const [toasts, setToasts] = useState([])

  function showToast(reward) {
    if (!reward) return
    const toast = {
      id: crypto.randomUUID(),
      text: reward.type === 'shave'
        ? `−${formatDuration(reward.amount)} grow time`
        : `+${reward.amount} coins`,
    }
    setToasts(prev => [...prev, toast])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== toast.id)), 2400)
  }

  if (!clouds.length && !toasts.length) return null

  return (
    <div className="cloud-layer">
      {clouds.map(cloud => (
        <Cloud
          key={cloud.id}
          cloud={cloud}
          onPop={async clicks => showToast(await onPop(cloud.id, clicks))}
          onExpire={() => onExpire(cloud.id)}
        />
      ))}
      <div className="cloud-toasts">
        {toasts.map(t => <div key={t.id} className="cloud-toast">{t.text}</div>)}
      </div>
    </div>
  )
}

function Cloud({ cloud, onPop, onExpire }) {
  const [clicks, setClicks] = useState(0)
  const [bursting, setBursting] = useState(false)
  const clicksRef = useRef(0)
  const settled = useRef(false)

  // The cloud drifts off on its own. Whatever size it reached still pays out —
  // ignoring it entirely is the only way to get nothing.
  useEffect(() => {
    const timer = setTimeout(() => {
      if (settled.current) return
      settled.current = true
      if (clicksRef.current > 0) onPop(clicksRef.current)
      else onExpire()
    }, CLOUD_LIFETIME_MS)
    return () => clearTimeout(timer)
  }, [onPop, onExpire])

  function handleClick() {
    if (settled.current) return
    const next = clicks + 1
    clicksRef.current = next
    setClicks(next)
    if (next >= CLOUD_MAX_CLICKS) {
      settled.current = true
      setBursting(true)
      setTimeout(() => onPop(next), 320)
    }
  }

  const scale = 1 + clicks * 0.22

  return (
    <button
      className={`cloud-drop${bursting ? ' bursting' : ''}`}
      style={{ left: `${cloud.left}%`, top: `${cloud.top}%`, '--cloud-scale': scale }}
      onClick={handleClick}
      aria-label={`Rain cloud — tap to grow (${clicks} of ${CLOUD_MAX_CLICKS})`}
    >
      <span className="cloud-emoji">{clicks >= CLOUD_MAX_CLICKS ? '🌧️' : '☁️'}</span>
      <span className="cloud-pips">
        {Array.from({ length: CLOUD_MAX_CLICKS }, (_, i) => (
          <span key={i} className={`cloud-pip${i < clicks ? ' filled' : ''}`} />
        ))}
      </span>
    </button>
  )
}
