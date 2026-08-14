import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../supabase'
import { seedByKey, RARITY_COLORS } from '../lib/garden'
import './GardenPage.css'

// A teammate's garden, read-only. Visiting is the only social mechanic in the
// wireframes — deliberately no leaderboard, no counts to compare, and no
// controls. RLS (see migration-garden-social.sql) allows SELECT on the rows of
// anyone you share a team with; everything here is display-only regardless.
export default function VisitGardenPage() {
  const { userId } = useParams()
  const [state, setState] = useState(null)
  const [flowers, setFlowers] = useState([])
  const [name, setName] = useState('')
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const [{ data: gs }, { data: gf }, { data: prof }] = await Promise.all([
        supabase.from('garden_state').select('plot_count').eq('user_id', userId).maybeSingle(),
        supabase.from('garden_flowers').select('seed_key, plot_index').eq('user_id', userId),
        supabase.from('profiles').select('display_name').eq('id', userId).maybeSingle(),
      ])
      if (cancelled) return
      setState(gs)
      setFlowers(gf || [])
      setName(prof?.display_name || 'A teammate')
      // No row and no flowers means either they've never opened the garden or
      // you don't share a team any more. Either way there's nothing to show.
      setStatus(gs || (gf && gf.length) ? 'ready' : 'empty')
    })()
    return () => { cancelled = true }
  }, [userId])

  const plotCount = state?.plot_count ?? 12
  const byPlot = new Map(flowers.map(f => [f.plot_index, f]))

  return (
    <div className="garden-scene">
      <div className="garden-sky">
        <span className="sky-sun" />
        <span className="sky-cloud sky-cloud-1" />
        <span className="sky-cloud sky-cloud-3" />
        <span className="sky-hill sky-hill-back" />
        <span className="sky-hill sky-hill-front" />
      </div>

      <div className="garden-content">
        <header className="garden-head">
          <div className="garden-signpost">
            <div className="garden-sign">
              <h1 className="garden-title">{name}&rsquo;s garden</h1>
              <p className="garden-sub">Just visiting</p>
            </div>
            <span className="garden-sign-post" />
          </div>
          <Link className="garden-btn" to="/teams">← Back to team</Link>
        </header>

        {status === 'loading' && <p className="garden-loading">Walking over…</p>}

        {status === 'empty' && (
          <section className="garden-panel">
            <span className="panel-label">Garden</span>
            <p className="garden-empty">Nothing planted here yet.</p>
          </section>
        )}

        {status === 'ready' && (
          <section className="garden-panel field-panel">
            <span className="panel-label">Garden</span>
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
                      </div>
                    )
                  }
                  return <div key={i} className="plot empty" />
                })}
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
