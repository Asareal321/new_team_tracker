// What the app gives away, and what for.
//
// One file because these are promises made in one place and kept in another —
// the onboarding screen says which packet a public profile earns, and
// GardenContext is what actually hands it over. Two literals would eventually
// disagree, and the disagreement would be invisible until someone counted.

// Going public at onboarding. An epic packet: a directory nobody is listed in
// is not a community, so what is being asked for is real and the thank-you
// should be too.
export const PUBLIC_PROFILE_PACKET = 'epic'

// Bringing people to the app. One legendary packet per REFERRALS_PER_PACKET
// people who sign up on your link and finish setting up.
export const REFERRAL_PACKET = 'legendary'
export const REFERRALS_PER_PACKET = 3

// How many packets a referral count is worth in total, and therefore how many
// are still owed once you subtract what has already been handed over. Integer
// division on purpose: two friends earns nothing until the third arrives.
export function packetsEarned(referralCount) {
  return Math.floor(Math.max(0, referralCount) / REFERRALS_PER_PACKET)
}

export function packetsOwed(referralCount, alreadyGranted) {
  return Math.max(0, packetsEarned(referralCount) - Math.max(0, alreadyGranted))
}

// How many more people until the next one — for the copy, so the number shown
// and the number owed come from the same place.
export function untilNextPacket(referralCount) {
  const n = Math.max(0, referralCount) % REFERRALS_PER_PACKET
  return REFERRALS_PER_PACKET - n
}
