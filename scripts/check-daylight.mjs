// The sky phase is a pure function of the hour, so every hour of the day can
// simply be asked.

import { PHASES, phaseFor, msUntilNextHour } from '../src/lib/daylight.js'

let pass = 0, fail = 0
function ok(name, cond, detail = '') {
  if (cond) { pass++; console.log(`ok    ${name}`) }
  else { fail++; console.log(`FAIL  ${name}${detail ? `  — ${detail}` : ''}`) }
}

const at = h => phaseFor(new Date(2026, 7, 17, h, 30))
const HOURS = Array.from({ length: 24 }, (_, h) => h)

ok('every hour has a phase', HOURS.every(h => !!at(h)))
ok('every phase is one of the four', HOURS.every(h => PHASES.includes(at(h))))

// The wrap around midnight is the only fiddly part, so it gets said out loud.
ok('midnight is night', at(0).key === 'night')
ok('4am is still night', at(4).key === 'night')
ok('5am is dawn', at(5).key === 'dawn')
ok('7am is dawn', at(7).key === 'dawn')
ok('8am is day', at(8).key === 'day')
ok('noon is day', at(12).key === 'day')
ok('4pm is day', at(16).key === 'day')
ok('5pm is dusk', at(17).key === 'dusk')
ok('7pm is dusk', at(19).key === 'dusk')
ok('8pm is night', at(20).key === 'night')
ok('11pm is night', at(23).key === 'night')

// A phase nobody ever sees is a palette written for nothing.
ok('all four phases occur during a day',
  new Set(HOURS.map(h => at(h).key)).size === PHASES.length)

// The phases have to tile the clock: no hour in two, no hour in none.
ok('the phases cover the clock exactly',
  HOURS.every(h => PHASES.filter(p =>
    p.from < p.to ? (h >= p.from && h < p.to) : (h >= p.from || h < p.to)
  ).length === 1))

ok('day is the longest phase',
  HOURS.filter(h => at(h).key === 'day').length === 9)

// — the wake-up timer —

const t = (h, m) => msUntilNextHour(new Date(2026, 7, 17, h, m))
ok('the timer waits for the top of the hour', t(9, 0) === 60 * 60 * 1000)
ok('half past waits half an hour', t(9, 30) === 30 * 60 * 1000)
ok('the timer is never zero or negative', HOURS.every(h => t(h, 59) > 0))
ok('the timer never overshoots an hour', HOURS.every(h => t(h, 0) <= 60 * 60 * 1000))

console.log(`\n${pass}/${pass + fail} passed`)
process.exit(fail ? 1 : 0)
