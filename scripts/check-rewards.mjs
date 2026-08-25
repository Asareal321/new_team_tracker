// What the app gives away.
//
// Real money is not involved, but a legendary packet is the rarest thing in
// the game and these are the two ways to get one without playing for it. The
// failure that matters is paying twice — so most of what is written down here
// is about the second call paying nothing.

import {
  packetsEarned, packetsOwed, untilNextPacket,
  REFERRALS_PER_PACKET, REFERRAL_PACKET, PUBLIC_PROFILE_PACKET,
} from '../src/lib/rewards.js'
import { packetByKey } from '../src/lib/garden.js'

let pass = 0, fail = 0
function ok(name, cond, detail = '') {
  if (cond) { pass++; console.log(`ok    ${name}`) }
  else { fail++; console.log(`FAIL  ${name}${detail ? `  — ${detail}` : ''}`) }
}

// The packets named have to exist, or the reward is a silent no-op that only
// shows up as a key nobody can spend.
ok('the public-profile packet is a real packet', !!packetByKey(PUBLIC_PROFILE_PACKET))
ok('the referral packet is a real packet', !!packetByKey(REFERRAL_PACKET))
ok('the public-profile packet is the conservatory one',
  packetByKey(PUBLIC_PROFILE_PACKET).name === 'Conservatory packet')
ok('the referral packet is the heirloom one',
  packetByKey(REFERRAL_PACKET).name === 'Heirloom packet')

// — earning —

ok('nobody earns nothing', packetsEarned(0) === 0)
ok('one short of the threshold earns nothing', packetsEarned(REFERRALS_PER_PACKET - 1) === 0)
ok('the threshold earns one', packetsEarned(REFERRALS_PER_PACKET) === 1)
ok('one over still earns one', packetsEarned(REFERRALS_PER_PACKET + 1) === 1)
ok('twice the threshold earns two', packetsEarned(REFERRALS_PER_PACKET * 2) === 2)
ok('the threshold is three', REFERRALS_PER_PACKET === 3)

// — paying, which is where a bug would cost something —

ok('a fresh three is owed one', packetsOwed(3, 0) === 1)
ok('paying again immediately owes nothing', packetsOwed(3, 1) === 0)
ok('a fourth friend still owes nothing', packetsOwed(4, 1) === 0)
ok('the sixth owes one more', packetsOwed(6, 1) === 1)
ok('nine at once owes all three', packetsOwed(9, 0) === 3)
ok('never negative, even if granted has run ahead', packetsOwed(3, 9) === 0)
ok('a negative count is treated as none', packetsOwed(-5, 0) === 0)

// — the copy —

ok('a new account needs three more', untilNextPacket(0) === 3)
ok('after one, two more', untilNextPacket(1) === 2)
ok('after the third, three again', untilNextPacket(3) === 3)
ok('the countdown never reads zero', [0,1,2,3,4,5,6,7,8,9].every(n => untilNextPacket(n) >= 1))

console.log(`\n${pass}/${pass + fail} passed`)
process.exit(fail ? 1 : 0)
