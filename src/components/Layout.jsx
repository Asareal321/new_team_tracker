import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useTeam } from '../context/TeamContext'
import '../App.css'

const navClass = ({ isActive }) => (isActive ? 'nav-btn active' : 'nav-btn')

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
        </div>
        <nav className="sidebar-nav">
          <NavLink to="/" className={navClass} end>Taskboard</NavLink>
          <NavLink to="/deadlines" className={navClass}>Deadlines</NavLink>
          <NavLink to="/teams" className={navClass}>Teams</NavLink>
          {isAdmin && <NavLink to="/dashboard" className={navClass}>Dashboard</NavLink>}
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
