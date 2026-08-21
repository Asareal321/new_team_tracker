import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../supabase'
import {
  SEEDS, seedByKey, RARITY_COLORS, RARITY_NAMES,
  remainingSeconds, formatDuration, growthStage, GROWTH_STAGES, liveStreak,
} from '../lib/garden'
import { evaluate, GROUPS } from '../lib/achievements'
import useDaylight from '../lib/useDaylight'
import './GardenPage.css'

// Someone else's garden, read-only.
//
// Two ways in, and they differ only in how the rows are fetched:
//
//  * /garden/:userId — a member of one of your communities. RLS allows the
//    SELECT (migration-garden-social.sql).
//  * /garden/visit/:code — anyone who gave you their share code. RLS can't
//    check a typed-in string, so this goes through the garden_by_code()
//    function instead (migration-garden-share.sql).
//
// Either way there are no controls on this page. Visiting is the only social
// mechanic in the game: no leaderboard, nothing to compare, nothing to click.

// A code you handed to someone shows them the lot. A friend sees the beds and
// the herbarium and no more: a friend list is a larger and more permanent
// audience than one person you gave a string to, so it gets the narrower view.
const TABS = [
  { key: 'greenhouse', label: 'Greenhouse' },
  { key: 'garden', label: 'Garden' },
  { key: 'herbarium', label: 'Herbarium' },
  { key: 'awards', label: 'Awards' },
]
const FRIEND_TABS = TABS.filter(t => t.key === 'garden' || t.key === 'herbarium')
const RARITY_ORDER = [1, 2, 3, 4, 5]

