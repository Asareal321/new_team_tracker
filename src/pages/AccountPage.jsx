import { useState } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../auth/AuthContext'
import { useGarden } from '../context/GardenContext'
import './AccountPage.css'

export default function AccountPage() {
  const { user, profile, signOut, refreshProfile } = useAuth()
  const { isDev, openDevPanel } = useGarden()
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
