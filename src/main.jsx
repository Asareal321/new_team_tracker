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
import { captureReferralFromUrl } from './lib/referral'

// Before React, and before the router has a chance to rewrite the URL. The
// code has to be caught the moment the link is opened — signing up happens a
// minute and several navigations later, by which time the query string is gone.
captureReferralFromUrl()

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
