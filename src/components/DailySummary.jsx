import { useState } from 'react'
import './DailySummary.css'

export default function DailySummary({ tasks, team }) {
  const [draft, setDraft] = useState(null)
  const [copied, setCopied] = useState(false)

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  function generateDraft() {
    const done = tasks.filter(t => t.status === 'done')
    const inProgress = tasks.filter(t => t.status === 'in_progress')
    const todo = tasks.filter(t => t.status === 'todo')

    const ownerSections = team.map(member => {
      const memberDone = done.filter(t => t.owner === member)
      const memberInProgress = inProgress.filter(t => t.owner === member)
      const memberTodo = todo.filter(t => t.owner === member)

      if (!memberDone.length && !memberInProgress.length && !memberTodo.length) return null

      let section = `### ${member}\n`

      if (memberDone.length) {
        section += `\n**Completed**\n`
        memberDone.forEach(t => {
          section += `- ${t.title}`
          if (t.notes) section += ` — ${t.notes}`
          section += `\n`
        })
      }

      if (memberInProgress.length) {
        section += `\n**In Progress**\n`
        memberInProgress.forEach(t => {
          section += `- ${t.title}`
          if (t.notes) section += ` — ${t.notes}`
          section += ` *(add context: what changed today?)*\n`
        })
      }

      if (memberTodo.length) {
        section += `\n**Up Next**\n`
        memberTodo.forEach(t => {
          section += `- ${t.title}\n`
        })
      }

      return section
    }).filter(Boolean)

    const text = [
      `# End of Day — ${today}`,
      ``,
      ownerSections.join('\n---\n\n'),
      ``,
      `---`,
      ``,
      `### Blockers / Risks`,
      `*(add any blockers or risks here)*`,
      ``,
      `### Notes for Tomorrow`,
      `*(anything the team should know going into tomorrow)*`,
    ].join('\n')

    setDraft(text)
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
        <button className="btn-primary" onClick={generateDraft}>
          {draft ? 'Regenerate Draft' : 'Generate Draft'}
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

      {!draft && (
        <div className="summary-placeholder">
          <p>Click <strong>Generate Draft</strong> to auto-draft today's summary from your current tasks.</p>
          <p>The draft will include spaces for you to add context and nuance before sharing.</p>
        </div>
      )}

      {draft && (
        <div className="draft-area">
          <div className="draft-toolbar">
            <span className="draft-label">Edit before sharing</span>
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
          <p className="draft-hint">
            Look for <em>(add context…)</em> markers — fill those in before sending.
          </p>
        </div>
      )}
    </div>
  )
}
