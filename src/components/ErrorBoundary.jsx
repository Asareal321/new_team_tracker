import { Component } from 'react'

// Catches render/runtime errors anywhere below it so a single component crash
// shows a recoverable message instead of unmounting the whole app to a blank
// page. Without this, an uncaught error leaves only the body background.
//
// It shows the error itself. A boundary that says only "something went wrong"
// is undiagnosable from a screenshot — and "reloading usually fixes it" is
// wrong for the common case, because a crash on mount just happens again. What
// the message and the stack cost is a moment of ugliness; what they save is a
// round trip through devtools that nobody is going to take.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null, info: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    this.setState({ info })
    console.error('Uncaught error in React tree:', error, info)
  }

  render() {
    const { error, info } = this.state
    if (!error) return this.props.children

    const message = error?.message || String(error)
    // The first few frames are the useful part: the component that threw and
    // the ones that rendered it.
    const where = (info?.componentStack || '')
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean)
      .slice(0, 6)

    return (
      <div className="error-screen">
        <div className="error-box">
          <h2>Something went wrong</h2>
          <p>{message}</p>

          {where.length > 0 && (
            <pre className="error-stack">{where.join('\n')}</pre>
          )}

          <p className="error-hint">
            <button className="btn-primary" onClick={() => window.location.reload()}>Reload</button>
          </p>
          <p className="error-note">
            If reloading lands you back here, the crash happens as the page builds
            itself and reloading can&rsquo;t clear it — the message above is what to fix.
          </p>
        </div>
      </div>
    )
  }
}
