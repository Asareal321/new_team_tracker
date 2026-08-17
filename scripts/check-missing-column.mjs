// A database that's behind on migrations should cost you the feature that
// needs the new column — and nothing else.
//
// garden_state is written with an upsert of the whole row, so before this an
// un-run migration failed *every* garden write: finishing a task, earning
// coins, the streak, all of it, because the row carried one field the database
// didn't know about. Those writes weren't changing the new column; it was just
// along for the ride.
//
// The rule, restated here against the same helpers GardenContext uses:
//   • a missing column NOT in this write's patch  → dropped, write proceeds
//   • a missing column that IS in this write's patch → the write fails, loudly
//
// The second half is not politeness. Dropping it would let a quest claim pay
// its coins (that column exists) without recording the claim, so the same
// quest could be claimed again after every reload.

let pass = 0, fail = 0
function ok(name, cond, detail = '') {
  if (cond) { pass++; console.log(`ok    ${name}`) }
  else { fail++; console.log(`FAIL  ${name}${detail ? `  — ${detail}` : ''}`) }
}

// — the parser, matching GardenContext.missingColumnFrom —

function missingColumnFrom(error) {
  if (!error) return null
  const m = /Could not find the '([^']+)' column/.exec(error.message || '')
  if (!m) return null
  if (error.code && error.code !== 'PGRST204') return null
  return m[1]
}

const real = {
  code: 'PGRST204',
  message: "Could not find the 'quests' column of 'garden_state' in the schema cache",
}

ok('the real PostgREST error names its column', missingColumnFrom(real) === 'quests')
ok('a null error names nothing', missingColumnFrom(null) === null)
ok('an unrelated error names nothing',
  missingColumnFrom({ code: '23505', message: 'duplicate key value' }) === null)
// A different code carrying similar words is somebody else's problem — an RLS
// denial must not be reported to the user as a missing migration.
ok('a matching message under the wrong code is ignored',
  missingColumnFrom({ code: '42501', message: "Could not find the 'x' column" }) === null)
ok('a matching message with no code is accepted',
  missingColumnFrom({ message: "Could not find the 'share_code' column" }) === 'share_code')

// — what a write does about it —

// The row as sent: everything, because it's an upsert.
const ROW = { coins: 10, seeds: 2, daily: {}, streak: {}, stats: {}, quests: {} }

function attemptWrite({ patch, missing }) {
  const payload = { ...ROW }
  for (const col of missing) {
    if (col in patch) return { ok: false, failedOn: col, sent: null }
    delete payload[col]
  }
  return { ok: true, failedOn: null, sent: Object.keys(payload).sort() }
}

const noQuests = ['quests']

// Finishing a task writes coins, daily and streak. None of them is `quests`.
const finish = attemptWrite({ patch: { coins: 70, daily: {}, streak: {} }, missing: noQuests })
ok('finishing a task still writes without the quests column', finish.ok === true)
ok('the unknown column is left out of the write',
  finish.sent && !finish.sent.includes('quests'))
ok('every other column is still written',
  finish.sent && ['coins', 'seeds', 'daily', 'streak', 'stats'].every(k => finish.sent.includes(k)))

// Claiming a quest writes `quests`. That one cannot be quietly dropped.
const claim = attemptWrite({ patch: { coins: 70, quests: { day: 'x', claimed: ['a'] } }, missing: noQuests })
ok('claiming a quest fails rather than half-succeeding', claim.ok === false)
ok('the failure names the column that caused it', claim.failedOn === 'quests')
ok('a failed claim sends nothing at all', claim.sent === null)

// The exploit the failure prevents, stated as a test: if the claim were
// dropped instead, coins would rise while the claim record did not.
const wouldPayTwice = (dropped) => dropped === true
ok('a dropped claim would be farmable, so it must not be dropped',
  wouldPayTwice(claim.ok) === false)

// More than one migration outstanding.
const bothMissing = ['quests', 'share_code']
ok('several missing columns are all dropped',
  attemptWrite({ patch: { coins: 1 }, missing: bothMissing }).ok === true)
ok('a write touching any missing column still fails',
  attemptWrite({ patch: { share_code: 'ABC' }, missing: bothMissing }).failedOn === 'share_code')

// A fully migrated database is unaffected by any of this.
const healthy = attemptWrite({ patch: { quests: {} }, missing: [] })
ok('a migrated database writes everything', healthy.ok === true)
ok('a migrated database drops nothing', healthy.sent.length === Object.keys(ROW).length)

// — detection on load —

// select('*') on a table that's behind returns a row without those keys.
const DEFAULT_KEYS = ['coins', 'seeds', 'daily', 'streak', 'stats', 'quests']
const absentFrom = row => DEFAULT_KEYS.filter(k => !(k in row))

ok('a row missing quests is spotted on load',
  absentFrom({ coins: 0, seeds: 0, daily: {}, streak: {}, stats: {} }).join() === 'quests')
ok('a complete row reports nothing missing',
  absentFrom({ coins: 0, seeds: 0, daily: {}, streak: {}, stats: {}, quests: {} }).length === 0)
// A column present but null is a column that exists — nothing to run.
ok('a null value is not a missing column',
  absentFrom({ coins: 0, seeds: 0, daily: {}, streak: {}, stats: {}, quests: null }).length === 0)

console.log(`\n${pass}/${pass + fail} passed`)
process.exit(fail ? 1 : 0)
