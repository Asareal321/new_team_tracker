// Developer tools are gated to the account(s) named in VITE_DEV_EMAIL — a
// comma-separated list, set in the Vercel project's environment variables.
//
// This is a convenience gate, not a security boundary. Anything prefixed with
// VITE_ is inlined into the client bundle at build time, so the address is
// readable by anyone who digs through the JS. It's kept out of the repo so it
// isn't sitting in public git history for scrapers, and so it can be changed
// or revoked without a code change — but don't put anything behind this that
// actually needs protecting. The panel only touches the signed-in user's own
// garden, which RLS already restricts to them.

const allowedEmails = (import.meta.env.VITE_DEV_EMAIL || '')
  .split(',')
  .map(entry => entry.trim().toLowerCase())
  .filter(Boolean)

export const devModeConfigured = allowedEmails.length > 0

export function isDevUser(email) {
  if (!email || !allowedEmails.length) return false
  return allowedEmails.includes(email.trim().toLowerCase())
}
