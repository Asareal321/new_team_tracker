// The study tab's logic: which question comes next, the order of its choices,
// and how each case is going. Pure. Checked by scripts/check-study.mjs.

// A stable shuffle keyed by a string, so a question's choices stay in the
// same order while you're looking at it and change on the next visit (the
// key includes a per-session salt). Answer letters can't be memorized.
export function hashOf(s) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0 }
  return h
}

export function shuffledOrder(n, key) {
  const order = Array.from({ length: n }, (_, i) => i)
  let h = hashOf(key)
  for (let i = n - 1; i > 0; i--) {
    h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0
    const j = h % (i + 1)
    ;[order[i], order[j]] = [order[j], order[i]]
  }
  return order
}

// How you've done on each question: attempts, how many right, and whether
// the latest try was right. Attempts arrive newest first.
export function questionRecord(attempts = []) {
  const rec = {}
  for (const a of attempts) {
    const r = rec[a.question_id] || (rec[a.question_id] = { tries: 0, right: 0, lastCorrect: null })
    r.tries += 1
    if (a.correct) r.right += 1
    if (r.lastCorrect === null) r.lastCorrect = !!a.correct
  }
  return rec
}

// What to ask next. Never seen first, then the ones you got wrong last time,
// then the rest, least recently right last. Ties broken by the session salt
// so two sessions don't walk the bank in the same order. `skip` is the
// question just answered, so it never comes straight back.
export function nextQuestion(questions = [], record = {}, { salt = '', skip = null } = {}) {
  const pool = questions.filter(q => q.id !== skip)
  if (!pool.length) return questions[0] || null
  const rank = q => {
    const r = record[q.id]
    if (!r) return 0
    if (r.lastCorrect === false) return 1
    return 2 + r.right / Math.max(r.tries, 1)
  }
  return [...pool].sort((a, b) => rank(a) - rank(b) || hashOf(salt + a.id) - hashOf(salt + b.id))[0]
}

// Accuracy per case, for the bars: questions seen, and share right on the
// latest try of each.
export function caseProgress(questions = [], record = {}) {
  const out = {}
  for (const q of questions) {
    const c = out[q.case_name] || (out[q.case_name] = { total: 0, seen: 0, right: 0 })
    c.total += 1
    const r = record[q.id]
    if (r) { c.seen += 1; if (r.lastCorrect) c.right += 1 }
  }
  return out
}

export function normalEmail(s) {
  const e = String(s || '').trim().toLowerCase()
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) ? e : null
}
