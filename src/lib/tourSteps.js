// The guided walk through the tabs, as data.
//
// The first tour was seven screens of dense paragraphs in a modal, which meant
// you finished it without ever having seen the app underneath. The second one
// pointed at real elements but drove itself — it teleported you between tabs
// while you watched. This one makes you do the travelling: a step can name an
// `act`, and then the tour waits for you to perform it on the real control.
// You arrive in the archive because you clicked Archived, so you know where
// Archived is.
//
// Fields:
//   route   — where the step is shown. The tour only navigates here itself
//             when the step has no `act` to get you there.
//   anchor  — selectors tried in order; the first that matches gets the hole.
//   act     — 'click' waits for a click on the anchor before advancing. There
//             is no per-step skip: if you don't want to do it, you skip the
//             whole tour. The button only comes back if the control genuinely
//             cannot be found, which is the one case that would trap you.
//   only    — 'phone' or 'desktop'. The two are laid out differently: on a
//             phone the rail is a bar along the top and your spheres live at
//             the bottom of Today; on a desktop they are down the left. A step
//             that sent you to the wrong place would be worse than no step.
//   mood    — which Trak.
//
// Three rules, all checked by scripts/check-tour.mjs:
//   • every body is short. The whole reason there are many steps is that each
//     one says one thing; a long body here is the old tour growing back.
//   • every route is one the app actually serves.
//   • a step that changes route is reached by a click, not by a redirect.
//   • everything laid out differently on phone and desktop is taught on both,
//     which means `only` steps come in pairs.

// In the order the walk visits them, which is the order of the tabs in the
// rail and along the bar at the top of a phone. Following the app's own
// layout is the whole point: you should be able to redo the walk from memory.
export const TOUR_ROUTES = ['/', '/deadlines', '/history', '/community', '/garden', '/account']

// The most a step may say. Roughly a spoken sentence.
export const MAX_BODY = 130

// The breakpoint the layout itself switches on — see App.css and Spheres.css.
// Below it the rail becomes a bar and the sphere list moves onto Today.
export const PHONE_QUERY = '(max-width: 820px)'

// The walk for one kind of screen. Nothing is dropped without a replacement:
// a step marked for the other platform always has a partner marked for this
// one, which is what scripts/check-tour.mjs enforces.
export function stepsFor({ phone = false } = {}) {
  return TOUR_STEPS.filter(s => !s.only || s.only === (phone ? 'phone' : 'desktop'))
}

const NAV = {
  deadlines: '[data-tour="nav-deadlines"]',
  history: '[data-tour="nav-history"]',
  community: '[data-tour="nav-community"]',
  garden: '[data-tour="nav-garden"]',
  account: '[data-tour="nav-account"]',
}

