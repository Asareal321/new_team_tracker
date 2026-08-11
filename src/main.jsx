import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import './index.css'
// Last import wins the cascade: the chrome layer restyles sidebar, headers and
// buttons on top of the per-component stylesheets.
import './themes/chrome.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
        <Analytics />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
)
