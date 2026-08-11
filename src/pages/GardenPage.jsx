import { useEffect, useState } from 'react'
import { useGarden } from '../context/GardenContext'
import {
  SEEDS, seedByKey, RARITY_COLORS, PLOTS_PER_ROW,
  nextExpansion, remainingSeconds, formatDuration, MAX_PLOTS,
} from '../lib/garden'
import './GardenPage.css'

export default function GardenPage() {
  const {
    state, flowers, ready,
    plantSeed, placeFlower, sellGrown, sellPlanted, unlockSeed, expandGarden,
  } = useGarden()
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [placing, setPlacing] = useState(false)
  const [tick, setTick] = useState(0)

  // Drive the countdown once a second while a seed is in the ground.
  useEffect(() => {
    if (!state?.growing_seed) return
    const id = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(id)
  }, [state?.growing_seed])

  async function run(fn, successMessage) {
    setError('')
    setNotice('')
    try {
      const result = await fn()
      if (successMessage) setNotice(typeof successMessage === 'function' ? successMessage(result) : successMessage)
      return true
    } catch (e) {
      const msg = e?.message || String(e)
      setError(/does not exist|relation|policy|column|schema cache/i.test(msg)
        ? 'The garden needs a one-time database migration — run migration-garden.sql in the Supabase SQL editor, then reload.'
        : msg)
      return false
    }
  }

  if (!ready) {
    return (
      <div className="garden-scene">
        <div className="garden-sky" />
        <p className="garden-loading">Waking up the garden…</p>
      </div>
    )
  }

  const coins = state?.coins ?? 0
  const plotCount = state?.plot_count ?? 12
  const unlocked = state?.unlocked_rarity ?? 1
  const growing = seedByKey(state?.growing_seed)
  const remaining = remainingSeconds(state)
  const isReady = growing && remaining === 0
  const expansion = nextExpansion(plotCount)
  const byPlot = new Map(flowers.map(f => [f.plot_index, f]))
  const totalSeconds = state?.growing_grow_seconds ?? growing?.growSeconds ?? 1
  const progress = growing ? Math.min(100, ((totalSeconds - remaining) / totalSeconds) * 100) : 0
  const openPlots = Array.from({ length: plotCount }, (_, i) => i).filter(i => !byPlot.has(i))
  // Sprout art grows through four stages so the plot visibly changes shape as
  // the timer runs down, not just the progress bar.
  const sproutStage = progress < 25 ? '·' : progress < 55 ? '🌱' : progress < 100 ? '🌿' : growing?.emoji

  return (
    <div className="garden-scene" data-tick={tick}>
      <div className="garden-sky">
        <span className="sky-sun" />
        <span className="sky-cloud sky-cloud-1" />
        <span className="sky-cloud sky-cloud-2" />
        <span className="sky-cloud sky-cloud-3" />
        <span className="sky-hill sky-hill-back" />
        <span className="sky-hill sky-hill-front" />
      </div>

      <div className="garden-content">
        <header className="garden-head">
          <div className="garden-signpost">
            <div className="garden-sign">
              <h1 className="garden-title">Grow a Garden</h1>
              <p className="garden-sub">Finish tasks · catch the clouds · grow flowers</p>
            </div>
            <span className="garden-sign-post" />
          </div>
          <div className="coin-pouch" title="Coins">
            <span className="coin-icon">🪙</span>
            <span className="coin-count">{coins.toLocaleString()}</span>
          </div>
        </header>

        {error && <p className="garden-error">{error}</p>}
        {notice && <p className="garden-notice">{notice}</p>}

        {/* --- greenhouse: what's currently in the ground --- */}
        <section className="garden-panel greenhouse">
          <span className="panel-label">Greenhouse</span>

          {!growing && (
            <>
              <p className="garden-empty">The bed is empty. Choose a seed to plant.</p>
              <div className="seed-row">
                {SEEDS.map(seed => {
                  const locked = seed.rarity > unlocked
                  const affordable = coins >= seed.unlockCost
                  const canUnlock = locked && seed.rarity === unlocked + 1
                  return (
                    <div key={seed.key} className={`seed-packet${locked ? ' locked' : ''}`} style={{ '--rarity': RARITY_COLORS[seed.rarity] }}>
                      <span className="packet-top" />
                      <span className="seed-emoji">{locked ? '🔒' : seed.emoji}</span>
                      <span className="seed-name">{seed.name}</span>
                      <span className="seed-rarity">{seed.rarityName}</span>
                      <span className="seed-meta">{formatDuration(seed.growSeconds)}</span>
                      <span className="seed-meta">sells for {seed.sellValue} 🪙</span>
                      {locked ? (
                        <button
                          className="garden-btn"
                          disabled={!canUnlock || !affordable}
                          title={!canUnlock ? 'Unlock the previous rarity first' : affordable ? '' : 'Not enough coins'}
                          onClick={() => run(() => unlockSeed(seed.key), `${seed.name} seeds unlocked!`)}
                        >
                          Unlock · {seed.unlockCost} 🪙
                        </button>
                      ) : (
                        <button className="garden-btn primary" onClick={() => run(() => plantSeed(seed.key))}>Plant</button>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {growing && (
            <div className="growing-box">
              <div className="growing-pot" style={{ '--rarity': RARITY_COLORS[growing.rarity] }}>
                <span className={`growing-sprout${isReady ? ' bloomed' : ''}`}>{sproutStage}</span>
                <span className="pot-soil" />
              </div>
              <div className="growing-info">
                <p className="growing-name">{growing.name}</p>
                <div className="growing-bar"><span style={{ width: `${progress}%` }} /></div>
                <p className="growing-time">
                  {isReady ? '✨ Ready to harvest!' : `${formatDuration(remaining)} left`}
                  {state?.shaved_seconds > 0 && ` · ☁️ ${formatDuration(state.shaved_seconds)} shaved`}
                </p>
              </div>
              {isReady && (
                <div className="growing-actions">
                  <button
                    className="garden-btn primary"
                    disabled={!openPlots.length}
                    title={openPlots.length ? '' : 'No empty plots — sell a flower or expand the garden'}
                    onClick={() => { setPlacing(true); setNotice('Pick an empty bed below to plant it.') }}
                  >
                    Keep it
                  </button>
                  <button className="garden-btn" onClick={() => run(sellGrown, v => `Sold for ${v} coins.`)}>
                    Sell · {growing.sellValue} 🪙
                  </button>
                </div>
              )}
            </div>
          )}
        </section>

        {/* --- the garden itself --- */}
        <section className="garden-panel field-panel">
          <div className="field-head">
            <span className="panel-label">Your garden</span>
            {expansion ? (
              <button
                className="garden-btn"
                disabled={coins < expansion.cost}
                title={coins < expansion.cost ? 'Not enough coins' : ''}
                onClick={() => run(expandGarden, 'The garden got bigger!')}
              >
                🪴 +{PLOTS_PER_ROW} beds · {expansion.cost} 🪙
              </button>
            ) : (
              <span className="garden-maxed">Fully grown ({MAX_PLOTS} beds)</span>
            )}
          </div>

          <div className="garden-field">
            <div className="plot-grid">
              {Array.from({ length: plotCount }, (_, i) => {
                const flower = byPlot.get(i)
                const seed = seedByKey(flower?.seed_key)
                if (flower && seed) {
                  return (
                    <div key={i} className="plot filled" style={{ '--rarity': RARITY_COLORS[seed.rarity] }}>
                      <span className="plot-flower">{seed.emoji}</span>
                      <span className="plot-shadow" />
                      <span className="plot-name">{seed.name}</span>
                      <button
                        className="plot-sell"
                        title={`Sell ${seed.name} for ${seed.sellValue} coins`}
                        onClick={() => run(() => sellPlanted(flower.id), v => `Sold for ${v} coins.`)}
                      >
                        Sell {seed.sellValue} 🪙
                      </button>
                    </div>
                  )
                }
                return (
                  <button
                    key={i}
                    className={`plot empty${placing ? ' selectable' : ''}`}
                    disabled={!placing}
                    onClick={async () => {
                      if (await run(() => placeFlower(i), 'Planted in your garden!')) setPlacing(false)
                    }}
                  >
                    <span className="plot-label">{placing ? 'Plant here' : ''}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
