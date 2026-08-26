import { useState } from 'react'
import {
  RARITY_COLORS, RARITY_NAMES, PACKETS,
  CLOUD_TIERS, CLOUD_MAX_TAPS, GROWTH_STAGES, DAILY_CAPS,
  ADD_TASK_REWARD, formatDuration, rollPacket, seedByKey, packetByKey,
} from '../lib/garden'
import { MAX_DOING, MAX_UP_NEXT } from './TaskBoard'
import PacketArt from './PacketArt'
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

// The cheapest packet — the one you can actually afford again tomorrow, so
// the first pull teaches the loop rather than a one-off.
const STARTER_PACKET = PACKETS[0]

// What a public profile is worth. A directory nobody is in is not a community,
// so the thing being asked for is real and the thank-you should be too — an
// epic packet, not a token. Stated on the choice rather than sprung afterwards:
// a reward you only learn about once you have chosen is not an incentive, it
// is a surprise.
const PUBLIC_REWARD = packetByKey('epic')

// The packet is last. It is the moment worth ending on — everything before it
// is explanation, and explanation should not stand between you and the thing
// you came for. `planted` follows it because the seed only exists once the
// packet is open.
const SETUP_STEPS  = ['hello', 'grow', 'economy', 'limits', 'profile', 'projects', 'task', 'packet', 'planted']
const REPLAY_STEPS = ['hello', 'grow', 'economy', 'limits', 'board', 'projects']

