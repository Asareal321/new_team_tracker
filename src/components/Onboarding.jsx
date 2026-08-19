import { useState } from 'react'
import {
  SEEDS, RARITY_COLORS, RARITY_NAMES, PACKETS,
  CLOUD_TIERS, CLOUD_MAX_TAPS, GROWTH_STAGES, DAILY_CAPS,
  ADD_TASK_REWARD, formatDuration,
} from '../lib/garden'
import { MAX_DOING, MAX_UP_NEXT } from './TaskBoard'
import Trak from './Trak'
import './Onboarding.css'

// The tour, narrated by Trak.
//
// It runs in two modes. `setup` is the first run: it plants a seed, names a
// first project and writes a first task, so the board you land on is already
// yours rather than a set of empty bands. `replay` is the same explanations
// with nothing to fill in, for when you want the rules again later.
//
// Every number on these screens is read from lib/garden.js and the board's own
// limits rather than typed into the copy — a tour that quietly goes out of date
// with the balance is worse than no tour.

const STARTER_KEYS = ['daisy', 'tulip', 'orchid']

const SETUP_STEPS  = ['hello', 'seed', 'planted', 'grow', 'economy', 'limits', 'board', 'projects', 'task']
const REPLAY_STEPS = ['hello', 'grow', 'economy', 'limits', 'board', 'projects']

