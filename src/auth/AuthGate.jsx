import { useState } from 'react'
import { useAuth } from './AuthContext'
import AuthForm from './AuthForm'
import LandingPage from '../pages/LandingPage'

export default function AuthGate({ children }) {
  const { session, loading } = useAuth()
  // null = show landing page; 'signin' | 'signup' = show the auth form
  const [authMode, setAuthMode] = useState(null)

  if (loading) return <div className="loading">Loading…</div>

  if (!session) {
    if (authMode) {
      return <AuthForm initialMode={authMode} onBack={() => setAuthMode(null)} />
    }
    return (
      <LandingPage
        onSignIn={() => setAuthMode('signin')}
        onSignUp={() => setAuthMode('signup')}
      />
    )
  }

  return children
}
