// Searching the archive.
//
// The calendar answers "what did I do on this day". Search answers "where is
// the thing about X" — the case where the date is exactly what you've lost, so
// it has to cut across every month and hand the date back.

import {
  parseQuery, searchableText, matches, searchArchive, stamp,
  matchingUpdate, highlight, excerpt,
} from '../src/lib/archiveSearch.js'

let pass = 0, fail = 0
function ok(name, cond, detail = '') {
  if (cond) { pass++; console.log(`ok    ${name}`) }
  else { fail++; console.log(`FAIL  ${name}${detail ? `  — ${detail}` : ''}`) }
}

const TASKS = [
  { id: 'a', title: 'Send the invoice to Acme', notes: '', project_id: 'p1', archived_at: '2026-08-01T10:00:00Z' },
  { id: 'b', title: 'Fix the login bug', notes: 'Safari only', project_id: 'p2', archived_at: '2026-08-14T10:00:00Z' },
  { id: 'c', title: 'Weekly review', notes: '', project_id: null, archived_at: '2026-06-02T10:00:00Z' },
  { id: 'd', title: 'Call the accountant', notes: '', project_id: 'p1', archived_at: '2026-07-20T10:00:00Z' },
]
const UPDATES = {
  c: [{ id: 'u1', body: 'Chased the invoicing question with finance again' }],
  d: [{ id: 'u2', body: 'Left a voicemail' }],
}
const helpers = {
  projectName: id => ({ p1: 'Billing', p2: 'Website' })[id] || null,
  updatesForTask: id => UPDATES[id] || [],
}
const find = q => searchArchive(TASKS, q, helpers).map(t => t.id)

// — parsing —

ok('a query splits into terms', parseQuery('one two').length === 2)
ok('extra whitespace is ignored', parseQuery('  one   two  ').join(',') === 'one,two')
ok('an empty query has no terms', parseQuery('   ').length === 0)
ok('a null query has no terms', parseQuery(null).length === 0)

// An empty search must return nothing, not everything — the UI shows the
// calendar in that state, and "no query" quietly meaning "all 400 tasks" is
// how a search box becomes a way to hang the page.
ok('an empty query returns no results', searchArchive(TASKS, '', helpers).length === 0)
ok('a whitespace query returns no results', searchArchive(TASKS, '   ', helpers).length === 0)

// — what gets searched —

ok('the title matches', find('login').join() === 'b')
ok('the notes match', find('safari').join() === 'b')
ok('the project name matches', find('website').join() === 'b')
ok('an update body matches', find('voicemail').join() === 'd')
ok('search is case-insensitive', find('LOGIN').join() === 'b')
ok('a partial word matches', find('invoic').sort().join() === 'a,c',
  'so a half-typed query still finds things')

// The update case is the one worth having: "the invoice thing" is a sentence
// typed weeks later, not the title the task was given on day one.
ok('a task is found by an update alone, not its title', find('finance').join() === 'c')

// — several terms narrow, never widen —

ok('two terms AND together', find('invoice acme').join() === 'a')
ok('a second term narrows the result',
  find('invoic').length > find('invoic acme').length,
  `${find('invoic').length} then ${find('invoic acme').length}`)
ok('terms may match different fields of one task', find('login safari').join() === 'b',
  'title and notes')
ok('an unmatched term excludes the task', find('login mars').length === 0)
ok('nonsense matches nothing', find('zzzz').length === 0)

// — order —

// All four match: 'c' has no "the" in its title, but its update does — which
// is the point of searching updates at all.
// b=Aug 14, a=Aug 1, d=Jul 20, c=Jun 2.
ok('results are newest first', find('the').join() === 'b,a,d,c', find('the').join())
ok('the sort key is the archived date',
  stamp({ archived_at: '2026-08-01T00:00:00Z' }) < stamp({ archived_at: '2026-08-02T00:00:00Z' }))
ok('a task with no archived_at falls back to updated_at',
  stamp({ updated_at: '2026-08-02T00:00:00Z' }) > 0)

// — why a result is here —

const terms = parseQuery('finance')
ok('a non-title match reports the update that matched',
  matchingUpdate(TASKS[2], terms, helpers.updatesForTask)?.id === 'u1')
ok('a title match reports no update',
  matchingUpdate(TASKS[1], parseQuery('login'), helpers.updatesForTask) === null)

// — highlighting —

const runs = highlight('Send the invoice', parseQuery('invoice'))
ok('highlight marks the match', runs.some(r => r.hit && r.text === 'invoice'))
ok('highlight keeps the whole string',
  runs.map(r => r.text).join('') === 'Send the invoice')
ok('highlight preserves the original case',
  highlight('Invoice', parseQuery('invoice')).map(r => r.text).join('') === 'Invoice')
ok('no terms means no marks', highlight('abc', []).every(r => !r.hit))
ok('an unmatched term marks nothing', highlight('abc', parseQuery('z')).every(r => !r.hit))
ok('every occurrence is marked',
  highlight('aa bb aa', parseQuery('aa')).filter(r => r.hit).length === 2)

// Overlapping terms are the trap: without merging, "arch archive" would mark
// the same run twice and the slices would come out doubled.
const overlap = highlight('archive', parseQuery('arch archive'))
ok('overlapping terms do not duplicate text',
  overlap.map(r => r.text).join('') === 'archive',
  overlap.map(r => r.text).join('|'))
ok('overlapping terms merge into one mark',
  overlap.filter(r => r.hit).length === 1)

// — excerpts —

const long = 'x'.repeat(200) + ' needle ' + 'y'.repeat(200)
ok('a long body is trimmed around the hit', excerpt(long, parseQuery('needle')).length < long.length)
ok('the trimmed body still contains the hit',
  excerpt(long, parseQuery('needle')).includes('needle'))
ok('a short body is left alone', excerpt('short one', parseQuery('short')) === 'short one')
ok('a body with no hit is returned as-is', excerpt('abc', parseQuery('zzz')) === 'abc')

// — the searchable blob —

ok('searchable text includes every field',
  ['acme', 'billing'].every(w => searchableText(TASKS[0], helpers).includes(w)))
ok('missing fields do not break it', searchableText({ title: 'x' }, {}) === 'x')
ok('a task with nothing but a title still matches it',
  matches({ id: 'z', title: 'Solo' }, parseQuery('solo'), {}) === true)

console.log(`\n${pass}/${pass + fail} passed`)
process.exit(fail ? 1 : 0)