export default function Onboarding({ displayName, mode = 'setup', onFinish, onClose }) {
  const steps = mode === 'replay' ? REPLAY_STEPS : SETUP_STEPS
  const [i, setI] = useState(0)
  const [pick, setPick] = useState(null)
  // The seed the first packet gave up, once it has been torn open.
  const [opened, setOpened] = useState(null)
  const [tearing, setTearing] = useState(false)
  const [projectName, setProjectName] = useState('')
  const [firstTask, setFirstTask] = useState('')
  // Private by default. Being listed is a choice you make, not one you have to
  // notice and undo.
  const [isPublic, setIsPublic] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  // The roll is real: the same odds table the shop uses, so a lucky first
  // pull is genuinely lucky rather than staged. The pause is only so the
  // packet reads as being opened rather than as a value appearing.
  function tearOpen() {
    if (tearing || opened) return
    setTearing(true)
    const seed = seedByKey(rollPacket(STARTER_PACKET.key))
    setTimeout(() => {
      setOpened(seed)
      setPick(seed.key)
      setTearing(false)
    }, 620)
  }

  const step = steps[i]
  const chosen = opened || seedByKey(pick)
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
        isPublic,
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
      // Skipping still leaves a garden with something in it: roll rather than
      // hand out a fixed seed, so a bailed-out setup is not a worse account.
      await onFinish({
        seedKey: pick || rollPacket(STARTER_PACKET.key),
        projectName: '', firstTask: '', isPublic,
      })
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
              I&rsquo;m <strong>Trak</strong>. Let&rsquo;s set you up, then I&rsquo;ll walk you
              round the place itself.
            </p>
            <p className="onb-body onb-fine">A minute, and you can leave at any point.</p>
          </Scene>
        )}

        {/* A packet, not a menu.
            Picking from three named seeds asked a question nobody could answer
            yet — you have no idea what a Tulip is worth before you have played.
            It also taught the wrong thing: packets are how you actually get
            seeds, so the first one should be a packet, opened with real odds.
            A rarer roll here is a better first minute than any pick. */}
        {step === 'packet' && (
          <Scene mood={opened ? 'happy' : 'point'} title={opened ? 'Look at that.' : 'A packet to start you off'}>
            {!opened ? (
              <>
                <p className="onb-body">
                  Every seed you plant comes out of a packet. Here is your first —
                  a <strong>{STARTER_PACKET.name.toLowerCase()}</strong>, on the house.
                </p>
                <button
                  className="onb-packet"
                  style={{ '--rarity': RARITY_COLORS[STARTER_PACKET.rarity] }}
                  onClick={tearOpen}
                  disabled={tearing}
                  aria-label={`Open the ${STARTER_PACKET.name.toLowerCase()}`}
                >
                  <PacketArt packet={STARTER_PACKET} size={tearing ? 132 : 120} />
                  <span className="onb-packet-cta">{tearing ? 'Opening…' : 'Tear it open'}</span>
                </button>
                <p className="onb-body onb-fine">
                  The odds are printed on every packet. This one is mostly common
                  ground — but it can drop anything.
                </p>
              </>
            ) : (
              <div className="onb-pull" style={{ '--rarity': RARITY_COLORS[opened.rarity] }}>
                <span className="onb-pull-emoji">{opened.emoji}</span>
                <p className="onb-pull-name">{opened.name}</p>
                <p className="onb-pull-meta">
                  {RARITY_NAMES[opened.rarity]} · {formatDuration(opened.growSeconds)} to grow
                </p>
                <p className="onb-body">
                  That is yours. I&rsquo;ll put it in the ground and start the clock.
                </p>
              </div>
            )}
          </Scene>
        )}

        {step === 'planted' && (
          <Scene mood="happy" title="Planted." hero={chosen?.emoji}>
            <p className="onb-body">
              Your {chosen?.name.toLowerCase()} is in the ground. It grows on a real clock —
              about {formatDuration(chosen?.growSeconds || 0)} if you leave it be.
            </p>
            {/* Last screen of setup now that the packet closes it, so this
                hands off to the walk instead of leading into another rule. */}
            <p className="onb-body">
              But you don&rsquo;t have to leave it be. Finish something and the clouds
              do the rest — come on, I&rsquo;ll show you where everything is.
            </p>
          </Scene>
        )}

        {step === 'grow' && (
          <Scene mood="point" title="Finishing work is the weather">
            <p className="onb-body">
              {GROWTH_STAGES.length} stages, sown to bloom. Finishing a task drops a
              {' '}<strong>rain cloud</strong>, and tapping one cuts time off the wait.
            </p>
            <table className="onb-table">
              <thead>
                <tr><th>Cloud</th><th>Cuts</th></tr>
              </thead>
              <tbody>
                {CLOUD_TIERS.map(t => (
                  <tr key={t.tier}>
                    <td><span className="onb-dot" style={{ background: RARITY_COLORS[t.tier] }} />{t.name}</td>
                    <td>{formatDuration(t.shaveMinutes * 60)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="onb-body onb-fine">
              Up to {CLOUD_MAX_TAPS} taps each, and a tap can promote a cloud a tier — so a
              Common can climb. Nothing planted? The whole cut is banked for
              whatever you sow next — a cloud is never wasted.
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
              <li><strong>Coins</strong> — {ADD_TASK_REWARD.coins} for every task you add, and more from quests and streaks.</li>
              <li><strong>Clouds</strong> — one for every task you finish.</li>
            </ul>
            <p className="onb-body onb-fine">
              Coins buy <strong>packets</strong> in the shop — {PACKETS.length} of them. I&rsquo;ll
              show you the shop shortly.
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
              {' '}<strong>streak</strong>.
            </p>
          </Scene>
        )}

        {step === 'profile' && (
          <Scene mood="think" title="Public or private?">
            <p className="onb-body">
              There&rsquo;s a community here — friends, and a market. Your profile decides how
              much of it can find you.
            </p>
            <div className="onb-choices">
              <button
                className={`onb-choice${isPublic ? '' : ' picked'}`}
                onClick={() => setIsPublic(false)}
                aria-pressed={!isPublic}
              >
                <span className="onb-choice-name">🔒 Private</span>
                <span className="onb-choice-meta">
                  Not in the browsable list. People can still find you by name, and your garden
                  stays shut until you accept them.
                </span>
              </button>
              <button
                className={`onb-choice${isPublic ? ' picked' : ''}`}
                onClick={() => setIsPublic(true)}
                aria-pressed={isPublic}
              >
                <span className="onb-choice-name">🌍 Public</span>
                <span className="onb-choice-meta">
                  Listed for anyone to browse and add. Friends still have to be accepted.
                </span>
                <span className="onb-choice-perk">
                  <span aria-hidden="true">{PUBLIC_REWARD.emoji}</span>
                  {PUBLIC_REWARD.name} on the house
                </span>
              </button>
            </div>
            <p className="onb-body onb-fine">
              Either way you can change it whenever you like — I&rsquo;ll show you where.
              {' '}Turning it off later doesn&rsquo;t take the packet back.
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
              Each gets a colour, and its tasks wear it.
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

          {/* `task` is no longer the end — the packet is — so writing a first
              task is now a step you can pass through rather than the finish
              line. Skip advances instead of committing. */}
          {step === 'task' ? (
            <>
              <button className="btn-ghost" disabled={busy} onClick={() => { setFirstTask(''); next() }}>Skip</button>
              <button className="btn-primary" disabled={busy || !firstTask.trim()} onClick={next}>Next</button>
            </>
          ) : i === steps.length - 1 ? (
            <button className="btn-primary" disabled={busy} onClick={finish}>
              {mode === 'replay' ? 'Done' : busy ? 'Setting up…' : 'Start'}
            </button>
          ) : (
            <button
              className="btn-primary"
              disabled={busy || (step === 'packet' && !opened)}
              onClick={next}
            >
              {step === 'packet' ? 'Plant it' : 'Next'}
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
