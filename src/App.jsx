import { Routes, Route, Navigate } from 'react-router-dom'
import { isConfigured } from './supabase'
import { AuthProvider } from './auth/AuthContext'
import AuthGate from './auth/AuthGate'
import { TeamProvider } from './context/TeamContext'
import { GardenProvider } from './context/GardenContext'
import Layout from './components/Layout'
import BoardPage from './pages/BoardPage'
import DeadlinesPage from './pages/DeadlinesPage'
import TeamsPage from './pages/TeamsPage'
import DashboardPage from './pages/DashboardPage'
import AccountPage from './pages/AccountPage'
import ProjectPage from './pages/ProjectPage'
import GardenPage from './pages/GardenPage'
import VisitGardenPage from './pages/VisitGardenPage'
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
          <GardenProvider>
            <Routes>
              <Route element={<Layout />}>
                <Route index element={<BoardPage />} />
                <Route path="deadlines" element={<DeadlinesPage />} />
                <Route path="community" element={<TeamsPage />} />
                {/* The section was called Teams until it was renamed; old links still land. */}
                <Route path="teams" element={<Navigate to="/community" replace />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="account" element={<AccountPage />} />
                <Route path="garden" element={<GardenPage />} />
                <Route path="garden/:userId" element={<VisitGardenPage />} />
                <Route path="projects/:projectId" element={<ProjectPage />} />
              </Route>
            </Routes>
          </GardenProvider>
        </TeamProvider>
      </AuthGate>
    </AuthProvider>
  )
}
