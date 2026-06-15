import { NavLink, Outlet } from 'react-router-dom'
import { useTeam } from '../context/TeamContext'
import '../App.css'

const navClass = ({ isActive }) => (isActive ? 'nav-btn active' : 'nav-btn')

export default function Layout() {
  const { teams, currentTeamId, setCurrentTeam } = useTeam()

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <span className="logo">⬡</span>
          <h1>Team Tracker</h1>
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
          <NavLink to="/account" className={navClass}>Account</NavLink>
        </div>
      </header>

      <main className="app-main">
        <Outlet />
      </main>
    </div>
  )
}