export const TOUR_STEPS = [
  // — today ————————————————————————————————————————————————————
  {
    key: 'rail', route: '/', mood: 'point', only: 'desktop',
    anchor: ['.sidebar-nav'],
    title: 'These are your tabs',
    body: 'Down the left. You are going to click through them yourself — I will only point.',
  },
  {
    key: 'rail-phone', route: '/', mood: 'point', only: 'phone',
    anchor: ['.sidebar-nav'],
    title: 'These are your tabs',
    body: 'Along the top. You will tap through them yourself — I only point.',
  },
  {
    key: 'log', route: '/', mood: 'happy', act: 'click',
    anchor: ['.lb-note', '.lb'],
    title: 'This is the whole app',
    body: 'Click the box. One sentence about what you moved forward, and it plants something.',
  },
  {
    key: 'log-sphere', route: '/', mood: 'think',
    anchor: ['.mo-box', '.lb'],
    title: 'Which sphere, which goal',
    body: 'Click a tile to pick the sphere. It zooms in on its goals — pick one, or no goal.',
  },
  {
    key: 'tree', route: '/', mood: 'point', only: 'desktop',
    anchor: ['.app-sidebar .st', '.st'],
    title: 'Your spheres',
    body: 'Down the left, under the tabs, with this week’s count beside each. + Area and + Sphere add more.',
  },
  {
    key: 'tree-phone', route: '/', mood: 'point', only: 'phone',
    anchor: ['.st-page'],
    title: 'Your spheres',
    body: 'At the bottom of Today, with this week’s count beside each. + Area and + Sphere add more.',
  },
  {
    key: 'gardens', route: '/', mood: 'idle',
    anchor: ['.mo-box', '.sph-start'],
    title: 'Where your month went',
    body: 'Each area is one colour, sized by your last 30 days. The small tile is the one you have been neglecting.',
  },
  {
    key: 'quests', route: '/', mood: 'happy',
    anchor: ['.quest-strip'],
    title: 'Quests',
    body: 'A few each day and week, all about logging. Claim them here for coins.',
  },

  // — deadlines ————————————————————————————————————————————————
  {
    key: 'deadlines-go', route: '/', mood: 'point', act: 'click',
    anchor: [NAV.deadlines],
    title: 'Click Deadlines',
    body: 'Every goal you set, by its end date.',
  },
  {
    key: 'upcoming', route: '/deadlines', mood: 'idle',
    anchor: ['.sph-section', '.sph-start'],
    title: 'What is coming',
    body: 'Overdue, this week, this month, later. A goal gone quiet is flagged before it is late.',
  },

  // — history ——————————————————————————————————————————————————
  {
    key: 'history-go', route: '/deadlines', mood: 'point', act: 'click',
    anchor: [NAV.history],
    title: 'Click History',
    body: 'Everything you have ever logged.',
  },
  {
    key: 'history-search', route: '/history', mood: 'think', act: 'click',
    anchor: ['.sph-search'],
    title: 'Search it',
    body: 'Click the search. Words, a sphere, a goal — useful when someone asks what you did all term.',
  },

  // — community ————————————————————————————————————————————————
  {
    key: 'community-go', route: '/history', mood: 'point', act: 'click',
    anchor: [NAV.community],
    title: 'Click Community',
    body: 'Friends, shared spheres, a market, and the reason to bring people with you.',
  },
  {
    key: 'referrals', route: '/community', mood: 'happy',
    anchor: ['.rf-card'],
    title: 'Bring three friends',
    body: 'Your link is here. Every three people who join hands you an heirloom packet.',
  },
  {
    key: 'people', route: '/community', mood: 'think',
    anchor: ['.cp-tabs', '.cp-card'],
    title: 'Finding people',
    body: 'Browse the public list or search a name. Nobody sees your garden until you let them.',
  },
  {
    key: 'market', route: '/community', mood: 'happy',
    anchor: ['.mk-card'],
    title: 'The marketplace',
    body: 'Packets you have not opened, at whatever price you name. Take one back any time.',
  },

  // — the garden, room by room ————————————————————————————————
  {
    key: 'garden-go', route: '/community', mood: 'happy', act: 'click',
    anchor: [NAV.garden],
    title: 'Click Garden',
    body: 'Where your coins and sprouts go.',
  },
  {
    key: 'bag', route: '/garden', mood: 'happy',
    anchor: ['.seeds-panel'],
    title: 'Your seed bag',
    body: 'Every log plants a seed from here in that sphere’s garden. Pin one to plant it next.',
  },
  {
    key: 'herbarium-go', route: '/garden', mood: 'point', act: 'click',
    anchor: ['[data-tour="room-herbarium"]'],
    title: 'Click the herbarium',
    body: 'Every species your packets have ever turned up, kept for good.',
  },
  {
    key: 'awards-go', route: '/garden', mood: 'point', act: 'click',
    anchor: ['[data-tour="room-awards"]'],
    title: 'Click awards',
    body: 'Streaks and quests. Long runs pay better than single days.',
  },
  {
    key: 'shop-go', route: '/garden', mood: 'happy', act: 'click',
    anchor: ['[data-tour="room-shop"]'],
    title: 'Click the shop',
    body: 'Last icon. Logging earns coins and sprouts, and they buy packets here.',
  },

  // — account ————————————————————————————————————————————————
  {
    key: 'account-go', route: '/garden', mood: 'point', act: 'click',
    anchor: [NAV.account],
    title: 'Last one — click Account',
    body: 'Everything you can change about how this works is on one page.',
  },
  {
    key: 'identity', route: '/account', mood: 'idle',
    anchor: ['[data-tour="acct-identity"]'],
    title: 'Your name',
    body: 'This is the name friends and shared spheres see. Change it whenever you like.',
  },
  {
    key: 'workspace', route: '/account', mood: 'think',
    anchor: ['[data-tour="acct-workspace"]'],
    title: 'Workspace and theme',
    body: 'Switch between your own space and a community’s, and go dark.',
  },
  {
    key: 'quiet', route: '/account', mood: 'idle',
    anchor: ['[data-tour="acct-quiet"]'],
    title: 'Quiet mode',
    body: 'Turns the game down. Streaks become a line in the corner instead of taking the screen.',
  },
  {
    key: 'replay', route: '/account', mood: 'happy',
    anchor: ['[data-tour="acct-tour"]'],
    title: 'And you can redo this',
    body: 'Take the tour again from here any time. Nothing is changed by it.',
  },
  {
    key: 'done-tour', route: '/account', mood: 'happy',
    anchor: null,
    title: 'That is the place',
    body: 'Do something, log it, watch it grow. I will be around.',
  },
]
