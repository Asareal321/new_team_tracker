// Searching the archive.
//
// The archive is a month calendar, which is the right shape for "what did I do
// last Tuesday" and the wrong one for "what was that thing about the invoice" —
// the case where you've forgotten the date is exactly the case where a calendar
// can't help. So search cuts across every month at once and answers with dates
// rather than asking for one.
//
// It looks at four things, because any of them can be the bit you remember:
// the title, the notes, the project, and the bodies of the updates written
// against the task. Updates matter more than they look — "the invoice thing"
// is often a sentence you typed into an update weeks ago, not the title you
// gave the task on day one.

// Terms are ANDed, not ORed. Typing more words should narrow the result; with
// OR, a second word makes the list longer, which is the opposite of what
// anyone means by refining a search.
export function parseQuery(query) {
  return String(query || '').toLowerCase().split(/\s+/).filter(Boolean)
}

// Everything about a task worth matching against, as one lowercase string.
// Built per search rather than stored: the archive is small, and a stale index
// would be worse than a fast one.
export function searchableText(task, { projectName, updatesForTask } = {}) {
  const parts = [
    task.title,
    task.notes,
    projectName?.(task.project_id),
    ...(updatesForTask?.(task.id) || []).map(u => u.body),
  ]
  return parts.filter(Boolean).join('   ').toLowerCase()
}

export function matches(task, terms, helpers) {
  if (!terms.length) return true
  const hay = searchableText(task, helpers)
  // Substring rather than word-boundary: "invoic" should find "invoicing", and
  // a half-typed word is the normal state of a search box.
  return terms.every(t => hay.includes(t))
}

// The matching tasks, newest first. Sorted by the same timestamp the calendar
// files them under, so a result's date is the date you'd have found it on.
export function searchArchive(tasks, query, helpers = {}) {
  const terms = parseQuery(query)
  if (!terms.length) return []
  return tasks
    .filter(t => matches(t, terms, helpers))
    .sort((a, b) => stamp(b) - stamp(a))
}

export function stamp(task) {
  return new Date(task.archived_at || task.updated_at || task.created_at).getTime()
}

// Which part of a task actually matched, so a result can say why it's there
// when the reason isn't the title. Returns the first update whose body matches,
// or null.
export function matchingUpdate(task, terms, updatesForTask) {
  if (!terms.length) return null
  const inTitle = terms.every(t => String(task.title || '').toLowerCase().includes(t))
  if (inTitle) return null
  return (updatesForTask?.(task.id) || []).find(u =>
    terms.some(t => String(u.body || '').toLowerCase().includes(t))
  ) || null
}

// Split text into [{ text, hit }] runs so the matched parts can be marked.
// Case is preserved — the segments are slices of the original, not of the
// lowercased copy used to find them.
export function highlight(text, terms) {
  const src = String(text || '')
  if (!terms.length || !src) return [{ text: src, hit: false }]
  const lower = src.toLowerCase()

  // Collect every occurrence of every term, then merge overlaps — otherwise
  // searching "arch archive" would mark the same run twice and the slices
  // would come out interleaved and doubled.
  const spans = []
  for (const term of terms) {
    if (!term) continue
    let from = 0
    for (;;) {
      const at = lower.indexOf(term, from)
      if (at === -1) break
      spans.push([at, at + term.length])
      from = at + term.length
    }
  }
  if (!spans.length) return [{ text: src, hit: false }]
  spans.sort((a, b) => a[0] - b[0])

  const merged = [spans[0]]
  for (const [start, end] of spans.slice(1)) {
    const last = merged[merged.length - 1]
    if (start <= last[1]) last[1] = Math.max(last[1], end)
    else merged.push([start, end])
  }

  const out = []
  let at = 0
  for (const [start, end] of merged) {
    if (start > at) out.push({ text: src.slice(at, start), hit: false })
    out.push({ text: src.slice(start, end), hit: true })
    at = end
  }
  if (at < src.length) out.push({ text: src.slice(at), hit: false })
  return out
}

// A window of an update's body around its first hit, so a long update doesn't
// push the result off the screen to show a word in the middle of it.
export function excerpt(text, terms, radius = 70) {
  const src = String(text || '')
  const lower = src.toLowerCase()
  let at = -1
  for (const term of terms) {
    const i = lower.indexOf(term)
    if (i !== -1 && (at === -1 || i < at)) at = i
  }
  if (at === -1 || src.length <= radius * 2) return src
  const start = Math.max(0, at - radius)
  const end = Math.min(src.length, at + radius)
  return (start > 0 ? '…' : '') + src.slice(start, end).trim() + (end < src.length ? '…' : '')
}
