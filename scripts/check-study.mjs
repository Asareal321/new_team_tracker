import { shuffledOrder, questionRecord, nextQuestion, caseProgress, normalEmail } from '../src/lib/study.js'
import { readFileSync } from 'fs'

let pass = 0, fail = 0
function ok(name, cond, detail = '') {
  if (cond) { pass++; console.log(`ok    ${name}`) }
  else { fail++; console.log(`FAIL  ${name}${detail ? `  — ${detail}` : ''}`) }
}

const o = shuffledOrder(5, 'q1:salt')
ok('a shuffle is a permutation', [...o].sort().join() === '0,1,2,3,4')
ok('and stable for the same key', shuffledOrder(5, 'q1:salt').join() === o.join())
ok('and different for another key, usually', ['a', 'b', 'c', 'd'].some(k => shuffledOrder(5, k).join() !== o.join()))

const att = [
  { question_id: 'a', correct: false }, { question_id: 'a', correct: true },
  { question_id: 'b', correct: true },
]
const rec = questionRecord(att)
ok('latest attempt decides lastCorrect', rec.a.lastCorrect === false && rec.a.tries === 2 && rec.a.right === 1)

const Q = [{ id: 'a', case_name: 'X' }, { id: 'b', case_name: 'X' }, { id: 'c', case_name: 'Y' }]
ok('unseen questions come first', nextQuestion(Q, rec).id === 'c')
ok('then ones you got wrong', nextQuestion(Q.filter(q => q.id !== 'c'), rec).id === 'a')
ok('never the one just answered', nextQuestion(Q, rec, { skip: 'c' }).id === 'a')
ok('a one-question bank still returns it', nextQuestion([Q[0]], rec, { skip: 'a' }).id === 'a')
const cp = caseProgress(Q, rec)
ok('case progress counts seen and right', cp.X.seen === 2 && cp.X.right === 1 && cp.Y.seen === 0)

ok('emails are lower-cased', normalEmail(' Pat@Example.COM ') === 'pat@example.com')
ok('junk is refused', normalEmail('not an email') === null)

// The bank itself, read from the migration: every answer index is in range.
const sql = readFileSync('migration-study.sql', 'utf8')
const rows = [...sql.matchAll(/\$q\$(\[.*?\])\$q\$::jsonb, (\d+),/gs)]
ok('the migration carries a real bank', rows.length >= 30, String(rows.length))
ok('every answer points at a choice', rows.every(([, c, a]) => Number(a) < JSON.parse(c).length))
ok('every question has at least four choices', rows.every(([, c]) => JSON.parse(c).length >= 4))
ok('the owner is built in', /'asanichols07@gmail\.com'/.test(sql))
ok('re-running the first migration keeps the generated bank', /id not like 'g-%'/.test(sql))

const bank = readFileSync('migration-study-bank.sql', 'utf8')
const brows = [...bank.matchAll(/\$q\$(\[.*?\])\$q\$::jsonb, (\d+),/gs)]
ok('the generated bank is large', brows.length >= 300, String(brows.length))
ok('every generated question has five distinct choices', brows.every(([, c]) => { const a = JSON.parse(c); return a.length === 5 && new Set(a).size === 5 }))
const ids = [...bank.matchAll(/\(\$q\$(g-[a-z]+-\d+)\$q\$/g)].map(x => x[1])
ok('generated ids are unique', new Set(ids).size === ids.length && ids.length === brows.length)

console.log(`\n${pass}/${pass + fail} passed`)
process.exit(fail ? 1 : 0)
