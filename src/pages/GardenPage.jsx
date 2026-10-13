import { useEffect, useState } from 'react'
import { useGarden } from '../context/GardenContext'
import {
  SEEDS, seedByKey, RARITY_COLORS, RARITY_NAMES, PACKETS, liveStreak,
} from '../lib/garden'
import { evaluate, GROUPS } from '../lib/achievements'
import PackOpening from '../components/PackOpening'
import PacketArt from '../components/PacketArt'
import useDaylight from '../lib/useDaylight'
import { useAttention } from '../components/useAttention'
import {
  IconGreenhouse, IconHerbarium, IconAwards, IconShop,
} from '../components/GardenTabIcons'
import { attentionTitle } from '../lib/attention'
import './GardenPage.css'

// The beds and the greenhouse moved out: every sphere now has its own garden,
// planted by logging progress, so this page is about what those gardens grow
// rather than a garden of its own. The seed bag comes first because it is the
// one room that changes what happens next time you log.
const TABS = [
  { key: 'seeds', label: 'Seed bag', Icon: IconGreenhouse },
  { key: 'herbarium', label: 'Herbarium', Icon: IconHerbarium },
  { key: 'awards', label: 'Awards', Icon: IconAwards },
  { key: 'shop', label: 'Shop', Icon: IconShop },
]

const RARITY_ORDER = [1, 2, 3, 4, 5]

export default function GardenPage() {
  const { state, flowers, ready, buyPacket, openPacket, setPlantNext } = useGarden()
  // ?tab= lets anything link straight to a room rather than the front door.
  const [tab, setTab] = useState(() => {
    const want = new URLSearchParams(window.location.search).get('tab')
    return TABS.some(t => t.key === want) ? want : 'seeds'
  })
  // The same signals the rail runs on, one level down: a room glows for what
  // is waiting inside it, and going in is what puts it out.
  const { signals, markSeen } = useAttention()
  useEffect(() => { markSeen(`garden:${tab}`) }, [tab, markSeen])

  // The sky follows the local clock, and keeps following it while the tab
  // stays open.
  const phase = useDaylight()
  // The packet being torn open, and its already-decided contents.
  const [opening, setOpening] = useState(null)
  const [opened, setOpened] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
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
  const inventory = state?.seed_inventory || {}
  const ownedSeeds = SEEDS
    .filter(seed => (inventory[seed.key] || 0) > 0)
    .sort((a, b) => b.rarity - a.rarity || a.name.localeCompare(b.name))
  // The seed pinned to be planted by the next log — only while you still hold
  // one, since a pin on a seed you have run out of means nothing.
  const pinned = (inventory[state?.prefs?.plantNext] || 0) > 0 ? seedByKey(state.prefs.plantNext) : null

  // Sealed packets waiting in the bag.
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
  // live — a number from last week is one you've already lost.
  const streak = liveStreak(state?.streak)
  const awards = evaluate(state, flowers.length)
  const earnedCount = awards.filter(a => a.earned).length


  return (
    <div className={`garden-scene tod-${phase.key}`}>
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
          <span className="garden-plaque">Seeds &amp; shop</span>
          <div className="garden-purse">
            {streak > 0 && (
              <div className="streak-chip" title={`${streak}-day streak — log progress each day to keep it`}>
                <span className="coin-icon">🔥</span>
                <span className="coin-count">{streak}</span>
              </div>
            )}
            <div className="seed-tray" title="Sprouts, earned by logging progress">
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
            the seed bag, so a result rendered only in the shop was never seen. */}
        {opened && (
          <div className="packet-result" style={{ '--rarity': RARITY_COLORS[opened.rarity] }}>
            <span className="packet-result-emoji">{opened.emoji}</span>
            <div>
              <p className="packet-result-name">
                {opened.name}
                {opened.isNew && <span className="packet-new">New species!</span>}
              </p>
              <p className="packet-result-rarity">{RARITY_NAMES[opened.rarity]} · in your seed bag</p>
            </div>
            {opened.isNew && (
              <button className="garden-btn" onClick={() => { setOpened(null); setTab('herbarium') }}>
                See herbarium
              </button>
            )}
            <button className="garden-btn" onClick={() => setOpened(null)}>Nice</button>
          </div>
        )}

        {/* --- seed bag: what your next logs will plant --- */}
        {tab === 'seeds' && (
        <section className="garden-panel tabbed seeds-panel">
          {/* The greenhouse and its timer are gone: a flower no longer grows
              on a clock, it is planted the moment you log progress. So this is
              the room that decides what grows — packets go in, and every log
              takes one seed back out. */}
          <p className="seeds-explainer">
            Every time you log progress, a seed from this bag is planted in that sphere&rsquo;s
            garden. Pin one to plant it next; otherwise the next log draws at random, and the
            more of a kind you hold, the likelier it is. An empty bag still plants a free common sprout.
          </p>

          <div className="plant-next">
            <span className="panel-label">Planting next</span>
            {pinned ? (
              <span className="plant-next-pick" style={{ '--rarity': RARITY_COLORS[pinned.rarity] }}>
                <span className="plant-next-emoji">{pinned.emoji}</span> {pinned.name}
                <button className="garden-btn" onClick={() => run(() => setPlantNext(null))}>Draw at random</button>
              </span>
            ) : (
              <span className="plant-next-pick">
                {seedsOnShelf ? 'A random seed from your bag' : 'A free common sprout — your bag is empty'}
              </span>
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

          <span className="panel-label">In the bag · {seedsOnShelf}</span>
          <div className="seed-row">
            {ownedSeeds.map(seed => {
              const isPinned = pinned?.key === seed.key
              return (
                <div key={seed.key} className={`seed-packet${isPinned ? ' is-pinned' : ''}`} style={{ '--rarity': RARITY_COLORS[seed.rarity] }}>
                  <span className="packet-top" />
                  <span className="seed-count-badge">×{inventory[seed.key]}</span>
                  <span className="seed-emoji">{seed.emoji}</span>
                  <span className="seed-name">{seed.name}</span>
                  <span className="seed-rarity">{RARITY_NAMES[seed.rarity]}</span>
                  <button
                    className={`garden-btn${isPinned ? '' : ' primary'}`}
                    aria-pressed={isPinned}
                    onClick={() => run(() => setPlantNext(isPinned ? null : seed.key))}
                  >
                    {isPinned ? 'Pinned' : 'Plant next'}
                  </button>
                </div>
              )
            })}
            {ownedSeeds.length === 0 && (
              <p className="garden-empty">No seeds yet — tear open a packet, or buy one in the shop.</p>
            )}
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
                            <span className="seed-meta">{RARITY_NAMES[seed.rarity]}</span>
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
            You buy a packet, not a flower — what&rsquo;s inside is a roll. Packets wait sealed in
            your seed bag until you tear one open, and what they hold is what your logs plant.
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
                      'In your seed bag — tear it open there.',
                    )}
                  >
                    {affordable ? 'Buy' : `Need ${short.toLocaleString()}`}
                  </button>
                </div>
              )
            })}
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
