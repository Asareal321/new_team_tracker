import { useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useTeam } from '../context/TeamContext'
import Tour from './Tour'
import { tourDone, markTourDone, tourRequested, clearTourRequest, TOUR_EVENT } from '../lib/tourState'
import { isIsolatedSession, isolatedSessionLabel } from '../supabase'
import {
  IconBoard, IconDeadlines, IconCommunity, IconDashboard, IconGarden, IconAccount,
} from './NavIcons'
import '../App.css'

const navClass = ({ isActive }) => (isActive ? 'nav-btn active' : 'nav-btn')

// Each destination's icon, drawn in components/NavIcons.jsx.
const NAV = [
  { to: '/',          label: 'Taskboard', Icon: IconBoard,     end: true },
  { to: '/deadlines', label: 'Deadlines', Icon: IconDeadlines },
  { to: '/community', label: 'Community', Icon: IconCommunity },
  { to: '/dashboard', label: 'Dashboard', Icon: IconDashboard, admin: true },
  // Personal-only: the garden belongs to you, not to a team.
  { to: '/garden',    label: 'Garden',    Icon: IconGarden,    personal: true },
  { to: '/account',   label: 'Account',   Icon: IconAccount },
]

function getInitialTheme() {
  return localStorage.getItem('theme') === 'dark' ? 'dark' : 'light'
}

export default function Layout() {
  const { teams, currentTeam, currentTeamId, setCurrentTeam } = useTeam()
  const { user } = useAuth()
  const [theme, setTheme] = useState(getInitialTheme)

  // The walk lives here because it changes route as it goes — a page that
  // unmounts on the first step can't run it. Setup leaves a flag behind and
  // this picks it up.
  const [touring, setTouring] = useState(false)
  useEffect(() => {
    if (!user) return undefined
    const start = () => {
      if (!tourRequested() || tourDone(user.id)) return
      clearTourRequest()
      setTouring(true)
    }
    start()  // a request left behind before this mounted
    window.addEventListener(TOUR_EVENT, start)
    return () => window.removeEventListener(TOUR_EVENT, start)
  }, [user])

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
                <span className="nav-icon" aria-hidden="true"><item.Icon /></span>
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

      {touring && (
        <Tour onDone={() => { markTourDone(user?.id); setTouring(false) }} />
      )}
    </div>
  )
}
