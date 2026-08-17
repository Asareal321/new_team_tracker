// What the sky is doing right now.
//
// The garden is a place you visit, and a place that looks identical at 6am and
// 11pm isn't one. The phase is a pure function of the local hour, so it needs
// no stored state and no server: everyone's garden is lit by their own clock.
//
// Four phases rather than a continuous gradient. A slow interpolation across
// the day would be invisible while you're looking at it and impossible to
// name; four states each read as somewhere.

export const PHASES = [
  { key: 'dawn',  from: 5,  to: 8,  label: 'Dawn' },
  { key: 'day',   from: 8,  to: 17, label: 'Daytime' },
  { key: 'dusk',  from: 17, to: 20, label: 'Dusk' },
  { key: 'night', from: 20, to: 5,  label: 'Night' },
]

export function phaseFor(date = new Date()) {
  const h = date.getHours()
  // Night is the one that wraps midnight, so it's the fallthrough rather than
  // a range check that has to handle 20 <= h < 5 being false for every hour.
  return PHASES.find(p => p.from < p.to && h >= p.from && h < p.to) || PHASES[3]
}

// Milliseconds until the phase could next change — the top of the next hour.
// Polling every minute would work too, but this wakes up 24 times a day rather
// than 1,440 for a change that can only happen on an hour boundary.
export function msUntilNextHour(date = new Date()) {
  const next = new Date(date)
  next.setHours(date.getHours() + 1, 0, 0, 0)
  return Math.max(1000, next.getTime() - date.getTime())
}
