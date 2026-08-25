import { useEffect, useState } from 'react'
import {
  DndContext, DragOverlay, closestCenter, useDraggable, useDroppable,
  useSensor, useSensors, MouseSensor, TouchSensor,
} from '@dnd-kit/core'
import { useGarden } from '../context/GardenContext'
import {
  SEEDS, seedByKey, RARITY_COLORS, RARITY_NAMES, PLOTS_PER_ROW, PLOT_ROWS, PACKETS,
  nextExpansion, remainingSeconds, formatDuration, MAX_PLOTS, growthStage, GROWTH_STAGES,
  liveStreak,
} from '../lib/garden'
import { evaluate, GROUPS } from '../lib/achievements'
import PlotCluster from '../components/PlotCluster'
import PackOpening from '../components/PackOpening'
import FlowerGrown from '../components/FlowerGrown'
import PacketArt from '../components/PacketArt'
import ListFlowerModal from '../components/ListFlowerModal'
import FlowerMenu from '../components/FlowerMenu'
import useDaylight from '../lib/useDaylight'
import { useAttention } from '../components/useAttention'
import {
  IconGreenhouse, IconBeds, IconHerbarium, IconAwards, IconShop,
} from '../components/GardenTabIcons'
import { attentionTitle } from '../lib/attention'
import './GardenPage.css'

const TABS = [
  // Garden first: it is the room you are looking at when the page opens, and
  // it was the only tab you had to travel LEFT to reach while everything else
  // was to the right of it.
  { key: 'garden', label: 'Garden', Icon: IconBeds },
  { key: 'greenhouse', label: 'Greenhouse', Icon: IconGreenhouse },
  { key: 'herbarium', label: 'Herbarium', Icon: IconHerbarium },
  { key: 'awards', label: 'Awards', Icon: IconAwards },
  { key: 'shop', label: 'Shop', Icon: IconShop },
]

const RARITY_ORDER = [1, 2, 3, 4, 5]

// Stage boundaries, marked on the grow bar. The first is skipped — a tick at 0%
// is just the end cap.
const GROWTH_TICKS = GROWTH_STAGES.slice(1).map(s => s.at).filter(at => at < 100)