export default function Onboarding({ displayName, mode = 'setup', onFinish, onClose }) {
  const steps = mode === 'replay' ? REPLAY_STEPS : SETUP_STEPS
  const [i, setI] = useState(0)
  const [pick, setPick] = useState(null)
  const [projectName, setProjectName] = useState('')
  const [firstTask, setFirstTask] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const step = steps[i]
  const chosen = SEEDS.find(s => s.key === pick)
  const next = () => setI(n => Math.min(n + 1, steps.length - 1))
  const back = () => setI(n => Math.max(n - 1, 0))

  async function finish() {
    if (mode === 'replay') return onClose?.()
    setBusy(true)
    setError('')
    try {
      await onFinish({
        seedKey: pick,
        projectName: projectName.trim(),
        firstTask: firstTask.trim(),
      })
    } catch (e) {
      setError(e?.message || String(e))
      setBusy(false)
    }
  }

  // Bailing out still has to leave a usable account, so a skipped setup plants
  // the chosen seed (or the default one) and writes nothing else.
  async function skipAll() {
    if (mode === 'replay') return onClose?.()
    setBusy(true)
    setError('')
    try {
      await onFinish({ seedKey: pick || STARTER_KEYS[0], projectName: '', firstTask: '' })
    } catch (e) {
      setError(e?.message || String(e))
      setBusy(false)
    }
  }

  return (
    <div className="onb-overlay">
      <div className="onb-card">
        <div className="onb-steps" aria-hidden="true">
          {steps.map((k, n) => <span key={k} className={`onb-pip${n <= i ? ' on' : ''}`} />)}
        </div>

        {step === 'hello' && (
          <Scene mood="happy" title={displayName ? `Hello, ${displayName}.` : 'Hello.'}>
            <p className="onb-body">
              I&rsquo;m <strong>Trak</strong>. I keep the garden here, and I&rsquo;ll show you how the
              place works — what grows, what pays for it, and where your work goes.
            </p>
            <p className="onb-body">
              It takes about a minute. You can leave at any point.
            </p>
          </Scene>
        )}

        {step === 'seed' && (
          <Scene mood="point" title="Pick something to grow">
            <p className="onb-body">
              Start with a seed. Rarer species take longer and sell for more — a
              daisy is the gentle one.
            </p>
            <div className="onb-seeds">
              {STARTER_KEYS.map(key => {
                const seed = SEEDS.find(s => s.key === key)
                return (
                  <button
                    key={key}
                    className={`onb-seed${pick === key ? ' picked' : ''}`}
                    style={{ '--rarity': RARITY_COLORS[seed.rarity] }}
                    onClick={() => setPick(key)}
                    aria-pressed={pick === key}
                  >
                    <span className="onb-seed-emoji">{seed.emoji}</span>
                    <span className="onb-seed-name">{seed.name}</span>
                    <span className="onb-seed-meta">
                      {RARITY_NAMES[seed.rarity]} · {formatDuration(seed.growSeconds)}
                    </span>
                  </button>
                )
              })}
            </div>
          </Scene>
        )}

        {step === 'planted' && (
          <Scene mood="happy" title="Planted." hero={chosen?.emoji}>
            <p className="onb-body">
              Your {chosen?.name.toLowerCase()} is in the ground, and it grows on a real clock —
              about {formatDuration(chosen?.growSeconds || 0)} if you leave it alone. Come back
              tomorrow and it will have moved on without you.
            </p>
            <p className="onb-body">But you don&rsquo;t have to leave it alone.</p>
          </Scene>
        )}

        {step === 'grow' && (
          <Scene mood="point" title="Finishing work is the weather">
            <p className="onb-body">
              A flower passes through <strong>{GROWTH_STAGES.length} stages</strong> — sown,
              germinating, sprouting, and on up to bloom. Real time moves it along on its own.
              Finishing a task drops a <strong>rain cloud</strong> on your screen, and tapping a
              cloud cuts time off the wait.
            </p>
            <table className="onb-table">
              <thead>
                <tr><th>Cloud</th><th>Cuts</th><th>Pays</th></tr>
              </thead>
              <tbody>
                {CLOUD_TIERS.map(t => (
                  <tr key={t.tier}>
                    <td><span className="onb-dot" style={{ background: RARITY_COLORS[t.tier] }} />{t.name}</td>
                    <td>{formatDuration(t.shaveMinutes * 60)}</td>
                    <td>{t.coins} coins</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="onb-body onb-fine">
              Each cloud takes up to {CLOUD_MAX_TAPS} taps, and every tap can promote it to the
              next tier — so a Common can climb. If a cloud overshoots and finishes the flower,
              the leftover time is banked and you choose which seed gets it.
            </p>
          </Scene>
        )}

        {step === 'economy' && (
          <Scene mood="think" title="Seeds, coins, packets">
            <p className="onb-body">
              Three currencies, and all three come from the board:
            </p>
            <ul className="onb-list">
              <li><strong>Seeds</strong> — {ADD_TASK_REWARD.seeds} for every task you add. Seeds are what you plant.</li>
              <li><strong>Coins</strong> — {ADD_TASK_REWARD.coins} for every task you add too, plus whatever your clouds pay.</li>
              <li><strong>Clouds</strong> — one for every task you finish.</li>
            </ul>
            <p className="onb-body">
              Coins buy <strong>packets</strong> in the shop — {PACKETS.length} of them, from the
              {' '}{PACKETS[0].name.toLowerCase()} up to the {PACKETS[PACKETS.length - 1].name.toLowerCase()}.
              A packet is a roll, not a species: the odds are printed on it, and every packet can
              drop anything. A grown flower can be kept in the garden or sold back for coins, and
              every species you&rsquo;ve ever seen is recorded in the herbarium.
            </p>
          </Scene>
        )}

        {step === 'limits' && (
          <Scene mood="idle" title="What a day is worth">
            <p className="onb-body">
              There&rsquo;s a ceiling on each day, so a burst of busywork can&rsquo;t buy the
              whole garden:
            </p>
            <div className="onb-caps">
              <span className="onb-cap"><b>{DAILY_CAPS.seeds}</b> seeds</span>
              <span className="onb-cap"><b>{DAILY_CAPS.coins}</b> coins</span>
              <span className="onb-cap"><b>{DAILY_CAPS.clouds}</b> clouds</span>
            </div>
            <p className="onb-body">
              They reset at your midnight. Finishing past a cap still counts toward your
              <strong> streak</strong> and your awards — a streak is any day you finish at least
              one task, and it survives a single quiet day only if you pick it up the next.
            </p>
            <p className="onb-body onb-fine">
              Today&rsquo;s remaining allowances sit on the greenhouse strip at the top of the board.
            </p>
          </Scene>
        )}

        {step === 'board' && (
          <Scene mood="point" title="How the board moves">
            <p className="onb-body">
              Work runs in one direction, and the bands are deliberately small:
            </p>
            <ol className="onb-flow">
              <li><b>Braindump</b><span>anything you thought of — no limit</span></li>
              <li><b>Up next</b><span>at most {MAX_UP_NEXT}</span></li>
              <li><b>Doing</b><span>at most {MAX_DOING}</span></li>
              <li><b>Done today</b><span>a count, cleared each day</span></li>
            </ol>
            <p className="onb-body">
              The <b>›</b> on a task sends it forward, <b>‹</b> sends it back — and back from
              Up next means back to the braindump. If a band is full, it says so rather than
              taking the task; that&rsquo;s the point of it.
            </p>
            <p className="onb-body onb-fine">
              Each task carries its notes and its latest update on the face of the card, so you
              can see where something stands without opening it.
            </p>
          </Scene>
        )}

        {step === 'projects' && (
          <Scene mood="think" title="Projects">
            <p className="onb-body">
              A <strong>project</strong> is a bucket of tasks — a week, a release, a house move.
              When you add a task you pick its project, and that&rsquo;s also the button that
              files it. &ldquo;No project&rdquo; is always an option.
            </p>
            <p className="onb-body">
              Each project has its own colour, and a task wears it — so the board reads as
              grouped without spending a heading on every bucket.
            </p>
            {mode === 'setup' && (
              <>
                <input
                  className="onb-input"
                  value={projectName}
                  onChange={e => setProjectName(e.target.value)}
                  placeholder="Name your first project (optional)"
                  onKeyDown={e => e.key === 'Enter' && next()}
                />
                <p className="onb-body onb-fine">
                  You can add and rename projects any time from <b>Projects</b> on the board.
                </p>
              </>
            )}
          </Scene>
        )}

        {step === 'task' && (
          <Scene mood="happy" title="One task to start you off">
            <p className="onb-body">
              Give me something real and I&rsquo;ll put it in Up next
              {projectName.trim() ? <> under <b>{projectName.trim()}</b></> : null}. Finishing it is
              what makes the first cloud.
            </p>
            <input
              className="onb-input"
              autoFocus
              value={firstTask}
              onChange={e => setFirstTask(e.target.value)}
              placeholder="Your first task"
              onKeyDown={e => e.key === 'Enter' && firstTask.trim() && finish()}
            />
          </Scene>
        )}

        {error && <p className="onb-error">{error}</p>}

        <div className="onb-actions">
          {i > 0 && <button className="btn-ghost" disabled={busy} onClick={back}>Back</button>}

          {step === 'task' ? (
            <>
              <button className="btn-ghost" disabled={busy} onClick={() => { setFirstTask(''); finish() }}>Skip</button>
              <button className="btn-primary" disabled={busy || !firstTask.trim()} onClick={finish}>
                {busy ? 'Setting up…' : 'Start'}
              </button>
            </>
          ) : i === steps.length - 1 ? (
            <button className="btn-primary" disabled={busy} onClick={finish}>
              {mode === 'replay' ? 'Done' : busy ? 'Setting up…' : 'Start'}
            </button>
          ) : (
            <button
              className="btn-primary"
              disabled={busy || (step === 'seed' && !pick)}
              onClick={next}
            >
              {step === 'seed' ? 'Plant it' : 'Next'}
            </button>
          )}
        </div>

        <button className="onb-bail" disabled={busy} onClick={skipAll}>
          {mode === 'replay' ? 'Close' : 'Skip the tour'}
        </button>
      </div>
    </div>
  )
}

// Trak stands beside every screen rather than above it, so the reading column
// stays a column and he doesn't cost a third of the card's height.
function Scene({ mood, title, hero, children }) {
  return (
    <div className="onb-scene">
      <div className="onb-guide">
        <Trak mood={mood} size={92} />
        {hero && <span className="onb-hero">{hero}</span>}
      </div>
      <div className="onb-text">
        <h2 className="onb-title">{title}</h2>
        {children}
      </div>
    </div>
  )
}
