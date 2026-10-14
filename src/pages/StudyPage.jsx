import { useCallback, useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth } from '../auth/AuthContext'
import { shuffledOrder, questionRecord, nextQuestion, caseProgress, normalEmail } from '../lib/study'
import './StudyPage.css'

// Practice for BUS 2257, in the style of the cases: a short scenario, a
// number to work out or an entry to choose, and five plausible answers —
// every wrong one is a mistake people actually make. The explanation says
// which mistake each tempting answer is.
//
// Visible only to accounts the database allows (see migration-study.sql);
// the questions come from there too, so nobody else's browser ever has them.

const LETTERS = 'ABCDE'
const SALT = Math.random().toString(36).slice(2)

export default function StudyPage() {
  const { user } = useAuth()
  const [status, setStatus] = useState('loading') // loading | denied | ready | unmigrated
  const [questions, setQuestions] = useState([])
  const [attempts, setAttempts] = useState([])
  const [owner, setOwner] = useState(false)
  const [caseFilter, setCaseFilter] = useState('')
  const [current, setCurrent] = useState(null)
  const [picked, setPicked] = useState(null)
  const [session, setSession] = useState({ asked: 0, right: 0 })

  const load = useCallback(async () => {
    const can = await supabase.rpc('study_can_view')
    if (can.error) { setStatus('unmigrated'); return }
    if (!can.data) { setStatus('denied'); return }
    const [q, a, o] = await Promise.all([
      supabase.from('study_questions').select('*').order('position'),
      supabase.from('study_attempts').select('question_id, correct, answered_at')
        .eq('user_id', user.id).order('answered_at', { ascending: false }).limit(2000),
      supabase.rpc('study_is_owner'),
    ])
    setQuestions(q.data || [])
    setAttempts(a.data || [])
    setOwner(!!o.data)
    setStatus('ready')
  }, [user])

  useEffect(() => { if (user) load() }, [user, load])

  const record = useMemo(() => questionRecord(attempts), [attempts])
  const cases = useMemo(() => [...new Set(questions.map(q => q.case_name))], [questions])
  const pool = useMemo(
    () => (caseFilter ? questions.filter(q => q.case_name === caseFilter) : questions),
    [questions, caseFilter],
  )
  const progress = useMemo(() => caseProgress(questions, record), [questions, record])

  // A new question whenever the pool changes or the current one is answered
  // and moved past.
  useEffect(() => {
    if (status !== 'ready') return
    if (!current || !pool.some(q => q.id === current.id)) {
      setCurrent(nextQuestion(pool, record, { salt: SALT }))
      setPicked(null)
    }
  // record changes on every answer; only the pool should swap the question.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pool, status])

  const order = useMemo(
    () => (current ? shuffledOrder(current.choices.length, `${current.id}:${SALT}:${session.asked}`) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [current],
  )

  async function choose(original) {
    if (picked !== null || !current) return
    setPicked(original)
    const correct = original === current.answer
    setSession(s => ({ asked: s.asked + 1, right: s.right + (correct ? 1 : 0) }))
    const row = { question_id: current.id, correct, answered_at: new Date().toISOString() }
    setAttempts(prev => [row, ...prev])
    await supabase.from('study_attempts').insert({ question_id: current.id, correct })
  }

  function next() {
    setCurrent(nextQuestion(pool, record, { salt: SALT + session.asked, skip: current?.id }))
    setPicked(null)
  }

  // 1–5 picks a choice, Enter moves on.
  useEffect(() => {
    const onKey = e => {
      if (e.target.closest?.('input, textarea, select')) return
      if (picked === null && /^[1-5]$/.test(e.key) && order[Number(e.key) - 1] !== undefined) choose(order[Number(e.key) - 1])
      else if (picked !== null && (e.key === 'Enter' || e.key === 'ArrowRight')) next()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (status === 'loading') return <div className="loading">Loading…</div>
  if (status === 'denied') return <Navigate to="/" replace />
  if (status === 'unmigrated') {
    return <div className="sd-page"><p className="sd-sub">The study tab needs <code>migration-study.sql</code> run in Supabase.</p></div>
  }

  const answered = picked !== null
  return (
    <div className="sd-page">
      <header className="sd-head">
        <div>
          <p className="sd-eyebrow">BUS 2257 · Term one to M1</p>
          <h1>Study</h1>
        </div>
        <p className="sd-score">
          {session.asked
            ? <><strong>{session.right}</strong> / {session.asked} this session</>
            : `${questions.length} questions`}
        </p>
      </header>

      <div className="sd-cases" role="tablist" aria-label="Case">
        <button role="tab" aria-selected={!caseFilter} className={`sd-case${!caseFilter ? ' on' : ''}`} onClick={() => setCaseFilter('')}>All cases</button>
        {cases.map(c => {
          const p = progress[c] || { total: 0, seen: 0, right: 0 }
          return (
            <button key={c} role="tab" aria-selected={caseFilter === c}
              className={`sd-case${caseFilter === c ? ' on' : ''}`} onClick={() => setCaseFilter(c)}>
              <span>{c}</span>
              <span className="sd-case-bar" aria-hidden="true">
                <span style={{ width: `${p.total ? (p.right / p.total) * 100 : 0}%` }} />
              </span>
              <span className="sd-case-n">{p.right}/{p.total}</span>
            </button>
          )
        })}
      </div>

      {current && (
        <article className="sd-card">
          <p className="sd-tag">{current.case_name} · {current.topic}</p>
          <div className="sd-stem">{current.stem}</div>
          <ol className="sd-choices">
            {order.map((orig, n) => {
              const right = orig === current.answer
              const state = !answered ? '' : right ? ' right' : orig === picked ? ' wrong' : ' dim'
              return (
                <li key={orig}>
                  <button className={`sd-choice${state}`} onClick={() => choose(orig)} disabled={answered}>
                    <span className="sd-letter">{LETTERS[n]}</span>
                    <span>{current.choices[orig]}</span>
                  </button>
                </li>
              )
            })}
          </ol>
          {answered && (
            <div className={`sd-why ${picked === current.answer ? 'ok' : 'no'}`}>
              <p className="sd-verdict">{picked === current.answer ? 'Correct.' : `Not quite — it's ${LETTERS[order.indexOf(current.answer)]}.`}</p>
              <p>{current.explanation}</p>
              <button className="btn-primary" onClick={next}>Next question</button>
            </div>
          )}
          {!answered && <p className="sd-hint">Work it on paper first. Keys 1–5 pick an answer.</p>}
        </article>
      )}

      {owner && <AccessPanel />}
    </div>
  )
}

// Who else can open this tab. Owner only; the database enforces that too.
function AccessPanel() {
  const [emails, setEmails] = useState([])
  const [draft, setDraft] = useState('')
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    const { data } = await supabase.from('study_access').select('email').order('added_at')
    setEmails((data || []).map(r => r.email))
  }, [])
  useEffect(() => { refresh() }, [refresh])

  async function add(e) {
    e.preventDefault()
    const email = normalEmail(draft)
    if (!email) { setError('That isn’t an email address.'); return }
    const { error: err } = await supabase.from('study_access').insert({ email })
    if (err) { setError(err.code === '23505' ? 'Already added.' : err.message); return }
    setDraft(''); setError(''); refresh()
  }
  async function remove(email) {
    if (!window.confirm(`Remove ${email}? They lose the Study tab on their next load.`)) return
    await supabase.from('study_access').delete().eq('email', email)
    refresh()
  }

  return (
    <section className="sd-access">
      <h2>Who can see this tab</h2>
      <p className="sd-sub">You, plus anyone listed here. They see it when they sign in with this email.</p>
      <ul>
        {emails.map(e => (
          <li key={e}><span>{e}</span><button className="btn-ghost btn-sm" onClick={() => remove(e)}>Remove</button></li>
        ))}
        {!emails.length && <li className="sd-sub">Nobody else yet.</li>}
      </ul>
      <form onSubmit={add} className="sd-add">
        <input type="email" value={draft} onChange={e => { setDraft(e.target.value); setError('') }} placeholder="friend@uwo.ca" aria-label="Email to give access" />
        <button className="btn-primary" type="submit">Give access</button>
      </form>
      {error && <p className="sd-err" role="alert">{error}</p>}
    </section>
  )
}
