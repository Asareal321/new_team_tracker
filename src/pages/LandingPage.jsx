import { MAX_DOING, MAX_UP_NEXT } from '../lib/boardLimits'
import './LandingPage.css'

// The numbers on this page are read from the board's own limits rather than
// typed into the copy. A landing page that quietly disagrees with the product
// is worse than one that says less — and these two numbers ARE the pitch, so
// they are the last two that should be allowed to drift.


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

              <span className="l-wordmark">trakkit</span>
            </div>
            <div className="l-nav-actions">
              <button className="l-link" onClick={onSignIn}>Log in</button>
              <button className="l-btn l-btn-dark" onClick={onSignUp}>Sign up</button>
            </div>
          </nav>

          <header className="l-hero">
            <h1 className="l-headline">
              {MAX_UP_NEXT} things next.<br />
              <span className="l-underline">{MAX_DOING} things now</span>.
            </h1>
            <p className="l-sub">
              Most task apps let you write down everything and call it a plan. trakkit
              holds {MAX_UP_NEXT} things in Up next and {MAX_DOING} in Doing — and says no when you try to
              add one more. That refusal is the product.
            </p>
            <div className="l-cta">
              <button className="l-btn l-btn-primary" onClick={onSignUp}>Get started free</button>
              <button className="l-btn l-btn-ghost" onClick={onSignIn}>Log in</button>
            </div>
          </header>

          {/* The real bands, and deliberately shown full: "4/4" and "2/2" are
              the argument, so the mock should be the moment the board says no
              rather than a tidy half-empty one. */}
          <div className="l-board" aria-hidden="true">
            <div className="l-col">
              <div className="l-col-h">Braindump<span className="l-col-n">no limit</span></div>
              <div className="l-card"><span className="l-dot l-dot-low" />Rewrite the pricing page</div>
              <div className="l-card"><span className="l-dot l-dot-low" />Ask Priya about Q3</div>
              <div className="l-card"><span className="l-dot l-dot-low" />Fix the mobile nav</div>
            </div>
            <div className="l-col">
              <div className="l-col-h">Up next<span className="l-col-n l-col-full">{MAX_UP_NEXT}/{MAX_UP_NEXT}</span></div>
              <div className="l-card"><span className="l-dot l-dot-med" />Draft the Q3 brief</div>
              <div className="l-card"><span className="l-dot l-dot-med" />Review Sam&rsquo;s PR</div>
            </div>
            <div className="l-col">
              <div className="l-col-h">Doing<span className="l-col-n l-col-full">{MAX_DOING}/{MAX_DOING}</span></div>
              <div className="l-card"><span className="l-dot l-dot-high" />Ship onboarding</div>
              <div className="l-card"><span className="l-dot l-dot-high" />Fix the login bug</div>
              {/* Done today is a count, not a column — the board clears it each
                  day, and a fourth column would sell the wrong shape. */}
              <div className="l-done-strip">
                <svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true"><path d="M5 12.5 L10 17.5 L19 7" fill="none" stroke="#3b6d11" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                <strong>5</strong> done today
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="l-features">
        <div className="l-inner">
          <h2 className="l-feat-heading">A board small enough to finish</h2>
          <div className="l-feat-grid">
            <div className="l-feat">
              <div className="l-feat-icon"><FeatureBars /></div>
              <h3>A braindump that takes it all</h3>
              <p>Capture without deciding. The pile has no limit, so a full board never stops you writing something down.</p>
            </div>
            <div className="l-feat">
              <div className="l-feat-icon"><FeatureCheck /></div>
              <h3>Bands that push back</h3>
              <p>Up next holds {MAX_UP_NEXT}, Doing holds {MAX_DOING}. Full means full — swap something out, and mean it.</p>
            </div>
            <div className="l-feat">
              <div className="l-feat-icon"><FeatureCalendar /></div>
              <h3>Finishing pays</h3>
              <p>Completed work earns clouds, seeds and coins that grow a garden you actually keep.</p>
            </div>
            <div className="l-feat">
              <div className="l-feat-icon"><FeatureTeams /></div>
              <h3>Streaks, not guilt</h3>
              <p>One finished task a day keeps it alive. Miss one and you can still pick it up tomorrow.</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="l-foot">
        <div className="l-inner l-foot-inner">
          <div className="l-brand l-brand-sm">
            <span className="l-wordmark">trakkit</span>
          </div>
          {/* A plain anchor, not a Link: the policy is a static page served
              outside the app so that it is readable without an account — which
              is the entire point of a privacy policy, and what App Review
              checks. */}
          <a className="l-foot-link" href="/privacy">Privacy</a>
          <span className="l-foot-note">© {new Date().getFullYear()} trakkit</span>
        </div>
      </footer>
    </div>
  )
}
