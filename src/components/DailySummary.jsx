import { useState } from 'react'
import './DailySummary.css'

function todayStr() { return new Date().toISOString().slice(0, 10) }

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

export default function DailySummary({ tasks, teamMembers, projects = [], taskUpdates = [], onGenerate }) {
  const [draft, setDraft] = useState(null)
  const [copied, setCopied] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState(null)

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  async function handleGenerate() {
    setGenerating(true)
    setError(null)
    try {
      const summary = await onGenerate()
      setDraft(summary)
    } catch (err) {
      setError(err.message || 'Failed to generate summary')
    } finally {
      setGenerating(false)
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(draft)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const done       = tasks.filter(t => t.status === 'done')
  const inProgress = tasks.filter(t => t.status === 'in_progress')

  // Build today's update groups, sorted by project
  function buildTodaysGroups() {
    const todayUpdates = taskUpdates.filter(u => u.created_at.slice(0, 10) === todayStr())
    if (!todayUpdates.length) return []

    // Collect unique task IDs that have updates today
    const taskIdsWithUpdates = [...new Set(todayUpdates.map(u => u.task_id))]

    // For each task, gather its updates and find its project
    const byProject = {}
    taskIdsWithUpdates.forEach(taskId => {
      const task = tasks.find(t => t.id === taskId)
      if (!task) return
      const projectKey = task.project_id || '__general__'
      if (!byProject[projectKey]) byProject[projectKey] = { project: projects.find(p => p.id === task.project_id) || null, items: [] }
      byProject[projectKey].items.push({
        task,
        updates: todayUpdates.filter(u => u.task_id === taskId).sort((a, b) => new Date(a.created_at) - new Date(b.created_at)),
      })
    })

    // Sort: named projects first (by name), then general
    return Object.values(byProject).sort((a, b) => {
      if (!a.project && b.project) return 1
      if (a.project && !b.project) return -1
      if (a.project && b.project) return a.project.name.localeCompare(b.project.name)
      return 0
    })
  }

  const todaysGroups = buildTodaysGroups()
  const totalUpdates = todaysGroups.reduce((n, g) => n + g.items.reduce((m, i) => m + i.updates.length, 0), 0)

  return (
    <div className="summary">
      <div className="summary-header">
        <div>
          <h2>Daily Summary</h2>
          <p className="summary-date">{today}</p>
        </div>
        <button className="btn-primary" onClick={handleGenerate} disabled={generating}>
          {generating ? 'Generating…' : draft ? 'Regenerate with Claude' : 'Generate with Claude'}
        </button>
      </div>

      <div className="summary-stats">
        <div className="stat">
          <span className="stat-num">{done.length}</span>
          <span className="stat-label">Completed today</span>
        </div>
        <div className="stat">
          <span className="stat-num">{inProgress.length}</span>
          <span className="stat-label">In progress</span>
        </div>
        <div className="stat">
          <span className="stat-num">{tasks.filter(t => t.status === 'todo').length}</span>
          <span className="stat-label">Still to do</span>
        </div>
      </div>

      {error && <div className="summary-error">{error}</div>}

      {/* Today's updates feed */}
      <div className="updates-feed">
        <div className="updates-feed-header">
          <span className="updates-feed-title">Today's updates</span>
          {totalUpdates > 0 && <span className="updates-feed-count">{totalUpdates}</span>}
        </div>

        {todaysGroups.length === 0 ? (
          <p className="updates-feed-empty">No updates posted today yet.</p>
        ) : (
          todaysGroups.map((group, gi) => (
            <div key={gi} className="updates-feed-group">
              <div className="updates-feed-group-label">
                {group.project ? group.project.name : 'General Tasks'}
              </div>
              {group.items.map(({ task, updates }) => (
                <div key={task.id} className="updates-feed-task">
                  <div className="updates-feed-task-name">
                    <span className={`updates-feed-priority dot-${task.priority}`} />
                    {task.title}
                  </div>
                  {updates.map(u => (
                    <div key={u.id} className="updates-feed-update">
                      <span className="updates-feed-body">{u.body}</span>
                      <span className="updates-feed-meta">
                        {u.profiles?.display_name && <>{u.profiles.display_name} · </>}
                        {formatTime(u.created_at)}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      {!draft && !generating && !error && (
        <div className="summary-placeholder">
          <p>Click <strong>Generate with Claude</strong> to draft today's update email from your current tasks.</p>
          <p>The draft follows the Daily Update template and can be edited before sending.</p>
        </div>
      )}

      {draft && (
        <div className="draft-area">
          <div className="draft-toolbar">
            <span className="draft-label">Edit before sending</span>
            <button className="btn-copy" onClick={handleCopy}>
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>
          <textarea
            className="draft-text"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            rows={Math.max(20, draft.split('\n').length + 2)}
            spellCheck
          />
        </div>
      )}
    </div>
  )
}
