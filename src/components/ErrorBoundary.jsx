import { Component } from 'react'

// Catches render/runtime errors anywhere below it so a single component crash
// shows a recoverable message instead of unmounting the whole app to a blank
// page. Without this, an uncaught error leaves only the body background.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('Uncaught error in React tree:', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="error-screen">
          <div className="error-box">
            <h2>Something went wrong</h2>
            <p>The app hit an unexpected error. Reloading usually fixes it.</p>
            <p className="error-hint">
              <button className="btn-primary" onClick={() => window.location.reload()}>Reload</button>
            </p>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
