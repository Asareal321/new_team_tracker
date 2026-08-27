// Signing in with Google from the iOS shell.
//
// This is the one auth path with no browser to fall back on: if the callback
// is misread the sheet closes and the app looks like it simply refused to sign
// you in, with nothing on screen to say why. The parsing is therefore pure and
// checked here, because the round-trip itself cannot be tested without a
// device, a Google account and a real consent screen.

import { parseCallback, NATIVE_REDIRECT, CALLBACK_HOOK } from '../src/lib/nativeAuth.js'
import { readFileSync } from 'fs'

let pass = 0, fail = 0
const ok = (name, cond, detail = '') => {
  if (cond) { pass++; console.log(`ok    ${name}`) }
  else { fail++; console.log(`FAIL  ${name}${detail ? `  — ${detail}` : ''}`) }
}

// — the two shapes Supabase can send back —

ok('a PKCE code on the query string is read',
  parseCallback(`${NATIVE_REDIRECT}?code=abc123`).code === 'abc123')

ok('implicit tokens in the fragment are read', (() => {
  const r = parseCallback(`${NATIVE_REDIRECT}#access_token=at&refresh_token=rt`)
  return r.access_token === 'at' && r.refresh_token === 'rt'
})())

// Which one arrives depends on the client's flowType, which lives in another
// file entirely — so both have to work without this one being changed.
ok('a code in the fragment is read too',
  parseCallback(`${NATIVE_REDIRECT}#code=frag`).code === 'frag')
ok('tokens on the query string are read too', (() => {
  const r = parseCallback(`${NATIVE_REDIRECT}?access_token=at&refresh_token=rt`)
  return r.access_token === 'at' && r.refresh_token === 'rt'
})())

// — the failures —

ok('a cancelled consent screen is silent, not an error',
  parseCallback(`${NATIVE_REDIRECT}?error=access_denied`).error === null)
ok('a real error is reported',
  parseCallback(`${NATIVE_REDIRECT}?error=server_error`).error === 'server_error')
ok('and its description is preferred when there is one',
  parseCallback(`${NATIVE_REDIRECT}?error=x&error_description=Something+broke`).error === 'Something broke')
ok('a callback carrying nothing is an error, not a silent no-op',
  !!parseCallback(`${NATIVE_REDIRECT}`).error)
ok('a malformed URL does not throw', !!parseCallback('nonsense').error)
ok('an empty string does not throw', !!parseCallback('').error)

// An access token without its refresh token would sign you in until the hour
// was up and then drop you, which is worse than not signing in at all.
ok('a half-set of tokens is refused',
  !!parseCallback(`${NATIVE_REDIRECT}#access_token=at`).error)

// — the two ends have to agree —
//
// The scheme is written in three places that cannot import each other: here,
// the Swift shell, and the redirect allow-list in the Supabase dashboard. Two
// of them are checkable.

const scheme = NATIVE_REDIRECT.split('://')[0]
ok('the redirect is a custom scheme, not an https URL',
  !!scheme && !NATIVE_REDIRECT.startsWith('http'), NATIVE_REDIRECT)

const swiftPath = '/Users/user/Desktop/Trakkit/Trakkit/WebView.swift'
let swift = ''
try { swift = readFileSync(swiftPath, 'utf8') } catch { /* the shell lives outside this repo */ }

if (swift) {
  ok('the shell uses the same callback scheme',
    swift.includes(`"${scheme}"`), scheme)
  ok('the shell calls the hook the web side installs',
    swift.includes(CALLBACK_HOOK), CALLBACK_HOOK)
  ok('the shell listens on the message handler the web side posts to',
    swift.includes('"oauth"'))
  ok('the shell uses ASWebAuthenticationSession, which returns the callback',
    swift.includes('ASWebAuthenticationSession'))
  ok('and no longer hands OAuth to SFSafariViewController, which cannot',
    !/SFSafariViewController\(url: url\)/.test(swift) || !swift.includes('accounts.google.com'))
} else {
  console.log('skip  the iOS shell is not on this machine')
}

console.log(`\n${pass}/${pass + fail} passed`)
process.exit(fail ? 1 : 0)