export default function VisitGardenPage({ asFriend = false }) {
  const { userId, code } = useParams()
  const [garden, setGarden] = useState(null)
  const [status, setStatus] = useState('loading')
  const [tab, setTab] = useState('garden')
  // Their garden, your clock — the alternative is asking the server what time
  // it is where they are, for a sky.
  const phase = useDaylight()

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setStatus('loading')
      if (code) {
        const { data, error } = await supabase.rpc('garden_by_code', { _code: code })
        if (cancelled) return
        if (error) { setStatus(/function/i.test(error.message) ? 'unmigrated' : 'error'); return }
        if (!data) { setStatus('nocode'); return }
        setGarden(data)
        setStatus('ready')
        return
      }

      // A friend's garden comes from a function that checks the friendship
      // rather than from the table: RLS lets you read the garden of someone in
      // one of your teams, which a friend need not be.
      if (asFriend) {
        const { data, error } = await supabase.rpc('friend_garden', { _user_id: userId })
        if (cancelled) return
        if (error) { setStatus(/function|schema cache/i.test(error.message) ? 'unmigrated' : 'error'); return }
        if (!data) { setStatus('notfriends'); return }
        setGarden(data)
        setStatus('ready')
        return
      }

      const [{ data: gs }, { data: gf }, { data: prof }] = await Promise.all([
        supabase.from('garden_state').select('*').eq('user_id', userId).maybeSingle(),
        supabase.from('garden_flowers').select('seed_key, plot_index').eq('user_id', userId),
        supabase.from('profiles').select('display_name').eq('id', userId).maybeSingle(),
      ])
      if (cancelled) return
      if (!gs && !(gf && gf.length)) { setStatus('empty'); return }
      setGarden({ ...(gs || {}), flowers: gf || [], display_name: prof?.display_name || 'A gardener' })
      setStatus('ready')
    })()
    return () => { cancelled = true }
  }, [userId, code])

  const flowers = garden?.flowers || []
  const plotCount = garden?.plot_count ?? 12
  const byPlot = new Map(flowers.map(f => [f.plot_index, f]))
  const discovered = garden?.discovered || {}
  const foundCount = SEEDS.filter(s => (discovered[s.key] || 0) > 0).length

  const growing = seedByKey(garden?.growing_seed)
  const remaining = growing ? remainingSeconds(garden) : null
  const total = garden?.growing_grow_seconds ?? growing?.growSeconds ?? 1
  const pct = growing ? Math.min(100, ((total - remaining) / total) * 100) : 0
  const stage = growthStage(pct, growing)
  const stageNo = GROWTH_STAGES.findIndex(s => s.key === stage.key) + 1

  const awards = garden ? evaluate(garden, flowers.length) : []
  const earned = awards.filter(a => a.earned).length
  const streak = liveStreak(garden?.streak)

  return (
    <div className={`garden-scene tod-${phase.key}`}>
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
              <h1 className="garden-title">
                {garden?.display_name ? `${garden.display_name}’s garden` : 'A garden'}
              </h1>
              <p className="garden-sub">Just visiting</p>
            </div>
            <span className="garden-sign-post" />
          </div>
          <Link className="garden-btn" to="/community">← Back to the community</Link>
        </header>

        {status === 'loading' && <p className="garden-loading">Walking over…</p>}

        {status === 'nocode' && (
          <section className="garden-panel">
            <span className="panel-label">Not found</span>
            <p className="garden-empty">
              No garden answers to <strong>{code}</strong>. Codes are six characters — check it
              with whoever gave it to you, and note that they can reset it at any time.
            </p>
          </section>
        )}

        {status === 'notfriends' && (
          <section className="garden-panel">
            <span className="panel-label">Not yet</span>
            <p className="garden-empty">
              You can see a garden once you’re friends. Send a request from the community
              page — they’ll need to accept it first.
            </p>
          </section>
        )}

        {status === 'unmigrated' && (
          <section className="garden-panel">
            <span className="panel-label">Not set up</span>
            <p className="garden-empty">
              This needs a one-time database migration — run{' '}
              {asFriend ? 'migration-community.sql' : 'migration-garden-share.sql'} in the
              Supabase SQL editor, then try again.
            </p>
          </section>
        )}

        {status === 'error' && (
          <section className="garden-panel">
            <span className="panel-label">Trouble</span>
            <p className="garden-empty">Couldn’t open that garden. Try again in a moment.</p>
          </section>
        )}

        {status === 'empty' && (
          <section className="garden-panel">
            <span className="panel-label">Garden</span>
            <p className="garden-empty">Nothing planted here yet.</p>
          </section>
        )}

        {status === 'ready' && (
          <>
            <nav className="shelf-tabs" role="tablist" aria-label="Rooms">
              {(asFriend ? FRIEND_TABS : TABS).map(t => (
                <button
                  key={t.key}
                  role="tab"
                  aria-selected={tab === t.key}
                  className={`shelf-tab${tab === t.key ? ' on' : ''}`}
                  onClick={() => setTab(t.key)}
                >{t.label}</button>
              ))}
            </nav>

            {tab === 'greenhouse' && (
              <section className="garden-panel tabbed greenhouse">
                <span className="panel-label">Greenhouse</span>
                {growing ? (
                  <div className="grow-hero">
                    <div className="growing-box">
                      <div className="growing-pot" style={{ '--rarity': RARITY_COLORS[growing.rarity] }}>
                        <span
                          className={`growing-sprout${remaining === 0 ? ' bloomed' : ''}${stage.bud ? ' budding' : ''}`}
                          style={{ '--stage-scale': stage.scale }}
                        >{stage.emoji}</span>
                        <span className="pot-soil" />
                      </div>
                      <div className="growing-info">
                        <p className="growing-name">
                          {growing.name}
                          <span className="growing-stage">{stage.label}</span>
                        </p>
                        <div className="growing-bar"><span style={{ width: `${pct}%` }} /></div>
                        <p className="growing-time">
                          stage {stageNo} of {GROWTH_STAGES.length} ·{' '}
                          {remaining === 0 ? 'ready to harvest' : `${formatDuration(remaining)} left`}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="garden-empty">Nothing growing right now.</p>
                )}
                {streak > 0 && (
                  <p className="garden-hint">🔥 {streak} day{streak === 1 ? '' : 's'} on the trot.</p>
                )}
              </section>
            )}

            {tab === 'garden' && (
              <section className="garden-panel tabbed field-panel">
                <span className="panel-label">Garden · {flowers.length} planted</span>
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

            {tab === 'herbarium' && (
              <section className="garden-panel tabbed herbarium-panel">
                <div className="herb-head">
                  <span className="panel-label">Collection · {foundCount} of {SEEDS.length} species</span>
                  <div className="herb-progress" role="img" aria-label={`${foundCount} of ${SEEDS.length} species found`}>
                    <span style={{ width: `${(foundCount / SEEDS.length) * 100}%` }} />
                  </div>
                </div>
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
                              title={found ? `${seed.name} — found ${found}×` : 'Not found yet'}
                            >
                              <span className="herb-emoji" aria-hidden={!found}>{found ? seed.emoji : '❔'}</span>
                              <span className="herb-name">{found ? seed.name : '???'}</span>
                              <span className={`herb-found${found ? '' : ' muted'}`}>
                                {found ? `found ${found}×` : 'undiscovered'}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </section>
            )}

            {tab === 'awards' && (
              <section className="garden-panel tabbed awards-panel">
                <span className="panel-label">Awards · {earned} of {awards.length}</span>
                {GROUPS.map(group => {
                  const row = awards.filter(a => a.group === group && a.earned)
                  if (!row.length) return null
                  return (
                    <div key={group} className="award-group">
                      <span className="herb-tier-label">
                        {group}
                        <span className="herb-tier-count">{row.length}</span>
                      </span>
                      <div className="award-grid">
                        {row.map(a => (
                          <div key={a.key} className="award-card earned">
                            <span className="award-icon">{a.icon}</span>
                            <div className="award-body">
                              <p className="award-name">{a.name}</p>
                              <p className="award-blurb">{a.blurb}</p>
                              <p className="award-when">
                                {a.earnedAt ? `Earned ${new Date(a.earnedAt).toLocaleDateString()}` : 'Earned'}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
                {/* Only what they've won. An unearned award is their business —
                    a visitor doesn't need a list of what someone hasn't done. */}
                {earned === 0 && <p className="garden-empty">No awards yet.</p>}
              </section>
            )}
          </>
        )}
      </div>
    </div>
  )
}
