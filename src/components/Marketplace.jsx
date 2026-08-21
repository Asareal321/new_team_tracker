import { useCallback, useEffect, useState } from 'react'
import { useGarden } from '../context/GardenContext'
import { seedByKey, packetByKey, RARITY_NAMES, RARITY_COLORS } from '../lib/garden'
import { marketOpen, buyListing, cancelListing, listPacket, isUnmigrated } from '../lib/community'
import './Marketplace.css'

// What a listing is of, resolved from its key. A listing stores a seed_key or a
// packet_key rather than a name, so a rename in lib/garden.js doesn't leave old
// listings describing something that no longer exists.
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
  const { state, reload } = useGarden() || {}
  const coins = state?.coins ?? 0

  const [listings, setListings] = useState([])
  const [status, setStatus] = useState('loading')
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [sellPacket, setSellPacket] = useState(null)
  const [packetPrice, setPacketPrice] = useState('')

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

  async function putPacketUp(e) {
    e.preventDefault()
    const n = Number(packetPrice)
    if (!Number.isInteger(n) || n <= 0) return
    setBusy('packet'); setError('')
    try {
      await listPacket(sellPacket, n)
      setSellPacket(null); setPacketPrice('')
      setNotice('Packet listed.')
      await Promise.all([refresh(), reload?.()])
    } catch (err) { setError(err.message) }
    finally { setBusy(null) }
  }

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

      {heldPackets.length > 0 && (
        <div className="mk-sell">
          <span className="mk-sell-label">Sell a packet</span>
          <div className="mk-sell-row">
            {heldPackets.map(({ key, n, packet }) => (
              <button
                key={key}
                className={`mk-chip${sellPacket === key ? ' on' : ''}`}
                onClick={() => { setSellPacket(sellPacket === key ? null : key); setPacketPrice('') }}
              >
                <span aria-hidden="true">{packet.emoji}</span>{packet.name} ×{n}
              </button>
            ))}
          </div>
          {sellPacket && (
            <form className="mk-price" onSubmit={putPacketUp}>
              <input
                type="number" min="1" step="1" inputMode="numeric" autoFocus
                value={packetPrice}
                onChange={e => setPacketPrice(e.target.value)}
                placeholder="Price in coins"
                aria-label="Price in coins"
              />
              <button type="submit" className="mk-btn primary" disabled={busy === 'packet'}>List it</button>
            </form>
          )}
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
