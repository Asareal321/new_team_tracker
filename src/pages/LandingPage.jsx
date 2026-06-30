import './LandingPage.css'

function BrandIcon({ stroke = '#071013' }) {
  return (
    <svg viewBox="0 0 32 32" width="26" height="26" aria-hidden="true">
      <rect x="3" y="3" width="26" height="26" rx="7" fill="none" stroke={stroke} strokeWidth="2.5" />
      <path d="M10 16.5 L14 20.5 L22 11.5" fill="none" stroke={stroke} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function FeatureBars() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <rect x="3" y="13" width="4" height="8" rx="2" fill="#3b6d11" />
      <rect x="10" y="8" width="4" height="13" rx="2" fill="#3b6d11" />
      <rect x="17" y="3" width="4" height="18" rx="2" fill="#3b6d11" />
    </svg>
  )
}

function FeatureCheck() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="none" stroke="#3b6d11" strokeWidth="2" />
      <path d="M8 12.3 L11 15.2 L16.2 9" fill="none" stroke="#3b6d11" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function FeatureCalendar() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <rect x="4" y="5" width="16" height="15" rx="2.5" fill="none" stroke="#3b6d11" strokeWidth="2" />
      <path d="M4 9.5 H20 M8.5 3.5 V6.5 M15.5 3.5 V6.5" stroke="#3b6d11" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function FeatureTeams() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <circle cx="9" cy="9" r="3.2" fill="none" stroke="#3b6d11" strokeWidth="2" />
      <path d="M3.5 19 C3.5 15.5 6 13.6 9 13.6 C12 13.6 14.5 15.5 14.5 19" fill="none" stroke="#3b6d11" strokeWidth="2" strokeLinecap="round" />
      <path d="M16 7.2 C18.2 7.2 19.6 8.8 19.6 10.6 C19.6 12 18.8 13 17.6 13.4 M16.5 19 C16.5 16.6 18 15 20.5 15" fill="none" stroke="#3b6d11" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export default function LandingPage({ onSignIn, onSignUp }) {
  return (
    <div className="landing">
      <div className="l-hero-wrap">
        <div className="l-inner">
          <nav className="l-nav">
            <div className="l-brand">
              <BrandIcon />
              <span className="l-wordmark">trakkit</span>
            </div>
            <div className="l-nav-actions">
              <button className="l-link" onClick={onSignIn}>Log in</button>
              <button className="l-btn l-btn-dark" onClick={onSignUp}>Sign up</button>
            </div>
          </nav>

          <header className="l-hero">
            <h1 className="l-headline">
              Tasks, tracked.<br />
              Days, <span className="l-underline">done</span>.
            </h1>
            <p className="l-sub">
              Priorities, daily updates, and an end-of-day archive — so your team always knows what got done.
            </p>
            <div className="l-cta">
              <button className="l-btn l-btn-primary" onClick={onSignUp}>Get started free</button>
              <button className="l-btn l-btn-ghost" onClick={onSignIn}>Log in</button>
            </div>
          </header>

          <div className="l-board" aria-hidden="true">
            <div className="l-col">
              <div className="l-col-h">To-do</div>
              <div className="l-card"><span className="l-dot l-dot-high" />Draft Q3 brief</div>
              <div className="l-card"><span className="l-dot l-dot-low" />Update docs</div>
            </div>
            <div className="l-col">
              <div className="l-col-h">In progress</div>
              <div className="l-card"><span className="l-dot l-dot-med" />Ship onboarding</div>
            </div>
            <div className="l-col">
              <div className="l-col-h">Done</div>
              <div className="l-card l-card-done">
                <svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true"><path d="M5 12.5 L10 17.5 L19 7" fill="none" stroke="#3b6d11" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                Fix login bug
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="l-features">
        <div className="l-inner">
          <div className="l-feat-grid">
            <div className="l-feat">
              <div className="l-feat-icon"><FeatureBars /></div>
              <h3>Priorities that stick</h3>
              <p>Drag tasks into high, medium, and low zones so the work that matters rises to the top.</p>
            </div>
            <div className="l-feat">
              <div className="l-feat-icon"><FeatureCheck /></div>
              <h3>Updates in one click</h3>
              <p>Move a task and post what changed at the same time — To-do, In progress, or Done.</p>
            </div>
            <div className="l-feat">
              <div className="l-feat-icon"><FeatureCalendar /></div>
              <h3>End-of-day archive</h3>
              <p>Finished work rolls into a calendar each day, so you can see exactly what got done.</p>
            </div>
            <div className="l-feat">
              <div className="l-feat-icon"><FeatureTeams /></div>
              <h3>Built for teams</h3>
              <p>Switch between personal and team boards — everyone works from the same source of truth.</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="l-foot">
        <div className="l-inner l-foot-inner">
          <div className="l-brand l-brand-sm">
            <BrandIcon />
            <span className="l-wordmark">trakkit</span>
          </div>
          <span className="l-foot-note">© {new Date().getFullYear()} trakkit</span>
        </div>
      </footer>
    </div>
  )
}
