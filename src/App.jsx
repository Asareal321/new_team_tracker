import { Routes, Route } from 'react-router-dom'
import { isConfigured } from './supabase'
import { AuthProvider } from './auth/AuthContext'
import AuthGate from './auth/AuthGate'
import { TeamProvider } from './context/TeamContext'
import Layout from './components/Layout'
import BoardPage from './pages/BoardPage'
import TimelinePage from './pages/TimelinePage'
import TeamsPage from './pages/TeamsPage'
import SummaryPage from './pages/SummaryPage'
import AccountPage from './pages/AccountPage'
import './App.css'

export default function App() {
  if (!isConfigured) {
    return (
      <div className="error-screen">
        <div className="error-box">
          <h2>Supabase setup required</h2>
          <p>
            Team Tracker needs a Supabase project for accounts, teams, and shared data.
          </p>
          <p className="error-hint">
            Copy <code>.env.example</code> to <code>.env</code> and fill in
            <code> VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code>,
            then run <code>supabase-schema.sql</code> in the Supabase SQL editor.
          </p>
        </div>
      </div>
    )
  }

  return (
    <AuthProvider>
      <AuthGate>
        <TeamProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<BoardPage />} />
              <Route path="timeline" element={<TimelinePage />} />
              <Route path="teams" element={<TeamsPage />} />
              <Route path="summary" element={<SummaryPage />} />
              <Route path="account" element={<AccountPage />} />
            </Route>
          </Routes>
        </TeamProvider>
      </AuthGate>
    </AuthProvider>
  )
}
