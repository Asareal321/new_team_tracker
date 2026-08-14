import { useState } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../auth/AuthContext'
import { useGarden } from '../context/GardenContext'
import { useTeam } from '../context/TeamContext'
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

  async function handleSave(e) {
    e.preventDefault()
    if (!displayName.trim()) return
    setSaving(true)
    setSaved(false)
    await supabase.from('profiles').update({ display_name: displayName.trim() }).eq('id', user.id)
    await refreshProfile()
    setSaving(false)
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
          <input value={displayName} onChange={e => setDisplayName(e.target.value)} required />
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
            Turns the game layer down. Finished tasks still bank seeds and coins —
            the reward cloud just stops taking over the screen.
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
