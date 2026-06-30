import { useState } from 'react'
import { useAuth } from './AuthContext'
import './AuthForm.css'

export default function AuthForm({ initialMode = 'signin', onBack }) {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setInfo('')
    setSubmitting(true)
    try {
      if (mode === 'signin') {
        const { error } = await signIn(email, password)
        if (error) throw error
      } else {
        const { error, data } = await signUp(email, password, displayName)
        if (error) throw error
        if (!data.session) {
          setInfo('Check your email to confirm your account, then sign in.')
        }
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  function toggleMode() {
    setMode(m => (m === 'signin' ? 'signup' : 'signin'))
    setError('')
    setInfo('')
  }

  return (
    <div className="auth-screen">
      <form className="auth-card" onSubmit={handleSubmit}>
        {onBack && (
          <button type="button" className="auth-back" onClick={onBack}>← Back</button>
        )}
        <div className="auth-logo">
          <svg viewBox="0 0 32 32" width="24" height="24" aria-hidden="true">
            <rect x="3" y="3" width="26" height="26" rx="7" fill="none" stroke="currentColor" strokeWidth="2.5" />
            <path d="M10 16.5 L14 20.5 L22 11.5" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>trakkit</span>
        </div>
        <h2>{mode === 'signin' ? 'Sign in' : 'Create an account'}</h2>

        {mode === 'signup' && (
          <label>Display name
            <input
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              required
              placeholder="How teammates will see you"
            />
          </label>
        )}

        <label>Email
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </label>

        <label>Password
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
          />
        </label>

        {error && <p className="auth-error">{error}</p>}
        {info && <p className="auth-info">{info}</p>}

        <button className="btn-primary" type="submit" disabled={submitting}>
          {submitting ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Sign up'}
        </button>

        <button type="button" className="auth-switch" onClick={toggleMode}>
          {mode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
        </button>
      </form>
    </div>
  )
}
