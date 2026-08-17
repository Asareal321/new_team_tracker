import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useTeam } from '../context/TeamContext'
import { isIsolatedSession, isolatedSessionLabel } from '../supabase'
import '../App.css'

const navClass = ({ isActive }) => (isActive ? 'nav-btn active' : 'nav-btn')

// Each destination's icon, picked for what the page *is* rather than for a
// generic category: a board of cards, a clock for what's due, people for the
// community, a chart for the numbers, a seedling for the garden.
const NAV = [
  { to: '/',          label: 'Taskboard',  icon: '🗂️', end: true },
  { to: '/deadlines', label: 'Deadlines',  icon: '⏰' },
  { to: '/community', label: 'Community',  icon: '👥' },
  { to: '/dashboard', label: 'Dashboard',  icon: '📊', admin: true },
  // Personal-only: the garden belongs to you, not to a team.
  { to: '/garden',    label: 'Garden',     icon: '🌱', personal: true },
  { to: '/account',   label: 'Account',    icon: '⚙️' },
]

function getInitialTheme() {
  return localStorage.getItem('theme') === 'dark' ? 'dark' : 'light'
}

export default function Layout() {
  const { teams, currentTeam, currentTeamId, setCurrentTeam } = useTeam()
  const [theme, setTheme] = useState(getInitialTheme)

  const isAdmin = currentTeam?.role === 'owner' || currentTeam?.role === 'admin'

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem('theme', next)
    document.documentElement.setAttribute('data-theme', next === 'dark' ? 'dark' : '')
  }

  return (
    <div className="app">
      <aside className="app-sidebar">
        <div className="sidebar-brand">
          <span className="brand-wordmark">trakkit</span>
          {isIsolatedSession && (
            <span className="isolated-badge" title="This tab uses its own separate login (sessionStorage). It won't affect your other tabs.">
              ⧉ {isolatedSessionLabel}
            </span>
          )}
        </div>
        {/* One list, two shapes: labelled rows in the rail, and icons only in
            the bottom bar on a phone. The label is still in the DOM there —
            hidden visually, read aloud — because an icon on its own tells a
            screen reader nothing. */}
        <nav className="sidebar-nav">
          {NAV.map(item => {
            if (item.admin && !isAdmin) return null
            if (item.personal && currentTeamId) return null
            return (
              <NavLink key={item.to} to={item.to} className={navClass} end={item.end} title={item.label}>
                <span className="nav-icon" aria-hidden="true">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </NavLink>
            )
          })}
        </nav>
        <div className="sidebar-foot">
          <select
            className="team-switcher"
            value={currentTeamId || ''}
            onChange={e => setCurrentTeam(e.target.value || null)}
          >
            <option value="">Personal</option>
            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <button className="theme-toggle" onClick={toggleTheme} title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}>
            <span>{theme === 'dark' ? '☀' : '☾'}</span>
            <span className="theme-toggle-label">{theme === 'dark' ? 'Light' : 'Dark'}</span>
          </button>
        </div>
      </aside>

      <main className="app-main">
        <Outlet />
      </main>
    </div>
  )
}
