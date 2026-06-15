import { useAuth } from './AuthContext'
import AuthForm from './AuthForm'

export default function AuthGate({ children }) {
  const { session, loading } = useAuth()

  if (loading) return <div className="loading">Loading…</div>
  if (!session) return <AuthForm />
  return children
}
