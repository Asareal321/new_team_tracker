import { useEffect, useState } from 'react'
import {
  RARITY_COLORS, RARITY_NAMES, PACKETS, rollPacket, seedByKey, packetByKey,
} from '../lib/garden'
import { LOG_REWARD, DAILY_LOG_CAP, checkGoal } from '../lib/spheres'
import PacketArt from './PacketArt'
import PackOpening from './PackOpening'
import Trak from './Trak'

// How long the reveal card holds before setup moves on by itself. Long enough
// to read the name and the grow time, short enough that it doesn't feel stuck.
const REVEAL_HOLD = 5000
import './Onboarding.css'

// The tour, narrated by Trak.
//
// It runs in two modes. `setup` is the first run: it names a first area and
// sphere, optionally a goal and a first log, and opens a first packet — so
// Today is already yours rather than an empty page. `replay` is the same
// explanations with nothing to fill in, for when you want the rules again.
//
// Every number on these screens is read from lib/spheres.js and lib/garden.js
// rather than typed into the copy — a tour that quietly goes out of date with
// the balance is worse than no tour.

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
const SETUP_STEPS  = ['hello', 'grow', 'economy', 'limits', 'profile', 'sphere', 'goal', 'log', 'packet', 'planted']
const REPLAY_STEPS = ['hello', 'spheres', 'grow', 'economy', 'limits']

// Steps that only make sense once a sphere has been named.
const NEEDS_SPHERE = ['goal', 'log']

