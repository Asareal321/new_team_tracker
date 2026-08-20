// When a daily allowance is worth saying out loud.
//
// The three cap chips on the greenhouse strip used to render permanently:
// "9/12 left", "210/300 left", "7/10 left", all day, every day. A cap that is
// fine is not news, and on a phone those were three of six chips competing for
// a 217px column — which put the strip at 221px before a single task showed.
//
// So an allowance is silent until it's nearly gone. Below a quarter left it
// appears as a warning; at zero it says so plainly, which is the only moment
// it has ever told you anything. The full numbers stay in the chip's tooltip
// and in the garden.
//
// Here rather than in DailyCaps.jsx so a headless script can walk every value
// from full to empty — node can't import JSX.

// A quarter. Low enough that the chip stays rare, high enough that it arrives
// before the cap does rather than reporting it afterwards.
export const LOW_AT = 0.25

export function capState(left, cap) {
  if (!cap || left > cap * LOW_AT) return 'hidden'
  return left <= 0 ? 'spent' : 'low'
}
