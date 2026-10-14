import { Link } from 'react-router-dom'
import { useSpheres } from '../context/SpheresContext'
import { balanceNudge } from '../lib/spheres'
import { localDay, seedByKey } from '../lib/garden'
import LogBox from '../components/LogBox'
import QuestStrip from '../components/QuestStrip'
import SphereTree from '../components/SphereTree'
import Onboarding from '../components/Onboarding'
import { useAuth } from '../auth/AuthContext'
import { useTeam } from '../context/TeamContext'
import { useGarden } from '../context/GardenContext'
import { setVisibility } from '../lib/community'
import { PUBLIC_PROFILE_PACKET } from '../lib/rewards'
import { requestTour } from '../lib/tourState'
import { projectColorIndex } from '../lib/projectColors'
import './Spheres.css'

// Today: what you moved, and where everything stands.
//
// The log box first, because that is the reason to open the app — and its
// picker is the mosaic, every area and sphere sized by the last month's logs,
// so neglect is something you see while you choose rather than something you
// are told. Then today's logs, so you can see the day add up.

// First run, personal workspace only — a community's space isn't yours to set
// up. Everything it writes is real: the area, the sphere, the goal and the log
// are the same rows you'd make by hand, so Today is already yours when it
// closes. Each write is allowed to fail on its own; a setup that half-worked
// still has to end with an onboarded account, or it would come back forever.
function FirstRun() {
  const { user } = useAuth()
  const { currentTeamId } = useTeam() || {}
  const { state: garden, ready, completeOnboarding } = useGarden() || {}
  const { addArea, addSphere, addGoal, addLog } = useSpheres()

  if (!ready || !garden || garden.onboarded || currentTeamId) return null

  return (
    <Onboarding
      displayName={user?.user_metadata?.display_name}
      onFinish={async ({ seedKey, areaName, sphereName, goal, firstLog, isPublic }) => {
        let sphere = null
        if (sphereName) {
          try {
            const area = await addArea(areaName || 'Personal')
            sphere = await addSphere({ areaId: area.id, name: sphereName })
          } catch { sphere = null }
        }
        let goalRow = null
        if (sphere && goal) {
          try { goalRow = await addGoal({ sphereId: sphere.id, ...goal }) } catch { goalRow = null }
        }
        // Visibility needs the community migration; private is the default.
        try { await setVisibility(user.id, !!isPublic) } catch { /* not migrated yet */ }
        // Before the log, so the seed is in the bag and pinned when it plants.
        await completeOnboarding(seedKey, {
          perkPackets: isPublic ? [PUBLIC_PROFILE_PACKET] : [],
        })
        if (sphere && firstLog) {
          try {
            await addLog({ sphereId: sphere.id, goalId: goalRow?.id || null, note: firstLog, quiet: true })
          } catch { /* the log box is right there to try again */ }
        }
        requestTour()
      }}
    />
  )
}

export default function TodayPage() {
  const { spheres, goals, myLogs, loading, error } = useSpheres()
  const now = new Date()
  const today = localDay(now)
  const todays = myLogs.filter(l => localDay(l.logged_at) === today)
  const nudge = balanceNudge({ spheres, logs: myLogs, now })
  const byId = Object.fromEntries(spheres.map(s => [s.id, s]))
  const goalById = Object.fromEntries(goals.map(g => [g.id, g]))

  if (loading) return <div className="loading">Loading…</div>

  const live = spheres.filter(s => !s.archived_at)
  return (
    <div className="sph-page">
      <header className="sph-head">
        <h1>Today</h1>
        <p className="sph-sub">
          {now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          {' · '}{todays.length ? `${todays.length} logged so far` : 'nothing logged yet'}
        </p>
      </header>

      {error && <p className="sph-error">{error}</p>}


      <section className="sph-card">
        <LogBox autoFocus mosaic />
        {nudge && (
          <p className="sph-nudge">
            {nudge.message}{' '}
            <Link to={`/spheres/${nudge.quiet.id}`}>Open {nudge.quiet.name}</Link>
          </p>
        )}
      </section>

      {todays.length > 0 && (
        <section className="sph-section">
          <div className="sph-section-head">
            <h2>Logged today</h2>
            <Link to="/history" className="sph-more">All history</Link>
          </div>
          <ul className="sph-logs">
            {todays.map(l => (
              <li key={l.id} className={`sph-log pc-${projectColorIndex(l.sphere_id)}`}>
                <span className="sph-log-plant" aria-hidden="true">{seedByKey(l.seed_key)?.emoji || '🌱'}</span>
                <span className="sph-log-note">{l.note}</span>
                <span className="sph-log-where">
                  <Link to={`/spheres/${l.sphere_id}`} className="sph-chip">{byId[l.sphere_id]?.name || 'Sphere'}</Link>
                  {l.goal_id && goalById[l.goal_id] && <span className="sph-log-goal">{goalById[l.goal_id].title}</span>}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* The quest glow lights this tab, so the quests have to be here — a
          glow that sends you somewhere with nothing to act on is worse than
          none. Only once there is a sphere to log in, since every quest is
          about logging. */}
      {live.length > 0 && <QuestStrip />}

      {!live.length && (
        <section className="sph-card sph-start">
          <h2>Start with the parts of your life you want to move forward</h2>
          <p>
            An <strong>area</strong> is broad — Academics, Personal, Clubs, Recruiting.
            A <strong>sphere</strong> sits inside one, as broad or as narrow as you like — a
            single class, or the whole of your job search. Add an area in your sphere list, then
            a sphere inside it, and every bit of progress you log there grows its garden.
          </p>
        </section>
      )}

      {/* Phones only: the rail is a bar there, so the tree lives here. */}
      <SphereTree onPage />

      <FirstRun />
    </div>
  )
}
