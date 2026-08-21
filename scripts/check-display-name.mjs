// The display-name filter.
//
// A name filter's failure modes are asymmetric. Missing a rude name is
// embarrassing; rejecting somebody's actual name tells them their name is
// obscene, which is worse and happens more often than people expect — the
// classic case is Scunthorpe, a real town whose name contains a slur as a
// substring. So the word list matches on word boundaries, and only the short
// slur list matches anywhere.
//
// These cases are the reason the two lists are separate, so they are written
// down rather than left to a comment.

import { checkDisplayName, findProfanity, normalise, MIN_LENGTH, MAX_LENGTH }
  from '../src/lib/displayName.js'

let pass = 0, fail = 0
function ok(name, cond, detail = '') {
  if (cond) { pass++; console.log(`ok    ${name}`) }
  else { fail++; console.log(`FAIL  ${name}${detail ? `  — ${detail}` : ''}`) }
}

const allowed = n => checkDisplayName(n) === null

// — ordinary names go through —

for (const name of [
  'Alice', 'Bob Smith', 'Ada Lovelace', 'Jean-Luc Picard', "O'Brien",
  'Zoë', 'José', 'Anne-Marie', 'Dr Watson', 'X Æ', 'Li Wei', 'MJ',
]) ok(`"${name}" is allowed`, allowed(name), checkDisplayName(name) || '')

// The whole reason word matching is bounded. Every one of these contains a
// blocked word as a substring and is a real name or an ordinary one.
for (const name of [
  'Scunthorpe',      // contains cunt
  'Penistone',       // a real town
  'Cockburn',        // a real surname
  'Dickinson',       // contains dick
  'Assange',         // contains ass
  'Bassett',         // contains ass
  'Hancock',         // contains cock
  'Titchmarsh',      // contains tit
  'Shitake Fan',     // near-miss on shit
  'Analyst Anna',    // contains anal
  'Grape Jelly',     // contains rape
  'Therapist Sam',   // the famous one
  'Klassen',         // contains ass
  'Cumberland',      // contains cum
]) ok(`"${name}" is not a false positive`, allowed(name), checkDisplayName(name) || '')

// — rude names do not —

for (const name of ['fuck', 'Fuck Off', 'shit', 'a cunt', 'big dick', 'Total Wanker']) {
  ok(`"${name}" is blocked`, !allowed(name))
}

// Leetspeak is the obvious way around a word list.
for (const name of ['sh1t', 'a55', '$hit', 'd1ck', 'B1tch', 'w@nker']) {
  ok(`"${name}" is blocked despite the spelling`, !allowed(name))
}

// Spacing out a slur is the other obvious way, so slurs collapse first.
ok('a spaced-out slur is blocked', !allowed('n i g g e r'))
ok('a punctuated slur is blocked', !allowed('f.a.g.g.o.t'))

// A slur embedded in a longer word is still blocked — that is what the second
// list is for, and the asymmetry with WORDS is deliberate.
ok('an embedded slur is blocked', !allowed('xxfaggotxx'))
ok('an embedded ordinary word is not', allowed('Bassett'))

// — length and shape —

ok('a single character is too short', !allowed('A'))
ok('the minimum length is allowed', allowed('Al'))
ok('an over-long name is rejected', !allowed('x'.repeat(MAX_LENGTH + 1)))
ok('the maximum length is allowed', allowed('a'.repeat(MAX_LENGTH)))
ok('an empty name is rejected', !allowed(''))
ok('whitespace only is rejected', !allowed('    '))
ok('digits alone are rejected', !allowed('12345'), 'a name needs a letter')
ok('a name may contain digits', allowed('Agent 99'))
ok('null does not throw', checkDisplayName(null) !== null)
ok('undefined does not throw', checkDisplayName(undefined) !== null)

ok(`MIN_LENGTH is ${MIN_LENGTH}`, MIN_LENGTH === 2)

// — normalisation, stated —

ok('case is folded', normalise('FuCk') === 'fuck')
ok('punctuation becomes a separator', normalise('a.b') === 'a b')
ok('digits map to letters', normalise('sh1t') === 'shit')
ok('leading and trailing space is dropped', normalise('  hi  ') === 'hi')

// — what was found —

ok('the blocked word is reported', findProfanity('you fuck') === 'fuck')
ok('a clean name reports nothing', findProfanity('Alice') === null)

console.log(`\n${pass}/${pass + fail} passed`)
process.exit(fail ? 1 : 0)