export default function Onboarding({ displayName, mode = 'setup', onFinish, onClose }) {
  const steps = mode === 'replay' ? REPLAY_STEPS : SETUP_STEPS
  const [i, setI] = useState(0)
  const [pick, setPick] = useState(null)
  // The seed the first packet gave up, once it has been torn open.
  const [opened, setOpened] = useState(null)
  // The seed the cinematic is currently revealing, before it has landed.
  const [rolling, setRolling] = useState(null)
  const [tearing, setTearing] = useState(false)
  const [areaName, setAreaName] = useState('')
  const [sphereName, setSphereName] = useState('')
  const [goalTitle, setGoalTitle] = useState('')
  const [goalEnd, setGoalEnd] = useState('')
  const [goalTried, setGoalTried] = useState(false)
  const [firstLog, setFirstLog] = useState('')
  // Private by default. Being listed is a choice you make, not one you have to
  // notice and undo.
  const [isPublic, setIsPublic] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  // The roll is real: the same odds table the shop uses, so a lucky first
  // pull is genuinely lucky rather than staged.
  //
  // And it plays the real cinematic, not a 620ms stand-in. This is the first
  // packet anybody opens, so it is the one that has to sell what opening a
  // packet is — a shorter version here taught people the animation was
  // skippable filler before they had ever seen it.
  function tearOpen() {
    if (tearing || opened) return
    setTearing(true)
    setRolling(seedByKey(rollPacket(STARTER_PACKET.key)))
  }

  // The cinematic ends with everything faded out, so holding *it* for five
  // seconds would be five seconds of empty screen. What holds instead is the
  // card underneath, with the flower on it — then setup moves itself on.
  function packDone() {
    const seed = rolling
    setRolling(null)
    setTearing(false)
    if (!seed) return
    setOpened(seed)
    setPick(seed.key)
  }

  useEffect(() => {
    if (!opened || mode === 'replay') return undefined
    const t = setTimeout(() => setI(n => Math.min(n + 1, steps.length - 1)), REVEAL_HOLD)
    return () => clearTimeout(t)
  }, [opened, mode, steps.length])

  const step = steps[i]
  const chosen = opened || seedByKey(pick)
  // No sphere, nothing to set a goal in or log to: those steps are passed over
  // in both directions rather than shown empty.
  const hasSphere = !!sphereName.trim()
  const usable = n => !(NEEDS_SPHERE.includes(steps[n]) && !hasSphere)
  const next = () => setI(n => {
    let m = Math.min(n + 1, steps.length - 1)
    while (m < steps.length - 1 && !usable(m)) m += 1
    return m
  })
  const back = () => setI(n => {
    let m = Math.max(n - 1, 0)
    while (m > 0 && !usable(m)) m -= 1
    return m
  })

  const goal = checkGoal({ title: goalTitle, end_date: goalEnd })
  const goalWanted = !!goalTitle.trim() || !!goalEnd
  function goalNext() {
    setGoalTried(true)
    if (goalWanted && !goal.ok) return
    next()
  }

  async function finish() {
    if (mode === 'replay') return onClose?.()
    setBusy(true)
    setError('')
    try {
      await onFinish({
        seedKey: pick,
        areaName: areaName.trim() || (hasSphere ? 'Personal' : ''),
        sphereName: sphereName.trim(),
        goal: hasSphere && goalWanted && goal.ok ? { title: goalTitle.trim(), end_date: goalEnd } : null,
        firstLog: hasSphere ? firstLog.trim() : '',
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
        areaName: '', sphereName: '', goal: null, firstLog: '', isPublic,
      })
    } catch (e) {
      setError(e?.message || String(e))
      setBusy(false)
    }
  }

  return (
    <div className="onb-overlay">
      {/* Above the setup card, and the same component the shop uses — the
          first packet is opened by the real thing, not a rehearsal of it. */}
      {rolling && (
        <PackOpening packet={STARTER_PACKET} seed={rolling} onDone={packDone} />
      )}
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
                <p className="onb-pull-meta">{RARITY_NAMES[opened.rarity]}</p>
                <p className="onb-body">
                  That is yours. It goes in your seed bag, ready for your first log.
                </p>
              </div>
            )}
          </Scene>
        )}

        {step === 'planted' && (
          <Scene mood="happy" title={firstLog.trim() && hasSphere ? 'Planted.' : 'In the bag.'} hero={chosen?.emoji}>
            {firstLog.trim() && hasSphere ? (
              <p className="onb-body">
                Your first log goes in when you press Start, and your {chosen?.name.toLowerCase()} is
                {' '}what it plants — the first thing growing in <b>{sphereName.trim()}</b>.
              </p>
            ) : (
              <p className="onb-body">
                Your {chosen?.name.toLowerCase()} is pinned in your seed bag. The first thing you
                log plants it.
              </p>
            )}
            <p className="onb-body">
              Come on — I&rsquo;ll show you where everything is.
            </p>
          </Scene>
        )}

        {step === 'spheres' && (
          <Scene mood="think" title="Areas, spheres, goals">
            <ol className="onb-flow">
              <li><b>Area</b><span>broad — Academics, Personal, Recruiting</span></li>
              <li><b>Sphere</b><span>one thing inside it — a class, a project, a habit</span></li>
              <li><b>Goal</b><span>optional, and always with an end date</span></li>
            </ol>
            <p className="onb-body">
              You don&rsquo;t tick goals off a list. You log progress toward them, one sentence
              at a time, and the logs add up.
            </p>
          </Scene>
        )}

        {step === 'grow' && (
          <Scene mood="point" title="Every log plants something">
            <p className="onb-body">
              Write one sentence about what you moved forward — &ldquo;finished the problem
              set&rdquo;, &ldquo;two pages of the essay&rdquo; — and a plant goes into that
              sphere&rsquo;s garden.
            </p>
            <p className="onb-body">
              Gardens only grow. One you&rsquo;ve been neglecting just stays small next to the
              others, so you can see where your week went without anyone telling you.
            </p>
          </Scene>
        )}

        {step === 'economy' && (
          <Scene mood="think" title="Coins, sprouts, packets">
            <ul className="onb-list">
              <li><strong>Coins</strong> — {LOG_REWARD.coins} for every log, and more from quests and streaks.</li>
              <li><strong>Sprouts</strong> — {LOG_REWARD.seeds} for every log.</li>
              <li><strong>Packets</strong> — bought with coins and sprouts in the shop. Each one holds a seed.</li>
            </ul>
            <p className="onb-body onb-fine">
              The seeds in your bag are what your logs plant. Rarer packets, stranger gardens.
            </p>
          </Scene>
        )}

        {step === 'limits' && (
          <Scene mood="idle" title="What a day is worth">
            <p className="onb-body">
              There&rsquo;s a ceiling on each day, so a burst of one-word logs can&rsquo;t buy
              the whole shop:
            </p>
            <div className="onb-caps">
              <span className="onb-cap"><b>{DAILY_LOG_CAP.coins}</b> coins</span>
              <span className="onb-cap"><b>{DAILY_LOG_CAP.seeds}</b> sprouts</span>
            </div>
            <p className="onb-body">
              It resets at your midnight. Logging past it still plants, and still counts
              toward your <strong>streak</strong>.
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

        {step === 'sphere' && (
          <Scene mood="think" title="Your first sphere">
            <p className="onb-body">
              Pick one part of your life you want to move forward. An <b>area</b> is the broad
              bucket; the <b>sphere</b> is the thing inside it.
            </p>
            <input
              className="onb-input"
              value={areaName}
              onChange={e => setAreaName(e.target.value)}
              placeholder="Area — e.g. Academics"
              maxLength={60}
            />
            <input
              className="onb-input"
              autoFocus
              value={sphereName}
              onChange={e => setSphereName(e.target.value)}
              placeholder="Sphere — e.g. BUS 2257"
              maxLength={60}
              onKeyDown={e => e.key === 'Enter' && sphereName.trim() && next()}
            />
            <p className="onb-body onb-fine">You can add as many as you like later, and rename them.</p>
          </Scene>
        )}

        {step === 'goal' && (
          <Scene mood="point" title="A goal, if you have one">
            <p className="onb-body">
              Something you&rsquo;re moving toward in <b>{sphereName.trim()}</b>, with a date on it.
              Optional — logs grow the garden either way.
            </p>
            <input
              className="onb-input"
              value={goalTitle}
              onChange={e => setGoalTitle(e.target.value)}
              placeholder="e.g. Finish all 6 problem sets"
              maxLength={140}
            />
            <input
              className="onb-input"
              type="date"
              value={goalEnd}
              onChange={e => setGoalEnd(e.target.value)}
              aria-label="Ends on"
            />
            {goalTried && goalWanted && goal.errors.map(e => (
              <p key={e.field} className="onb-error">{e.text}</p>
            ))}
            {goalTitle.trim() && goal.hints.length > 0 && (
              <p className="onb-body onb-fine">{goal.hints.map(h => h.text).join(' ')}</p>
            )}
          </Scene>
        )}

        {step === 'log' && (
          <Scene mood="happy" title="Log something real">
            <p className="onb-body">
              One sentence: something you did recently for <b>{sphereName.trim()}</b>. It&rsquo;s
              your first plant.
            </p>
            <input
              className="onb-input"
              autoFocus
              value={firstLog}
              onChange={e => setFirstLog(e.target.value)}
              placeholder="e.g. Read chapter 3 and took notes"
              maxLength={280}
              onKeyDown={e => e.key === 'Enter' && firstLog.trim() && next()}
            />
          </Scene>
        )}

        {error && <p className="onb-error">{error}</p>}

        <div className="onb-actions">
          {i > 0 && <button className="btn-ghost" disabled={busy} onClick={back}>Back</button>}

          {/* The fill-in steps can each be passed over; the packet at the end
              is the finish line, so Skip here advances rather than commits. */}
          {step === 'sphere' ? (
            <>
              <button className="btn-ghost" disabled={busy} onClick={() => { setSphereName(''); setAreaName(''); setI(steps.indexOf('packet')) }}>Skip</button>
              <button className="btn-primary" disabled={busy || !sphereName.trim()} onClick={next}>Next</button>
            </>
          ) : step === 'goal' ? (
            <>
              <button className="btn-ghost" disabled={busy} onClick={() => { setGoalTitle(''); setGoalEnd(''); setGoalTried(false); next() }}>Skip</button>
              <button className="btn-primary" disabled={busy || !goalWanted} onClick={goalNext}>Next</button>
            </>
          ) : step === 'log' ? (
            <>
              <button className="btn-ghost" disabled={busy} onClick={() => { setFirstLog(''); next() }}>Skip</button>
              <button className="btn-primary" disabled={busy || !firstLog.trim()} onClick={next}>Next</button>
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
