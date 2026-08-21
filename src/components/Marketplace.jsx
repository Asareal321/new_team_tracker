import { useCallback, useEffect, useState } from 'react'
import { useGarden } from '../context/GardenContext'
import { seedByKey, packetByKey, RARITY_NAMES, RARITY_COLORS } from '../lib/garden'
import { marketOpen, buyListing, cancelListing, listFlower, listPacket, isUnmigrated } from '../lib/community'
import './Marketplace.css'

// What a listing is of, resolved from its key. A listing stores a seed_key or a
// packet_key rather than a name, so a rename in lib/garden.js doesn't leave old
// listings describing something that no longer exists.
// Enough English for the seed names, which are all regular.
function plural(name, n) {
  if (n === 1) return name
  if (/[^aeiou]y$/i.test(name)) return `${name.slice(0, -1)}ies`
  if (/(s|x|sh|ch)$/i.test(name)) return `${name}es`
  return `${name}s`
}

function itemOf(listing) {
  if (listing.kind === 'flower') {
    const seed = seedByKey(listing.item_key)
    return seed
      ? { name: seed.name, emoji: seed.emoji, rarity: seed.rarity, noun: 'flower' }
      : { name: listing.item_key, emoji: '🌱', rarity: 1, noun: 'flower' }
  }
  const packet = packetByKey(listing.item_key)
  return packet
    ? { name: packet.name, emoji: packet.emoji, rarity: packet.rarity, noun: 'packet' }
    : { name: listing.item_key, emoji: '📦', rarity: 1, noun: 'packet' }
}

