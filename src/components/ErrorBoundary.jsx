import { Component } from 'react'

// Catches render/runtime errors anywhere below it so a single component crash
// shows a recoverable message instead of unmounting the whole app to a blank
// page. Without this, an uncaught error leaves only the body background.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null, info: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('Uncaught error in React tree:', error, info)
    this.setState({ info })
  }

  render() {
    if (this.state.error) {
      const { error, info } = this.state
      return (
        <div className="error-screen">
          <div className="error-box">
            <h2>Something went wrong</h2>
            <p>The app hit an unexpected error. Reloading usually fixes it.</p>
            <p className="error-hint">
              <button className="btn-primary" onClick={() => window.location.reload()}>Reload</button>
            </p>
            <details className="error-details" open>
              <summary>Error details</summary>
              <pre className="error-pre">{String(error?.stack || error?.message || error)}
{info?.componentStack || ''}</pre>
            </details>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