export default function GardenPage() {
  const {
    reload,
    state, flowers, ready,
    plantSeed, placeFlower, moveFlower, compostGrown, compostPlanted, buyPacket, openPacket, expandGarden,
    releaseBankedClouds,
  } = useGarden()
  // ?tab= lets anything link straight to a room rather than the front door.
  const [tab, setTab] = useState(() => {
    const want = new URLSearchParams(window.location.search).get('tab')
    return TABS.some(t => t.key === want) ? want : 'garden'
  })
  // The same signals the rail runs on, one level down: a room glows for what
  // is waiting inside it, and going in is what puts it out.
  const { signals, markSeen } = useAttention()
  const [releasing, setReleasing] = useState(false)
  const pendingClouds = state?.stats?.pendingClouds || 0
  useEffect(() => { markSeen(`garden:${tab}`) }, [tab, markSeen])

  // The sky follows the local clock, and keeps following it while the tab
  // stays open.
  const phase = useDaylight()
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
  // The flower whose payoff cinematic is playing, or null. Keeping the seed
  // here rather than reading `growing` at render time means the piece finishes
  // on the flower it started with even if the slot is cleared underneath it.
  const [celebrating, setCelebrating] = useState(null)
  // { flower, seed } — a bed on its way to the market, waiting for a price.
  const [listing, setListing] = useState(null)
  // The flower whose sheet is open. Separate from `listing`, because opening
  // the sheet is not yet a decision to sell.
  const [openFlower, setOpenFlower] = useState(null)
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
      <div className={`garden-scene tod-${phase.key}`}>
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
  // Eight named stages, so a long grow visibly changes several times instead of
  // holding one picture for hours.
  const stage = growthStage(progress, growing)
  // Shave time a cloud produced beyond what its flower still needed, waiting
  // for the user to choose which seed receives it.
  const overflow = state?.overflow_seconds || 0
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
  // The herbarium is the permanent record — species you've ever found, with how
  // many of each. It's stored, not derived: selling your last Rose shouldn't
  // remove it from the collection.
  const discovered = state?.discovered || {}
  const foundCount = SEEDS.filter(s => (discovered[s.key] || 0) > 0).length

  // The streak chip and the awards shelf. The streak only counts while it's
  // live — a number from last week is one you've already lost. Today's caps
  // moved to the board's greenhouse strip, next to the work that spends them.
  const streak = liveStreak(state?.streak)
  const awards = evaluate(state, flowers.length)
  const earnedCount = awards.filter(a => a.earned).length


  return (
    <div className={`garden-scene tod-${phase.key}`} data-tick={tick}>
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
            {streak > 0 && (
              <div className="streak-chip" title={`${streak}-day streak — finish a task each day to keep it`}>
                <span className="coin-icon">🔥</span>
                <span className="coin-count">{streak}</span>
              </div>
            )}
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
          {TABS.map(t => {
            const signal = signals[`garden:${t.key}`]
            const why = attentionTitle(signal)
            return (
              <button
                key={t.key}
                role="tab"
                aria-selected={tab === t.key}
                className={`shelf-tab${tab === t.key ? ' on' : ''}${signal ? ` has-news news-${signal.level}` : ''}`}
                title={why ? `${t.label} — ${why}` : t.label}
                data-tour={`room-${t.key}`}
                onClick={() => setTab(t.key)}
              >
                <span className="shelf-icon" aria-hidden="true"><t.Icon /></span>
                {/* Still in the DOM on a phone where it is hidden, and still
                    the button's title — an icon alone tells a screen reader
                    nothing. */}
                <span className="shelf-label">{t.label}</span>
                {signal && (
                  <span className={`shelf-news shelf-news-${signal.level}`}>
                    <span className="sr-only">{why}</span>
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {error && <p className="garden-error">{error}</p>}
        {notice && <p className="garden-notice">{notice}</p>}

        {/* Sits above the tab panels, not inside one: packets are torn open in
            the greenhouse, so a result rendered only in the shop was never seen. */}
        {opened && (
          <div className="packet-result" style={{ '--rarity': RARITY_COLORS[opened.rarity] }}>
            <span className="packet-result-emoji">{opened.emoji}</span>
            <div>
              <p className="packet-result-name">
                {opened.name}
                {opened.isNew && <span className="packet-new">New species!</span>}
              </p>
              <p className="packet-result-rarity">{RARITY_NAMES[opened.rarity]} · added to your tray</p>
            </div>
            {opened.isNew && (
              <button className="garden-btn" onClick={() => { setOpened(null); setTab('herbarium') }}>
                See herbarium
              </button>
            )}
            <button className="garden-btn" onClick={() => setOpened(null)}>Nice</button>
          </div>
        )}

        {/* --- greenhouse: the one grow slot, plus everything not yet planted --- */}
        {tab === 'greenhouse' && (
        <section className="garden-panel tabbed greenhouse">
          {/* The clouds your finished tasks earned, waiting until you want
              them. A cloud takes the middle of the screen until it's tapped
              out, which is right for one and wrong for a run of six. */}
          {pendingClouds > 0 && (
            <div className="cloud-bank">
              <span className="cloud-bank-sky" aria-hidden="true">
                {Array.from({ length: Math.min(pendingClouds, 5) }, (_, n) => (
                  <span key={n} className="cloud-bank-puff" style={{ '--n': n }}>☁️</span>
                ))}
              </span>
              <div className="cloud-bank-say">
                <strong>
                  {pendingClouds === 1 ? 'A cloud is waiting' : `${pendingClouds} clouds are waiting`}
                </strong>
                <span>Tap each one out — every tap can promote it a tier.</span>
              </div>
              <button
                className="garden-btn primary"
                disabled={releasing}
                onClick={async () => {
                  setReleasing(true)
                  try { await releaseBankedClouds() } finally { setReleasing(false) }
                }}
              >{releasing ? 'One moment…' : 'Let them in'}</button>
            </div>
          )}

          {/* Banked cloud time with nowhere to go yet. It's stated up front
              because the choice of which seed receives it is the user's, and an
              unexplained head start on a plant would just look like a bug. */}
          {overflow > 0 && (
            <div className="overflow-banner">
              <span className="overflow-icon">☁️</span>
              <div>
                <p className="overflow-title">{formatDuration(overflow)} of cloud time banked</p>
                <p className="overflow-sub">
                  {growing
                    ? 'It goes to the next seed you plant — a seed shorter than the bank keeps the leftover for the one after.'
                    : 'Plant a seed below and it starts that far along.'}
                </p>
              </div>
            </div>
          )}

          {/* One seed grows at a time, so it gets the middle of the room. */}
          <div className="grow-hero">
            {growing ? (
              <div className="growing-box">
                <div className="growing-pot" style={{ '--rarity': RARITY_COLORS[growing.rarity] }}>
                  <span
                    className={`growing-sprout${isReady ? ' bloomed' : ''}${stage.bud ? ' budding' : ''}`}
                    style={{ '--stage-scale': stage.scale }}
                    key={stage.key}
                  >{stage.emoji}</span>
                  <span className="pot-soil" />
                </div>
                <div className="growing-info">
                  <p className="growing-name">
                    {growing.name}
                    <span className="growing-stage">{stage.label}</span>
                  </p>
                  {/* Ticks mark where each stage begins, so the bar shows how
                      far it is to the next visible change, not just to the end. */}
                  <div className="growing-bar">
                    <span style={{ width: `${progress}%` }} />
                    {GROWTH_TICKS.map(at => (
                      <i key={at} className={`growing-tick${progress >= at ? ' passed' : ''}`} style={{ left: `${at}%` }} />
                    ))}
                  </div>
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
                      /* The payoff plays first; the bed picker is armed when
                         it finishes (or is skipped). */
                      onClick={() => setCelebrating(growing)}
                    >
                      Keep it
                    </button>
                    <button
                      className="garden-btn"
                      title="Clear the pot. Nothing comes back."
                      onClick={() => {
                        if (!window.confirm(`Compost the ${growing.name.toLowerCase()}? It's gone for good.`)) return
                        run(compostGrown, n => `${n} composted.`)
                      }}
                    >
                      Compost
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
                {/* No coin figure. Nothing buys a flower automatically now —
                    printing one would be a price nobody pays, and would put a
                    floor under every price on the market besides. */}
                {/* What the banked cloud time would actually do to *this*
                    species, so the choice is made on real numbers. */}
                {overflow > 0 && !growing && (
                  <span className="seed-overflow">
                    {overflow >= seed.growSeconds
                      ? '☁️ ready at once'
                      : `☁️ ${formatDuration(seed.growSeconds - overflow)} left`}
                  </span>
                )}
                <button
                  className="garden-btn primary"
                  disabled={!!growing}
                  title={growing ? 'Something is already growing' : ''}
                  onClick={() => run(
                    () => plantSeed(seed.key),
                    r => r.applied > 0
                      ? `Planted with ${formatDuration(r.applied)} of cloud time${r.remainingOverflow > 0 ? ` — ${formatDuration(r.remainingOverflow)} still banked` : ''}.`
                      : 'Planted.',
                  )}
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
              <div
                className={`plot-grid${dragging ? ' rearranging' : ''}`}
                style={{ '--cols': Math.max(1, Math.ceil(plotCount / PLOT_ROWS)) }}
              >
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
                        onOpen={() => setOpenFlower({ flower, seed })}
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

        {/* --- herbarium: the permanent record of what you've found --- */}
        {tab === 'herbarium' && (
        <section className="garden-panel tabbed herbarium-panel">
          <div className="herb-head">
            <span className="panel-label">Collection · {foundCount} of {SEEDS.length} species</span>
            <div className="herb-progress" role="img" aria-label={`${foundCount} of ${SEEDS.length} species found`}>
              <span style={{ width: `${(foundCount / SEEDS.length) * 100}%` }} />
            </div>
          </div>
          <p className="garden-empty">
            Every species you&rsquo;ve ever found is pressed here for good — selling a flower
            doesn&rsquo;t un-find it.
          </p>

          {RARITY_ORDER.map(rarity => {
            const row = SEEDS.filter(s => s.rarity === rarity)
            const got = row.filter(s => (discovered[s.key] || 0) > 0).length
            return (
              <div key={rarity} className="herb-tier">
                <span className="herb-tier-label" style={{ '--rarity': RARITY_COLORS[rarity] }}>
                  <span className="herb-tier-dot" />
                  {RARITY_NAMES[rarity]}
                  <span className="herb-tier-count">{got}/{row.length}</span>
                </span>
                <div className="seed-row">
                  {row.map(seed => {
                    const found = discovered[seed.key] || 0
                    return (
                      <div
                        key={seed.key}
                        className={`herb-card${found ? ' found' : ''}`}
                        style={{ '--rarity': RARITY_COLORS[seed.rarity] }}
                        title={found
                          ? `${seed.name} — found ${found}×`
                          : `Not found yet — open packets to discover it`}
                      >
                        <span className="herb-emoji" aria-hidden={!found}>
                          {found ? seed.emoji : '❔'}
                        </span>
                        <span className="herb-name">{found ? seed.name : '???'}</span>
                        {found ? (
                          <>
                            <span className="herb-found">found {found}×</span>
                            <span className="seed-meta">{RARITY_NAMES[seed.rarity]} · {formatDuration(seed.growSeconds)}</span>
                          </>
                        ) : (
                          <span className="herb-found muted">undiscovered</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </section>
        )}

        {/* --- awards shelf --- */}
        {tab === 'awards' && (
        <section className="garden-panel tabbed awards-panel">
          <span className="panel-label">Awards · {earnedCount} of {awards.length}</span>

          {GROUPS.map(group => {
            const row = awards.filter(a => a.group === group)
            if (!row.length) return null
            // Earned first, then whatever is closest to being earned — the
            // shelf should read as "what you've done, and what's next".
            const sorted = [...row].sort((a, b) =>
              (b.earned - a.earned) || (b.pct - a.pct) || a.goal - b.goal)
            return (
              <div key={group} className="award-group">
                <span className="herb-tier-label">
                  {group}
                  <span className="herb-tier-count">
                    {row.filter(a => a.earned).length}/{row.length}
                  </span>
                </span>
                <div className="award-grid">
                  {sorted.map(a => (
                    <div key={a.key} className={`award-card${a.earned ? ' earned' : ''}`}>
                      <span className="award-icon">{a.icon}</span>
                      <div className="award-body">
                        <p className="award-name">{a.name}</p>
                        <p className="award-blurb">{a.blurb}</p>
                        {a.earned ? (
                          <p className="award-when">
                            {a.earnedAt
                              ? `Earned ${new Date(a.earnedAt).toLocaleDateString()}`
                              : 'Earned'}
                          </p>
                        ) : (
                          <>
                            <div className="award-bar"><span style={{ width: `${a.pct}%` }} /></div>
                            <p className="award-when">{a.value} / {a.goal}</p>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
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

      {/* The payoff for a finished grow, played when you choose to keep it —
          so it lands on a decision you made rather than interrupting you the
          moment a timer expired. The bed picker is armed on the way out. */}
      {openFlower && (
        <FlowerMenu
          seed={openFlower.seed}
          onClose={() => setOpenFlower(null)}
          onList={() => { setListing(openFlower); setOpenFlower(null) }}
          onCompost={() => {
            const { flower, seed } = openFlower
            if (!window.confirm(`Compost the ${seed.name.toLowerCase()}? It's gone for good.`)) return
            setOpenFlower(null)
            run(() => compostPlanted(flower.id), n => `${n} composted.`)
          }}
        />
      )}

      {listing && (
        <ListFlowerModal
          flower={listing.flower}
          seed={listing.seed}
          onCancel={() => setListing(null)}
          onDone={(name, price) => {
            setListing(null)
            // The bed is gone from the server; reload rather than guessing.
            reload?.()
            setNotice(`${name} is on the market for ${price} coins.`)
          }}
        />
      )}

      {celebrating && (
        <FlowerGrown
          seed={celebrating}
          onDone={() => {
            setCelebrating(null)
            setPlacing(true)
            setTab('garden')
            setNotice('Pick an empty bed for it.')
          }}
        />
      )}

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
function FilledPlot({ index, flower, seed, onOpen }) {
  const { attributes, listeners, setNodeRef: dragRef, isDragging } = useDraggable({ id: flower.id })
  const { setNodeRef: dropRef, isOver } = useDroppable({ id: `plot-${index}` })

  return (
    <div
      ref={dropRef}
      className={`plot filled${isDragging ? ' is-dragging' : ''}${isOver ? ' is-over' : ''}`}
      style={{ '--rarity': RARITY_COLORS[seed.rarity] }}
    >
      {/* The grab handle covers the bed but sits under the buttons, so they
          still work while any drag from the soil picks the bed up. */}
      <span ref={dragRef} className="plot-grab" {...listeners} {...attributes} aria-label={`Move ${seed.name}`} />
      <PlotCluster seed={seed} />
      {/* The bed is soil and a bloom, nothing else. The name used to appear on
          hover — which a phone does not have — and two buttons shared the foot
          of a tile 112px wide at best. Everything they did now lives in the
          sheet this opens, where there is room to show the flower and to say
          what each action costs. */}
      <button
        className="plot-open"
        onClick={onOpen}
        aria-label={`${seed.name} — sell, or compost`}
      />
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
