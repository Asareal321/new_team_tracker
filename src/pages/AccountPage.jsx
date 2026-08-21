import { useState } from 'react'
import { supabase } from '../supabase'
import { checkDisplayName, MAX_LENGTH } from '../lib/displayName'
import { useAuth } from '../auth/AuthContext'
import { useGarden } from '../context/GardenContext'
import { useTeam } from '../context/TeamContext'
import Onboarding from '../components/Onboarding'
import './AccountPage.css'

export default function AccountPage() {
  const { user, profile, signOut, refreshProfile } = useAuth()
  const { isDev, openDevPanel, state: garden, setQuietMode } = useGarden()
  const { teams, currentTeamId, setCurrentTeam } = useTeam()
  const [theme, setTheme] = useState(() => (localStorage.getItem('theme') === 'dark' ? 'dark' : 'light'))

  // The mobile tab bar has no room for the sidebar footer, so the workspace
  // switcher and theme toggle live here too — not only in the rail.
  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem('theme', next)
    document.documentElement.setAttribute('data-theme', next === 'dark' ? 'dark' : '')
  }
  const [displayName, setDisplayName] = useState(profile?.display_name || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [nameError, setNameError] = useState('')
  const [tour, setTour] = useState(false)

  async function handleSave(e) {
    e.preventDefault()
    const name = displayName.trim()
    // Checked here for the message, and again by a trigger in the database,
    // which is the one that actually decides — this check is a fetch call away
    // from being skipped.
    const problem = checkDisplayName(name)
    if (problem) { setNameError(problem); return }
    setNameError('')
    setSaving(true)
    setSaved(false)
    const { error } = await supabase.from('profiles').update({ display_name: name }).eq('id', user.id)
    setSaving(false)
    if (error) {
      setNameError(/not allowed|too short|too long/.test(error.message)
        ? 'That name isn’t allowed. Pick another.'
        : error.message)
      return
    }
    await refreshProfile()
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  return (
    <div className="account-page">
      <h2>Account</h2>

      <form className="account-card" onSubmit={handleSave}>
        <label>Email
          <input value={user.email} disabled />
        </label>
        <label>Display name
          <input
            value={displayName}
            onChange={e => { setDisplayName(e.target.value); if (nameError) setNameError('') }}
            maxLength={MAX_LENGTH}
            required
          />
          {nameError && <p className="account-error">{nameError}</p>}
        </label>
        <div className="form-actions">
          {saved && <span className="saved-hint">Saved</span>}
          <button className="btn-primary" type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>

      <div className="account-card settings-card">
        <div>
          <strong>Workspace</strong>
          <p className="dev-card-hint">Which board you're looking at, and how the app looks.</p>
        </div>
        <div className="settings-controls">
          <select
            className="team-switcher"
            value={currentTeamId || ''}
            onChange={e => setCurrentTeam(e.target.value || null)}
          >
            <option value="">Personal</option>
            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <button className="btn-ghost btn-sm" onClick={toggleTheme}>
            {theme === 'dark' ? '☀ Light' : '☾ Dark'}
          </button>
        </div>
      </div>

      <div className="account-card settings-card">
        <div>
          <strong>Quiet mode</strong>
          <p className="dev-card-hint">
            Turns the game layer down. Finished tasks pay the cloud&rsquo;s average value
            in coins instead of taking over the screen — you keep the reward and
            your streak, you just don&rsquo;t have to tap for it.
          </p>
        </div>
        <label className="switch">
          <input
            type="checkbox"
            checked={!!garden?.quiet_mode}
            onChange={e => setQuietMode(e.target.checked)}
          />
          <span className="switch-track"><span className="switch-knob" /></span>
        </label>
      </div>

      {/* The tour only fires once, and the rules it explains are the ones you
          forget by the time you need them. */}
      <div className="account-card settings-card">
        <div>
          <strong>Trak&rsquo;s tour</strong>
          <p className="dev-card-hint">
            The rabbit&rsquo;s walkthrough again — how the bands and their limits work,
            projects, and the whole garden loop. Nothing is planted or
            changed the second time round.
          </p>
        </div>
        <button className="btn-ghost btn-sm" onClick={() => setTour(true)}>Replay</button>
      </div>

      {tour && <Onboarding mode="replay" displayName={profile?.display_name} onClose={() => setTour(false)} />}

      {isDev && (
        <div className="account-card dev-card">
          <div>
            <strong>Developer tools</strong>
            <p className="dev-card-hint">
              Preview cloud animations at any rarity and jump the garden to any state.
              Also opens with Ctrl/Cmd + Shift + D.
            </p>
          </div>
          <button className="btn-ghost btn-sm" onClick={openDevPanel}>Open</button>
        </div>
      )}

      <button className="btn-ghost" onClick={signOut}>Sign out</button>
    </div>
  )
}
