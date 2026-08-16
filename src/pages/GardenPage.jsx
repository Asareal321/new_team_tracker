import { useEffect, useState } from 'react'
import {
  DndContext, DragOverlay, closestCenter, useDraggable, useDroppable,
  useSensor, useSensors, MouseSensor, TouchSensor,
} from '@dnd-kit/core'
import { useGarden } from '../context/GardenContext'
import {
  SEEDS, seedByKey, RARITY_COLORS, RARITY_NAMES, PLOTS_PER_ROW, PACKETS,
  nextExpansion, remainingSeconds, formatDuration, MAX_PLOTS,
} from '../lib/garden'
import PlotCluster from '../components/PlotCluster'
import PackOpening from '../components/PackOpening'
import PacketArt from '../components/PacketArt'
import './GardenPage.css'

const TABS = [
  { key: 'greenhouse', label: 'Greenhouse' },
  { key: 'garden', label: 'Garden' },
  { key: 'shop', label: 'Shop' },
]

export default function GardenPage() {
  const {
    state, flowers, ready,
    plantSeed, placeFlower, moveFlower, sellGrown, sellPlanted, buyPacket, openPacket, expandGarden,
  } = useGarden()
  const [tab, setTab] = useState('garden')
  // Which flower is in hand, so the overlay can render it and the grid can
  // light up its drop targets.
  const [dragging, setDragging] = useState(null)
  // A mouse drag starts after a few pixels, but touch needs a hold: with a
  // distance trigger, every attempt to scroll the garden past a bed would pick
  // the bed up instead.
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 6 } }),
  )
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
  const draggedSeed = seedByKey(flowers.find(f => f.id === dragging)?.seed_key)

  // Sealed packets waiting on the greenhouse shelf.
  const packetStock = state?.packet_inventory || {}
  const ownedPackets = PACKETS
    .filter(p => (packetStock[p.key] || 0) > 0)
    .map(p => ({ packet: p, count: packetStock[p.key] }))
    .sort((a, b) => b.packet.rarity - a.packet.rarity)
  const packetCount = Object.values(packetStock).reduce((n, v) => n + v, 0)
  const seedsOnShelf = Object.values(inventory).reduce((n, v) => n + v, 0)
  const affordablePackets = PACKETS.filter(p =>
    (p.currency === 'seeds' ? seedCount : coins) >= p.cost).length

  // The counts are what pull you between rooms, so each says the one thing
  // worth acting on there — not a total.
  const counts = {
    greenhouse: packetCount ? `${packetCount} to open` : isReady ? 'ready' : null,
    garden: `${flowers.length}/${plotCount}`,
    shop: affordablePackets ? `${affordablePackets} affordable` : null,
  }

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
        {/* The coin bar stays put across all three rooms — the wireframe's
            point is that your balance never leaves the screen. */}
        <header className="garden-bar">
          <span className="garden-plaque">Grow a Garden</span>
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

        <nav className="shelf-tabs" role="tablist" aria-label="Garden rooms">
          {TABS.map(t => (
            <button
              key={t.key}
              role="tab"
              aria-selected={tab === t.key}
              className={`shelf-tab${tab === t.key ? ' on' : ''}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
              {counts[t.key] && <span className="shelf-count">{counts[t.key]}</span>}
            </button>
          ))}
        </nav>

        {error && <p className="garden-error">{error}</p>}
        {notice && <p className="garden-notice">{notice}</p>}

        {/* --- greenhouse: the one grow slot, plus everything not yet planted --- */}
        {tab === 'greenhouse' && (
        <section className="garden-panel tabbed greenhouse">
          {/* One seed grows at a time, so it gets the middle of the room. */}
          <div className="grow-hero">
            {growing ? (
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
                      /* Straight to the garden with the bed picker armed, as the
                         wireframe note asks. */
                      onClick={() => { setPlacing(true); setTab('garden'); setNotice('Pick an empty bed for it.') }}
                    >
                      Keep it
                    </button>
                    <button className="garden-btn" onClick={() => run(sellGrown, v => `Sold for ${v} coins.`)}>
                      Sell · {growing.sellValue} 🪙
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="grow-hero-empty">
                <span className="grow-hero-pot">🪴</span>
                <p className="growing-name">Nothing growing</p>
                <p className="garden-empty">
                  {ownedSeeds.length ? 'Plant a seed from the shelf below.' : 'Open a packet to find a seed.'}
                </p>
              </div>
            )}
          </div>

          <span className="panel-label">Unopened packets · {packetCount}</span>
          <div className="seed-row">
            {ownedPackets.map(({ packet, count }) => (
              <div key={packet.key} className="seed-packet shop-card" style={{ '--rarity': RARITY_COLORS[packet.rarity] }}>
                <PacketArt packet={packet} />
                <span className="seed-count-badge">×{count}</span>
                <span className="seed-name">{packet.name}</span>
                <span className="seed-rarity">{RARITY_NAMES[packet.rarity]}</span>
                <button
                  className="garden-btn primary"
                  onClick={() => run(async () => {
                    const won = await openPacket(packet.key)
                    setOpening({ packet, seed: won })
                  })}
                >
                  Tear open
                </button>
              </div>
            ))}
            {!ownedPackets.length && (
              <p className="garden-empty">No packets on the shelf — buy one in the shop.</p>
            )}
          </div>

          <span className="panel-label">Seeds · {seedsOnShelf}</span>
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
                <button
                  className="garden-btn primary"
                  disabled={!!growing}
                  title={growing ? 'Something is already growing' : ''}
                  onClick={() => run(() => plantSeed(seed.key))}
                >
                  Plant
                </button>
              </div>
            ))}
            {ownedSeeds.length === 0 && (
              <p className="garden-empty">No seeds yet — tear open a packet.</p>
            )}
          </div>
        </section>
        )}

        {/* --- the garden itself --- */}
        {tab === 'garden' && (
        <section className="garden-panel tabbed field-panel">
          <div className="field-head">
            <span className="panel-label">Plot · {flowers.length} of {plotCount} beds</span>
            {!expansion && <span className="garden-maxed">Fully grown ({MAX_PLOTS} beds)</span>}
          </div>

          <div className="garden-field">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={e => setDragging(e.active.id)}
              onDragCancel={() => setDragging(null)}
              onDragEnd={({ active, over }) => {
                setDragging(null)
                if (!over) return
                const to = Number(String(over.id).replace('plot-', ''))
                run(() => moveFlower(active.id, to))
              }}
            >
              <div className={`plot-grid${dragging ? ' rearranging' : ''}`}>
                {Array.from({ length: plotCount }, (_, i) => {
                  const flower = byPlot.get(i)
                  const seed = seedByKey(flower?.seed_key)
                  if (flower && seed) {
                    return (
                      <FilledPlot
                        key={flower.id}
                        index={i}
                        flower={flower}
                        seed={seed}
                        onSell={() => run(() => sellPlanted(flower.id), v => `Sold for ${v} coins.`)}
                      />
                    )
                  }
                  return (
                    <EmptyPlot
                      key={i}
                      index={i}
                      placing={placing}
                      onPlace={async () => {
                        if (await run(() => placeFlower(i), 'Planted in your garden!')) setPlacing(false)
                      }}
                    />
                  )
                })}
                {/* Ghosts of the next row you could buy. Clicking one jumps to
                    the shop with the tab already switched. */}
                {expansion && Array.from({ length: PLOTS_PER_ROW }, (_, i) => (
                  <button key={`locked-${i}`} className="plot locked" onClick={() => setTab('shop')}>
                    <span className="plot-label">🔒 {expansion.cost} 🪙</span>
                  </button>
                ))}
              </div>
              {/* The dragged bed follows the cursor at full size; without an
                  overlay the original would move inside the grid and the plot
                  it left would look permanently empty mid-drag. */}
              <DragOverlay dropAnimation={null}>
                {draggedSeed && (
                  <div className="plot filled is-overlay" style={{ '--rarity': RARITY_COLORS[draggedSeed.rarity] }}>
                    <PlotCluster seed={draggedSeed} />
                  </div>
                )}
              </DragOverlay>
            </DndContext>
            <p className="garden-hint">Drag a bed onto another plot to rearrange — drop it on a planted bed to swap them.</p>
          </div>
        </section>
        )}

        {/* --- shop: packets, not species --- */}
        {tab === 'shop' && (
        <section className="garden-panel tabbed shop-panel">
          <span className="panel-label">Packets</span>
          <p className="garden-empty">
            You buy a packet, not a flower — what&rsquo;s inside is a roll. Packets stay sealed on the
            greenhouse shelf until you tear one open.
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
                    onClick={() => run(
                      () => buyPacket(packet.key),
                      'Added to your greenhouse shelf.',
                    )}
                  >
                    {affordable ? 'Buy' : `Need ${short.toLocaleString()}`}
                  </button>
                </div>
              )
            })}
          </div>

          <span className="panel-label">Beds</span>
          <div className="seed-row">
            {expansion ? (
              <div className="seed-packet shop-card" style={{ '--rarity': RARITY_COLORS[2] }}>
                <span className="bed-art">🪴</span>
                <span className="seed-name">+{PLOTS_PER_ROW} garden beds</span>
                <span className="shop-price">{expansion.cost.toLocaleString()} 🪙</span>
                <span className="seed-meta">takes you to {expansion.plotCount} beds</span>
                <button
                  className="garden-btn primary"
                  disabled={coins < expansion.cost}
                  onClick={() => run(expandGarden, 'The garden got bigger!')}
                >
                  {coins >= expansion.cost ? 'Buy' : `Need ${(expansion.cost - coins).toLocaleString()}`}
                </button>
              </div>
            ) : (
              <p className="garden-empty">Every bed is bought — {MAX_PLOTS} of {MAX_PLOTS}.</p>
            )}
          </div>
        </section>
        )}
      </div>

      {opening && (
        <PackOpening
          packet={opening.packet}
          seed={opening.seed}
          onDone={() => { setOpened(opening.seed); setOpening(null) }}
        />
      )}
    </div>
  )
}

// A planted bed: draggable so it can be rearranged, and droppable so another
// bed can be swapped onto it.
function FilledPlot({ index, flower, seed, onSell }) {
  const { attributes, listeners, setNodeRef: dragRef, isDragging } = useDraggable({ id: flower.id })
  const { setNodeRef: dropRef, isOver } = useDroppable({ id: `plot-${index}` })

  return (
    <div
      ref={dropRef}
      className={`plot filled${isDragging ? ' is-dragging' : ''}${isOver ? ' is-over' : ''}`}
      style={{ '--rarity': RARITY_COLORS[seed.rarity] }}
    >
      {/* The grab handle covers the bed but sits under the sell button, so
          selling still works while any drag from the soil picks the bed up. */}
      <span ref={dragRef} className="plot-grab" {...listeners} {...attributes} aria-label={`Move ${seed.name}`} />
      <PlotCluster seed={seed} />
      <span className="plot-name">{seed.name}</span>
      <button
        className="plot-sell"
        title={`Sell ${seed.name} for ${seed.sellValue} coins`}
        onClick={onSell}
      >
        Sell {seed.sellValue} 🪙
      </button>
    </div>
  )
}

// An empty bed: a drop target for rearranging, and still the click target for
// planting whatever just finished growing.
function EmptyPlot({ index, placing, onPlace }) {
  const { setNodeRef, isOver } = useDroppable({ id: `plot-${index}` })
  return (
    <button
      ref={setNodeRef}
      className={`plot empty${placing ? ' selectable' : ''}${isOver ? ' is-over' : ''}`}
      disabled={!placing}
      onClick={onPlace}
    >
      <span className="plot-label">{placing ? 'Plant here' : ''}</span>
    </button>
  )
}
