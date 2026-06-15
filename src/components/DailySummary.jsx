import { useState } from 'react'
import './DailySummary.css'

export default function DailySummary({ tasks, teamMembers, onGenerate }) {
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

  const done = tasks.filter(t => t.status === 'done')
  const inProgress = tasks.filter(t => t.status === 'in_progress')

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
