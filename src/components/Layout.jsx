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
      <header className="app-header">
        <div className="header-left">
          <span className="logo">⬡</span>
          <h1>Trakkit</h1>
        </div>
        <nav className="header-nav">
          <NavLink to="/" className={navClass} end>Board</NavLink>
          <NavLink to="/timeline" className={navClass}>Timeline</NavLink>
          <NavLink to="/teams" className={navClass}>Teams</NavLink>
          <NavLink to="/summary" className={navClass}>Daily Summary</NavLink>
        </nav>
        <div className="header-right">
          <select
            className="team-switcher"
            value={currentTeamId || ''}
            onChange={e => setCurrentTeam(e.target.value || null)}
          >
            <option value="">Personal</option>
            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <button className="theme-toggle" onClick={toggleTheme} title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}>
            {theme === 'dark' ? '☀' : '☾'}
          </button>
          <NavLink to="/account" className={navClass}>Account</NavLink>
        </div>
      </header>

      <main className="app-main">
        <Outlet />
      </main>
    </div>
  )
}
