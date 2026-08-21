// Checking a display name before it goes on the directory.
//
// A display name is now searchable by strangers and sits next to a garden on
// someone else's screen, which is a different thing from a label you chose for
// yourself. So it gets a filter.
//
// Two rules, and the split between them is the whole design:
//
//   • WORDS are matched on token boundaries. "Scunthorpe" contains a slur as a
//     substring and is a real place; matching substrings would reject people's
//     actual names, which is a worse failure than letting a rude one through.
//   • SLURS are matched anywhere, because the harm of missing one outweighs the
//     cost of a rare false positive, and nobody's name legitimately contains
//     these.
//
// Leetspeak is normalised first, so "sh1t" and "$hit" are the same word as
// "shit". This is a basic filter, not a moderation system: it stops the
// obvious, and it is not a substitute for being able to report a name.
//
// The same lists exist in migration-community.sql, because a client-side check
// is a courtesy and the database is the enforcement. Keep them in step.

// Positional twin of the translate() call in migration-community.sql. Keep the
// two in step; anything here that isn't there is a check the database won't
// make, which is the one that counts.
const LEET = {
  '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '8': 'b',
  '@': 'a', '$': 's', '!': 'i', '|': 'i', '+': 't',
}

// Blocked as whole words.
const WORDS = [
  'anal', 'anus', 'arse', 'arsehole', 'ass', 'asshole', 'bastard', 'bitch',
  'bollocks', 'boner', 'boob', 'boobs', 'bugger', 'bullshit', 'clit', 'cock',
  'crap', 'cum', 'cunt', 'dick', 'dickhead', 'dildo', 'douche', 'dyke',
  'ejaculate', 'erection', 'fag', 'faggot', 'fanny', 'fuck', 'fucker',
  'fucking', 'goddamn', 'handjob', 'hoe', 'horny', 'jerkoff', 'jizz', 'knob',
  'labia', 'milf', 'minge', 'motherfucker', 'nazi', 'nigga', 'nigger', 'nonce',
  'orgasm', 'paedo', 'paedophile', 'pedo', 'penis', 'piss', 'poon', 'porn',
  'prick', 'pube', 'pussy', 'queer', 'rape', 'rapist', 'retard', 'retarded',
  'rimjob', 'scrotum', 'semen', 'shag', 'shit', 'shite', 'slut', 'spastic',
  'spunk', 'testicle', 'tit', 'tits', 'titty', 'tosser', 'tranny', 'turd',
  'twat', 'vagina', 'wank', 'wanker', 'whore', 'wog',
]

// Blocked anywhere in the string, embedded or not.
// Kept deliberately short. Every entry has to be a string that cannot appear
// inside an ordinary word — "rapist" was here and blocked "Therapist Sam",
// "spic" would block "Spice", "coon" would block "Raccoon". All three are
// caught by the word list instead, on token boundaries, where they belong.
const SLURS = [
  'nigger', 'nigga', 'faggot', 'tranny', 'kike', 'chink', 'wetback',
]

// Lowercase, de-leet, and reduce anything that isn't a letter to a space, so
// "f.u.c.k" and "f_u_c_k" collapse to one word.
export function normalise(name) {
  const lowered = String(name || '').toLowerCase()
  let out = ''
  for (const ch of lowered) out += (ch in LEET ? LEET[ch] : ch)
  return out.replace(/[^a-z]+/g, ' ').trim()
}

// The collapsed form, for the embedded check: "n i g g e r" spaced out to
// dodge the word list is still the word.
function collapsed(name) {
  return normalise(name).replace(/\s+/g, '')
}

export function findProfanity(name) {
  const norm = normalise(name)
  const tokens = norm.split(' ').filter(Boolean)
  const hit = tokens.find(t => WORDS.includes(t))
  if (hit) return hit
  const flat = collapsed(name)
  return SLURS.find(s => flat.includes(s)) || null
}

export const MIN_LENGTH = 2
export const MAX_LENGTH = 32

// null when the name is fine; otherwise the sentence to show.
export function checkDisplayName(name) {
  const trimmed = String(name || '').trim()
  if (trimmed.length < MIN_LENGTH) return `A name needs at least ${MIN_LENGTH} characters.`
  if (trimmed.length > MAX_LENGTH) return `A name can be at most ${MAX_LENGTH} characters.`
  if (!/[a-z]/i.test(trimmed)) return 'A name needs at least one letter.'
  if (findProfanity(trimmed)) return 'That name isn’t allowed. Pick another.'
  return null
}
