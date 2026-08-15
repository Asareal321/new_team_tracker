import { useEffect, useState } from 'react'
import { useGarden } from '../context/GardenContext'
import {
  SEEDS, seedByKey, RARITY_COLORS, RARITY_NAMES, PLOTS_PER_ROW, PACKETS,
  nextExpansion, remainingSeconds, formatDuration, MAX_PLOTS,
} from '../lib/garden'
import PlotCluster from '../components/PlotCluster'
import PacketOpener from '../components/PacketOpener'
import PacketArt from '../components/PacketArt'
import './GardenPage.css'

export default function GardenPage() {
  const {
    state, flowers, ready,
    plantSeed, placeFlower, sellGrown, sellPlanted, buyPacket, expandGarden,
  } = useGarden()
  // The packet being torn open, and its already-decided contents.
  const [opening, setOpening] = useState(null)
  const [opened, setOpened] = useState(null)
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
  const seedCount = state?.seeds ?? 0
  const plotCount = state?.plot_count ?? 12
  const inventory = state?.seed_inventory || {}
  const ownedSeeds = SEEDS
    .filter(seed => (inventory[seed.key] || 0) > 0)
    .sort((a, b) => b.rarity - a.rarity || a.name.localeCompare(b.name))
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
          <div className="garden-purse">
            <div className="seed-tray" title="Seeds banked from finished tasks">
              <span className="coin-icon">🌱</span>
              <span className="coin-count">{seedCount}</span>
            </div>
            <div className="coin-pouch" title="Coins">
              <span className="coin-icon">🪙</span>
              <span className="coin-count">{coins.toLocaleString()}</span>
            </div>
          </div>
        </header>

        {error && <p className="garden-error">{error}</p>}
        {notice && <p className="garden-notice">{notice}</p>}

        {/* --- greenhouse: what's currently in the ground --- */}
        <section className="garden-panel greenhouse">
          <span className="panel-label">Greenhouse</span>

          {!growing && (
            <>
              <p className="garden-empty">The bed is empty. Plant something from your tray.</p>
              <div className="seed-row">
                {ownedSeeds.map(seed => (
                  <div key={seed.key} className="seed-packet" style={{ '--rarity': RARITY_COLORS[seed.rarity] }}>
                    <span className="packet-top" />
                    <span className="seed-count-badge">×{inventory[seed.key]}</span>
                    <span className="seed-emoji">{seed.emoji}</span>
                    <span className="seed-name">{seed.name}</span>
                    <span className="seed-rarity">{RARITY_NAMES[seed.rarity]}</span>
                    <span className="seed-meta">{formatDuration(seed.growSeconds)}</span>
                    <span className="seed-meta">sells for {seed.sellValue} 🪙</span>
                    <button className="garden-btn primary" onClick={() => run(() => plantSeed(seed.key))}>
                      Plant
                    </button>
                  </div>
                ))}
                {ownedSeeds.length === 0 && (
                  <p className="garden-empty">No seeds yet — open a packet in the shop below.</p>
                )}
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
                      <PlotCluster seed={seed} />
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

        {/* --- shop: packets, not species --- */}
        <section className="garden-panel shop-panel">
          <span className="panel-label">Shop</span>
          <p className="garden-empty">
            You buy a packet, not a flower — what&rsquo;s inside is a roll. Better packets shift the
            odds upward, but every packet can drop anything.
          </p>

          {opened && (
            <div className="packet-result" style={{ '--rarity': RARITY_COLORS[opened.rarity] }}>
              <span className="packet-result-emoji">{opened.emoji}</span>
              <div>
                <p className="packet-result-name">{opened.name}</p>
                <p className="packet-result-rarity">{RARITY_NAMES[opened.rarity]} · added to your tray</p>
              </div>
              <button className="garden-btn" onClick={() => setOpened(null)}>Nice</button>
            </div>
          )}

          <div className="seed-row">
            {PACKETS.map(packet => {
              const balance = packet.currency === 'seeds' ? seedCount : coins
              const affordable = balance >= packet.cost
              const short = packet.cost - balance
              const unit = packet.currency === 'seeds' ? '🌱' : '🪙'
              return (
                <div key={packet.key} className="seed-packet shop-card" style={{ '--rarity': RARITY_COLORS[packet.rarity] }}>
                  <PacketArt packet={packet} />
                  <span className="seed-name">{packet.name}</span>
                  <span className="shop-price">{packet.cost.toLocaleString()} {unit}</span>
                  {/* Odds stay one hover away rather than on the card: five
                      cards of five rows turned the shop into a spreadsheet. */}
                  {/* A real button, not a hover-only span: on touch there is no
                      hover, and :focus-visible doesn't fire on tap — the odds
                      would have been unreachable on a phone. */}
                  <button type="button" className="odds-trigger" aria-label={`${packet.name} drop odds`}>
                    odds
                    <span className="odds-pop">
                      <span className="odds-pop-title">{packet.name}</span>
                      <ul className="packet-odds">
                        {[5, 4, 3, 2, 1].map(r => packet.odds[r] > 0 && (
                          <li key={r} style={{ '--r': RARITY_COLORS[r] }}>
                            <span className="odds-dot" />
                            {RARITY_NAMES[r]}
                            <span className="odds-pct">{packet.odds[r]}%</span>
                          </li>
                        ))}
                      </ul>
                    </span>
                  </button>
                  <button
                    className="garden-btn primary"
                    disabled={!affordable}
                    title={affordable ? '' : `${short.toLocaleString()} short`}
                    onClick={() => run(async () => {
                      const won = await buyPacket(packet.key)
                      setOpening({ packet, seed: won })
                    })}
                  >
                    {affordable ? 'Open' : `Need ${short.toLocaleString()}`}
                  </button>
                </div>
              )
            })}
          </div>
        </section>
      </div>

      {opening && (
        <PacketOpener
          packet={opening.packet}
          seed={opening.seed}
          onDone={() => { setOpened(opening.seed); setOpening(null) }}
        />
      )}
    </div>
  )
}
