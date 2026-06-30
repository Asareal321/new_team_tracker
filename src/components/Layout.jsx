import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useTeam } from '../context/TeamContext'
import '../App.css'

const navClass = ({ isActive }) => (isActive ? 'nav-btn active' : 'nav-btn')

function getInitialTheme() {
  return localStorage.getItem('theme') === 'dark' ? 'dark' : 'light'
}

export default function Layout() {
  const { teams, currentTeamId, setCurrentTeam } = useTeam()
  const [theme, setTheme] = useState(getInitialTheme)

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
          <span className="brand-icon" aria-hidden="true">
            <svg viewBox="0 0 32 32">
              <rect x="3" y="3" width="26" height="26" rx="7" fill="none" stroke="currentColor" strokeWidth="2.5" />
              <path d="M10 16.5 L14 20.5 L22 11.5" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="brand-wordmark">trakkit</span>
        </div>
        <nav className="sidebar-nav">
          <NavLink to="/" className={navClass} end>Taskboard</NavLink>
          <NavLink to="/timeline" className={navClass}>Timeline</NavLink>
          <NavLink to="/teams" className={navClass}>Teams</NavLink>
          <NavLink to="/summary" className={navClass}>Daily Summary</NavLink>
          <NavLink to="/account" className={navClass}>Account</NavLink>
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
