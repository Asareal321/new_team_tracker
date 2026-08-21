import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import {
  browseProfiles, searchProfiles, myFriends, requestFriend, respondFriend,
  unfriend, getVisibility, setVisibility, isUnmigrated,
} from '../lib/community'
import './CommunityPeople.css'

function initials(name) {
  return (name || '?').split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

// What the button on a person's row says, given where you stand with them.
const ACTION = {
  none:           { label: 'Add friend', can: true },
  requested:      { label: 'Requested',  can: false },
  'awaiting-you': { label: 'Accept',     can: true },
  friends:        { label: 'Friends',    can: false },
}

function PersonRow({ person, onAdd, onVisit, busy }) {
  const action = ACTION[person.status] || ACTION.none
  return (
    <div className="cp-person">
      <span className="cp-avatar">{initials(person.display_name)}</span>
      <span className="cp-name">{person.display_name}</span>
      {person.status === 'friends' ? (
        <button className="cp-btn" onClick={() => onVisit(person)}>See garden</button>
      ) : (
        <button
          className={`cp-btn${action.can ? ' primary' : ''}`}
          disabled={!action.can || busy}
          onClick={() => action.can && onAdd(person)}
        >{action.label}</button>
      )}
    </div>
  )
}

export default function CommunityPeople() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [tab, setTab] = useState('friends')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState(null)
  const [directory, setDirectory] = useState([])
  const [friends, setFriends] = useState({ friends: [], incoming: [], outgoing: [] })
  const [isPublic, setIsPublic] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [needsMigration, setNeedsMigration] = useState(false)

  const refresh = useCallback(async () => {
    if (!user) return
    try {
      const [f, v] = await Promise.all([myFriends(), getVisibility(user.id)])
      setFriends(f || { friends: [], incoming: [], outgoing: [] })
      setIsPublic(v)
      setNeedsMigration(false)
    } catch (err) {
      if (isUnmigrated(err)) setNeedsMigration(true)
      else setError(err.message)
    }
  }, [user])

  useEffect(() => { refresh() }, [refresh])

  // The directory is only fetched when you go looking at it — it's the one
  // call here that reads other people's rows, and it shouldn't happen because
  // the community page happened to load.
  useEffect(() => {
    if (tab !== 'browse' || needsMigration) return
    browseProfiles(60, 0).then(setDirectory).catch(err => {
      if (isUnmigrated(err)) setNeedsMigration(true); else setError(err.message)
    })
  }, [tab, needsMigration])

  // Searching is deliberate: a request per keystroke would be a request per
  // keystroke against everyone's profile row.
  async function runSearch(e) {
    e.preventDefault()
    const q = query.trim()
    if (!q) { setResults(null); return }
    setBusy(true); setError('')
    try { setResults(await searchProfiles(q)) }
    catch (err) { setError(err.message) }
    finally { setBusy(false) }
  }

  async function add(person) {
    setBusy(true); setError('')
    try {
      await requestFriend(person.id)
      await refresh()
      // Reflect it where they're standing, rather than making them search again.
      const mark = list => list.map(p => p.id === person.id
        ? { ...p, status: p.status === 'awaiting-you' ? 'friends' : 'requested' } : p)
      setDirectory(mark)
      setResults(r => (r ? mark(r) : r))
    } catch (err) { setError(err.message) }
    finally { setBusy(false) }
  }

  async function respond(id, accept) {
    setBusy(true); setError('')
    try { await respondFriend(id, accept); await refresh() }
    catch (err) { setError(err.message) }
    finally { setBusy(false) }
  }

  async function drop(person) {
    if (!window.confirm(`Remove ${person.display_name} as a friend?`)) return
    setBusy(true); setError('')
    try { await unfriend(person.id); await refresh() }
    catch (err) { setError(err.message) }
    finally { setBusy(false) }
  }

  async function toggleVisibility() {
    const next = !isPublic
    setIsPublic(next)
    try { await setVisibility(user.id, next) }
    catch (err) { setIsPublic(!next); setError(err.message) }
  }

  if (needsMigration) {
    return (
      <section className="cp-card">
        <h3 className="cp-title">People</h3>
        <p className="cp-migrate">
          Friends and the marketplace need a database update. Run
          <code> migration-community.sql </code> in the Supabase SQL editor, then reload.
        </p>
      </section>
    )
  }

  const visit = person => navigate(`/garden/friend/${person.id}`)

  return (
    <section className="cp-card">
      <div className="cp-head">
        <h3 className="cp-title">People</h3>
        {/* The visibility switch lives with the directory it governs, rather
            than in account settings, because this is the screen where being
            listed or not is the thing you're thinking about. */}
        <button className="cp-visibility" onClick={toggleVisibility} aria-pressed={isPublic}>
          <span className={`cp-dot${isPublic ? ' on' : ''}`} aria-hidden="true" />
          {isPublic ? 'Public profile' : 'Private profile'}
        </button>
      </div>
      <p className="cp-explain">
        {isPublic
          ? 'You appear in the list below and anyone can find you by name.'
          : 'You’re not listed. People can only find you by typing your display name in full.'}
      </p>

      <div className="cp-tabs">
        <button className={`cp-tab${tab === 'friends' ? ' active' : ''}`} onClick={() => setTab('friends')}>
          Friends{friends.friends.length ? ` (${friends.friends.length})` : ''}
        </button>
        <button className={`cp-tab${tab === 'browse' ? ' active' : ''}`} onClick={() => setTab('browse')}>
          Browse
        </button>
        <button className={`cp-tab${tab === 'find' ? ' active' : ''}`} onClick={() => setTab('find')}>
          Find by name
        </button>
      </div>

      {error && <p className="cp-error">{error}</p>}

      {tab === 'friends' && (
        <>
          {friends.incoming.length > 0 && (
            <div className="cp-group">
              <span className="cp-group-label">Waiting on you</span>
              {friends.incoming.map(r => (
                <div className="cp-person" key={r.id}>
                  <span className="cp-avatar">{initials(r.display_name)}</span>
                  <span className="cp-name">{r.display_name}</span>
                  <button className="cp-btn primary" disabled={busy} onClick={() => respond(r.id, true)}>Accept</button>
                  <button className="cp-btn" disabled={busy} onClick={() => respond(r.id, false)}>Decline</button>
                </div>
              ))}
            </div>
          )}

          {friends.friends.length === 0 && friends.incoming.length === 0 && (
            <p className="cp-empty">No friends yet. Browse, or find someone by name.</p>
          )}

          {friends.friends.map(f => (
            <div className="cp-person" key={f.id}>
              <span className="cp-avatar">{initials(f.display_name)}</span>
              <span className="cp-name">{f.display_name}</span>
              <button className="cp-btn" onClick={() => visit(f)}>See garden</button>
              <button className="cp-btn quiet" disabled={busy} onClick={() => drop(f)}>Remove</button>
            </div>
          ))}

          {friends.outgoing.length > 0 && (
            <div className="cp-group">
              <span className="cp-group-label">Asked, not answered</span>
              {friends.outgoing.map(r => (
                <div className="cp-person" key={r.id}>
                  <span className="cp-avatar">{initials(r.display_name)}</span>
                  <span className="cp-name">{r.display_name}</span>
                  <span className="cp-pending">Requested</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'browse' && (
        <>
          {directory.length === 0
            ? <p className="cp-empty">Nobody has a public profile yet.</p>
            : directory.map(p => (
              <PersonRow key={p.id} person={p} onAdd={add} onVisit={visit} busy={busy} />
            ))}
        </>
      )}

      {tab === 'find' && (
        <>
          <form className="cp-search" onSubmit={runSearch}>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Their display name"
              aria-label="Search for someone by display name"
            />
            <button type="submit" className="cp-btn primary" disabled={!query.trim() || busy}>Find</button>
          </form>
          <p className="cp-hint">
            Public profiles match on part of a name. Private ones only match the whole name,
            exactly — that’s what keeps them unlisted.
          </p>
          {results && results.length === 0 && <p className="cp-empty">Nobody by that name.</p>}
          {results && results.map(p => (
            <PersonRow key={p.id} person={p} onAdd={add} onVisit={visit} busy={busy} />
          ))}
        </>
      )}
    </section>
  )
}