export default function Marketplace() {
  const { state, flowers, reload } = useGarden() || {}
  const coins = state?.coins ?? 0

  const [listings, setListings] = useState([])
  const [status, setStatus] = useState('loading')
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  // One selection and one price box for the whole panel. Flowers and packets
  // are the same act — put a thing up at a number — so they share the control
  // rather than each growing their own.
  const [pick, setPick] = useState(null)
  const [price, setPrice] = useState('')

  const refresh = useCallback(async () => {
    try {
      setListings(await marketOpen(60, 0))
      setStatus('ready')
    } catch (err) {
      setStatus(isUnmigrated(err) ? 'unmigrated' : 'error')
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  async function buy(listing) {
    setBusy(listing.id); setError(''); setNotice('')
    try {
      const bought = await buyListing(listing.id)
      const item = itemOf(listing)
      setNotice(`${item.name} is yours — ${bought.price} coins.`)
      await Promise.all([refresh(), reload?.()])
    } catch (err) { setError(err.message) }
    finally { setBusy(null) }
  }

  async function take(listing) {
    setBusy(listing.id); setError(''); setNotice('')
    try {
      await cancelListing(listing.id)
      setNotice('Taken off the market.')
      await Promise.all([refresh(), reload?.()])
    } catch (err) { setError(err.message) }
    finally { setBusy(null) }
  }

  async function putUp(e) {
    e.preventDefault()
    const n = Number(price)
    if (!pick || !Number.isInteger(n) || n <= 0) return
    setBusy('sell'); setError('')
    try {
      if (pick.kind === 'flower') await listFlower(pick.id, n)
      else await listPacket(pick.key, n)
      setNotice(`${pick.name} is on the market at ${n} coins.`)
      setPick(null); setPrice('')
      await Promise.all([refresh(), reload?.()])
    } catch (err) { setError(err.message) }
    finally { setBusy(null) }
  }

  // Grown flowers, gathered by kind. Three daisies are three separate rows in
  // the database but one thing to a person selling one, so they collapse to a
  // single chip with a count; listing takes whichever came first, since they
  // are interchangeable.
  const flowerGroups = Object.values((flowers || []).reduce((acc, f) => {
    const seed = seedByKey(f.seed_key)
    if (!seed) return acc
    if (!acc[f.seed_key]) acc[f.seed_key] = { key: f.seed_key, seed, ids: [] }
    acc[f.seed_key].ids.push(f.id)
    return acc
  }, {}))

  // Packets you hold, as things you could sell.
  const heldPackets = Object.entries(state?.packet_inventory || {})
    .filter(([, n]) => n > 0)
    .map(([key, n]) => ({ key, n, packet: packetByKey(key) }))
    .filter(p => p.packet)

  if (status === 'unmigrated') {
    return (
      <section className="mk-card">
        <h3 className="mk-title">Marketplace</h3>
        <p className="mk-migrate">
          The marketplace needs a database update. Run
          <code> migration-community.sql </code> in the Supabase SQL editor, then reload.
        </p>
      </section>
    )
  }

  return (
    <section className="mk-card">
      <div className="mk-head">
        <h3 className="mk-title">Marketplace</h3>
        <span className="mk-purse">{coins.toLocaleString()} 🪙</span>
      </div>
      <p className="mk-explain">
        Flowers and packets, priced by whoever is selling them. Put a flower up from your
        garden; take anything of yours back whenever you like.
      </p>

      {(flowerGroups.length > 0 || heldPackets.length > 0) && (
        <div className="mk-sell">
          <div className="mk-sell-side">
            {flowerGroups.length > 0 && (
              <>
                <span className="mk-sell-label">Sell a flower</span>
                <div className="mk-sell-row">
                  {flowerGroups.map(({ key, seed, ids }) => {
                    const on = pick?.kind === 'flower' && pick.key === key
                    return (
                      <button
                        key={key}
                        className={`mk-chip${on ? ' on' : ''}`}
                        style={on ? undefined : { borderColor: RARITY_COLORS[seed.rarity] }}
                        aria-pressed={on}
                        onClick={() => {
                          setPrice('')
                          // One flower goes up, whatever the pile holds, so
                          // the panel and the notice name it in the singular.
                          setPick(on ? null : {
                            kind: 'flower', key, id: ids[0], name: seed.name,
                          })
                        }}
                      >
                        <span aria-hidden="true">{seed.emoji}</span>
                        {plural(seed.name, ids.length)}
                        {ids.length > 1 && <span className="mk-chip-n">×{ids.length}</span>}
                      </button>
                    )
                  })}
                </div>
              </>
            )}

            {heldPackets.length > 0 && (
              <>
                <span className="mk-sell-label">Sell a packet</span>
                <div className="mk-sell-row">
                  {heldPackets.map(({ key, n, packet }) => {
                    const on = pick?.kind === 'packet' && pick.key === key
                    return (
                      <button
                        key={key}
                        className={`mk-chip${on ? ' on' : ''}`}
                        aria-pressed={on}
                        onClick={() => {
                          setPrice('')
                          setPick(on ? null : { kind: 'packet', key, name: packet.name })
                        }}
                      >
                        <span aria-hidden="true">{packet.emoji}</span>
                        {packet.name}
                        {n > 1 && <span className="mk-chip-n">×{n}</span>}
                      </button>
                    )
                  })}
                </div>
              </>
            )}
          </div>

          {/* The price sits beside the things it prices, and there is no
              suggested figure. Flowers used to convert to coins at a fixed
              rate, which set a floor under every price — nobody accepts less
              from a person than the game pays automatically. Printing that
              number here would put the floor straight back. */}
          <form className="mk-price" onSubmit={putUp}>
            <span className="mk-sell-label">Your price</span>
            {pick ? (
              <p className="mk-picked">
                One {pick.kind === 'flower' ? 'flower' : 'packet'} —{' '}
                <strong>{pick.name}</strong>
              </p>
            ) : (
              <p className="mk-picked mk-picked-none">Pick something on the left.</p>
            )}
            <input
              type="number" min="1" step="1" inputMode="numeric"
              value={price}
              disabled={!pick}
              onChange={e => setPrice(e.target.value)}
              placeholder="Coins"
              aria-label="Price in coins"
            />
            <button
              type="submit"
              className="mk-btn primary"
              disabled={!pick || busy === 'sell' || !(Number(price) > 0)}
            >{busy === 'sell' ? '…' : 'Put it up'}</button>
          </form>
        </div>
      )}

      {error && <p className="mk-error">{error}</p>}
      {notice && <p className="mk-notice">{notice}</p>}

      {status === 'loading' && <p className="mk-empty">Looking…</p>}
      {status === 'error' && <p className="mk-empty">Couldn’t load the market. Try again in a moment.</p>}

      {status === 'ready' && listings.length === 0 && (
        <p className="mk-empty">Nothing for sale. Put something up and you’ll be the first.</p>
      )}

      <div className="mk-list">
        {listings.map(l => {
          const item = itemOf(l)
          const tooDear = !l.mine && coins < l.price
          return (
            <div className="mk-row" key={l.id}>
              <span
                className="mk-emoji"
                style={{ borderColor: RARITY_COLORS[item.rarity] }}
                aria-hidden="true"
              >{item.emoji}</span>
              <span className="mk-body">
                <span className="mk-name">{item.name}</span>
                <span className="mk-meta">
                  {RARITY_NAMES[item.rarity]} {item.noun} · {l.mine ? 'yours' : l.seller_name}
                </span>
              </span>
              <span className="mk-cost">{l.price.toLocaleString()} 🪙</span>
              {l.mine ? (
                <button className="mk-btn" disabled={busy === l.id} onClick={() => take(l)}>
                  Take back
                </button>
              ) : (
                <button
                  className="mk-btn primary"
                  disabled={busy === l.id || tooDear}
                  title={tooDear ? 'Not enough coins' : undefined}
                  onClick={() => buy(l)}
                >{busy === l.id ? '…' : 'Buy'}</button>
              )}
            </div>
          )
        })}
      </div>

    </section>
  )
}
