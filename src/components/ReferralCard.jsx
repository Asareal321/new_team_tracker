import { useCallback, useEffect, useState } from 'react'
import { useGarden } from '../context/GardenContext'
import { myReferralCode, referralStats, claimReferralPackets, isUnmigrated } from '../lib/community'
import { referralLink } from '../lib/referral'
import { REFERRAL_PACKET, REFERRALS_PER_PACKET, untilNextPacket } from '../lib/rewards'
import { packetByKey } from '../lib/garden'
import './ReferralCard.css'

const PACKET = packetByKey(REFERRAL_PACKET)

export default function ReferralCard() {
  const { reload } = useGarden() || {}
  const [code, setCode] = useState(null)
  const [stats, setStats] = useState(null)
  const [status, setStatus] = useState('loading')
  const [copied, setCopied] = useState(false)
  const [claimed, setClaimed] = useState(0)

  const load = useCallback(async () => {
    try {
      const [c, s] = await Promise.all([myReferralCode(), referralStats()])
      setCode(c)
      // The function returns a single row; PostgREST hands back an array.
      setStats(Array.isArray(s) ? s[0] : s)
      setStatus('ready')
    } catch (err) {
      setStatus(isUnmigrated(err) ? 'unmigrated' : 'error')
    }
  }, [])

  useEffect(() => { load() }, [load])

  // Asked for on sight, not on a button. What is owed is already earned — the
  // server decides how much, and a "claim" button would only be a chore
  // between someone and a thing they have already done the work for.
  useEffect(() => {
    if (status !== 'ready') return
    let alive = true
    claimReferralPackets(REFERRAL_PACKET, REFERRALS_PER_PACKET)
      .then(async n => {
        if (!alive || !n) return
        setClaimed(n)
        await Promise.all([load(), reload?.()])
      })
      .catch(() => { /* nothing owed, or not migrated */ })
    return () => { alive = false }
  }, [status, load, reload])

  if (status === 'unmigrated') {
    return (
      <section className="rf-card">
        <h3 className="rf-title">Bring a friend</h3>
        <p className="rf-migrate">
          Referrals need a database update. Run <code>migration-referrals.sql</code> in
          the Supabase SQL editor, then reload.
        </p>
      </section>
    )
  }

  const joined = stats?.joined ?? 0
  const link = code ? referralLink(code) : ''
  const toGo = untilNextPacket(joined)

  async function copy() {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch { /* clipboard refused; the link is on screen to copy by hand */ }
  }

  return (
    <section className="rf-card">
      <div className="rf-head">
        <h3 className="rf-title">Bring a friend</h3>
        <span className="rf-prize" title={PACKET.name}>
          <span aria-hidden="true">{PACKET.emoji}</span>
          {PACKET.name}
        </span>
      </div>
      <p className="rf-explain">
        Every {REFERRALS_PER_PACKET} people who sign up on your link and set up a garden
        earn you a {PACKET.name.toLowerCase()} — the rarest packet there is.
      </p>

      {claimed > 0 && (
        <p className="rf-won">
          {claimed === 1
            ? `A ${PACKET.name.toLowerCase()} is in your shelf. Go and open it.`
            : `${claimed} ${PACKET.name.toLowerCase()}s are in your shelf.`}
        </p>
      )}

      {/* Progress toward the NEXT packet, not lifetime — which is why three
          joined shows an empty row rather than a full one. It agrees with the
          countdown beside it because both are the same modulo. */}
      <div className="rf-progress" role="img" aria-label={`${joined} joined so far`}>
        {Array.from({ length: REFERRALS_PER_PACKET }, (_, n) => (
          <span key={n} className={`rf-pip${n < joined % REFERRALS_PER_PACKET ? ' on' : ''}`} />
        ))}
        <span className="rf-count">
          {joined === 0 ? 'Nobody yet' : `${joined} joined`}
          {' · '}
          {toGo === 1 ? '1 more for a packet' : `${toGo} more for a packet`}
        </span>
      </div>

      <div className="rf-linkrow">
        <input className="rf-link" value={link} readOnly aria-label="Your invite link"
          onFocus={e => e.target.select()} />
        <button className="rf-btn primary" onClick={copy} disabled={!link}>
          {copied ? 'Copied' : 'Copy link'}
        </button>
      </div>
      <p className="rf-fine">
        Only counts once they finish setting up — an abandoned signup earns nothing.
      </p>
    </section>
  )
}
