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

  if (!ready) return <div className="garden-page"><p className="garden-loading">Loading your garden…</p></div>

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

  return (
    <div className="garden-page" data-tick={tick}>
      <header className="garden-head">
        <div>
          <h1 className="garden-title">Grow a Garden</h1>
          <p className="garden-sub">Finish tasks, catch the rain clouds, grow flowers.</p>
        </div>
        <div className="garden-coins" title="Coins">🪙 {coins.toLocaleString()}</div>
      </header>

      {error && <p className="garden-error">{error}</p>}
      {notice && <p className="garden-notice">{notice}</p>}

      <section className="garden-card">
        <h2 className="garden-h2">Growing</h2>
        {!growing && (
          <>
            <p className="garden-empty">Nothing planted. Pick a seed below to start growing.</p>
            <div className="seed-row">
              {SEEDS.map(seed => {
                const locked = seed.rarity > unlocked
                const affordable = coins >= seed.unlockCost
                const canUnlock = locked && seed.rarity === unlocked + 1
                return (
                  <div key={seed.key} className={`seed-card${locked ? ' locked' : ''}`} style={{ '--rarity': RARITY_COLORS[seed.rarity] }}>
                    <span className="seed-emoji">{locked ? '🔒' : seed.emoji}</span>
                    <span className="seed-name">{seed.name}</span>
                    <span className="seed-rarity">{seed.rarityName}</span>
                    <span className="seed-meta">{formatDuration(seed.growSeconds)} · sells {seed.sellValue}🪙</span>
                    {locked ? (
                      <button
                        className="btn-primary btn-sm"
                        disabled={!canUnlock || !affordable}
                        title={!canUnlock ? 'Unlock the previous rarity first' : affordable ? '' : 'Not enough coins'}
                        onClick={() => run(() => unlockSeed(seed.key), `${seed.name} unlocked!`)}
                      >
                        Unlock {seed.unlockCost}🪙
                      </button>
                    ) : (
                      <button className="btn-primary btn-sm" onClick={() => run(() => plantSeed(seed.key))}>Plant</button>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}

        {growing && (
          <div className="growing-box">
            <span className="growing-emoji" style={{ '--rarity': RARITY_COLORS[growing.rarity] }}>
              {isReady ? growing.emoji : '🌱'}
            </span>
            <div className="growing-info">
              <p className="growing-name">{growing.name}</p>
              <div className="growing-bar"><span style={{ width: `${progress}%` }} /></div>
              <p className="growing-time">
                {isReady ? 'Ready to harvest!' : `${formatDuration(remaining)} left`}
                {state?.shaved_seconds > 0 && ` · ${formatDuration(state.shaved_seconds)} shaved by clouds`}
              </p>
            </div>
            {isReady && (
              <div className="growing-actions">
                <button
                  className="btn-primary btn-sm"
                  disabled={!openPlots.length}
                  title={openPlots.length ? '' : 'No empty plots — sell a flower or expand the garden'}
                  onClick={() => { setPlacing(true); setNotice('Pick an empty plot below.') }}
                >
                  Keep it
                </button>
                <button className="btn-ghost btn-sm" onClick={() => run(sellGrown, v => `Sold for ${v} coins.`)}>
                  Sell {growing.sellValue}🪙
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      <section className="garden-card">
        <div className="garden-card-head">
          <h2 className="garden-h2">Your garden</h2>
          {expansion ? (
            <button
              className="btn-ghost btn-sm"
              disabled={coins < expansion.cost}
              title={coins < expansion.cost ? 'Not enough coins' : ''}
              onClick={() => run(expandGarden, 'Garden expanded!')}
            >
              + {PLOTS_PER_ROW} plots · {expansion.cost}🪙
            </button>
          ) : (
            <span className="garden-maxed">Max size ({MAX_PLOTS} plots)</span>
          )}
        </div>

        <div className="plot-grid">
          {Array.from({ length: plotCount }, (_, i) => {
            const flower = byPlot.get(i)
            const seed = seedByKey(flower?.seed_key)
            if (flower && seed) {
              return (
                <div key={i} className="plot filled" style={{ '--rarity': RARITY_COLORS[seed.rarity] }}>
                  <span className="plot-emoji">{seed.emoji}</span>
                  <span className="plot-name">{seed.name}</span>
                  <button
                    className="plot-sell"
                    title={`Sell for ${seed.sellValue} coins`}
                    onClick={() => run(() => sellPlanted(flower.id), v => `Sold for ${v} coins.`)}
                  >
                    Sell {seed.sellValue}🪙
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
                {placing ? 'Plant here' : ''}
              </button>
            )
          })}
        </div>
      </section>
    </div>
  )
}
