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
//   only    — 'phone' or 'desktop'. The two are not the same app: a phone has
//             no chevrons and no number keys, a desktop has no swipe. A step
//             that taught the wrong gesture would be worse than no step.
//   mood    — which Trak.
//
// Three rules, all checked by scripts/check-tour.mjs:
//   • every body is short. The whole reason there are many steps is that each
//     one says one thing; a long body here is the old tour growing back.
//   • every route is one the app actually serves.
//   • a step that changes route is reached by a click, not by a redirect.
//   • every gesture that differs between phone and desktop is taught on both,
//     which means `only` steps come in pairs.

// In the order the walk visits them, which is the order of the tabs in the
// rail and along the bottom bar of the phone. Following the app's own layout
// is the whole point: you should be able to redo the walk from memory.
export const TOUR_ROUTES = ['/', '/deadlines', '/community', '/garden', '/account']

// The most a step may say. Roughly a spoken sentence.
export const MAX_BODY = 130

// The breakpoint the board itself switches on — see components/useSwipeReveal.
// Below it the chevrons and the braindump tray are gone and swiping replaces
// them, so the tour has to switch on exactly the same line.
export const PHONE_QUERY = '(max-width: 820px)'

// The walk for one kind of screen. Nothing is dropped without a replacement:
// a step marked for the other platform always has a partner marked for this
// one, which is what scripts/check-tour.mjs enforces.
export function stepsFor({ phone = false } = {}) {
  return TOUR_STEPS.filter(s => !s.only || s.only === (phone ? 'phone' : 'desktop'))
}

const NAV = {
  taskboard: '[data-tour="nav-taskboard"]',
  deadlines: '[data-tour="nav-deadlines"]',
  community: '[data-tour="nav-community"]',
  garden: '[data-tour="nav-garden"]',
  account: '[data-tour="nav-account"]',
}

export const TOUR_STEPS = [
  // — the board ————————————————————————————————————————————————
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
    body: 'Along the bottom, icons only. You will tap through them yourself — I only point.',
  },
  {
    key: 'strip', route: '/', mood: 'happy',
    anchor: ['.greenhouse-strip'],
    title: 'I live up here',
    body: 'Whatever is most worth doing right now, I say it on this strip.',
  },
  {
    key: 'done', route: '/', mood: 'happy',
    anchor: ['.band-done'],
    title: 'Done today',
    body: 'A count, not a list. It empties at your midnight.',
  },
  {
    key: 'doing', route: '/', mood: 'think',
    anchor: ['.band-in_progress'],
    title: 'Doing',
    body: 'Two at a time, deliberately. A full band refuses the task instead of taking it.',
  },
  {
    key: 'upnext', route: '/', mood: 'point',
    anchor: ['.band-todo'],
    title: 'Up next',
    body: 'Four at most. Everything else waits in the braindump.',
  },
  {
    key: 'chevrons', route: '/', mood: 'point', only: 'desktop',
    anchor: ['.row-advance', '.paper-row'],
    title: 'Moving work',
    body: 'The chevrons send a task forward or back. Click the task itself to edit it.',
  },
  {
    key: 'swipe', route: '/', mood: 'point', only: 'phone',
    anchor: ['.paper-row'],
    title: 'Swipe a task left',
    body: 'Nothing on the row moves it. Drag one sideways and two buttons appear behind it.',
  },
  {
    key: 'swipe-what', route: '/', mood: 'think', only: 'phone',
    anchor: ['.paper-row'],
    title: 'Forward, or back',
    body: 'The top one moves it on, the bottom one sends it back. Tap the row itself to open it.',
  },
  {
    key: 'drag', route: '/', mood: 'idle', only: 'desktop',
    anchor: ['.row-stripe', '.paper-row'],
    title: 'Or drag it',
    body: 'The coloured stripe is the handle. Drag a task into any band, or onto the braindump.',
  },

  // — the braindump, and a project ————————————————————————————
  {
    key: 'dump-open', route: '/', mood: 'point', act: 'click',
    anchor: ['.tab-dump'],
    title: 'Open the braindump',
    body: 'Click Braindump. It is the tab where nothing is limited.',
  },
  {
    key: 'dump', route: '/', mood: 'think',
    anchor: ['.dump-capture', '.dump-pile'],
    title: 'Everything you thought of',
    body: 'Type it here. No dates, no order — just get it out of your head.',
  },
  {
    key: 'pills', route: '/', mood: 'point',
    anchor: ['.dump-pills'],
    title: 'The pills are the button',
    body: 'You do not press Add. You press the project it belongs to, and that files it.',
  },
  {
    key: 'tray', route: '/', mood: 'think', only: 'desktop',
    anchor: ['.dump-tray', '.dump-list'],
    title: 'Getting things out again',
    body: 'Click an item, then hit a tray slot — or just press its number. 4 deletes.',
  },
  {
    key: 'dump-swipe', route: '/', mood: 'think', only: 'phone',
    anchor: ['.dump-hint', '.dump-list'],
    title: 'Getting things out again',
    body: 'Same sideways flick as the board: swipe an item to send it to Up next, or to bin it.',
  },
  {
    key: 'newproject', route: '/', mood: 'happy', act: 'click',
    anchor: ['.dump-pj-new'],
    title: 'Make yourself a project',
    body: 'Click + New project and name something you are actually working on.',
  },
  {
    key: 'calendar', route: '/', mood: 'think',
    anchor: ['.cal-strip', '.dump-pills'],
    title: 'Projects meet your calendar',
    body: 'Put a project name in a Google Calendar event and its tasks move onto the board at that hour.',
  },

  // — the archive ————————————————————————————————————————————
  {
    key: 'archive-open', route: '/', mood: 'point', act: 'click',
    anchor: ['.tab-archived'],
    title: 'Now open Archived',
    body: 'Click Archived. Nothing you finish is thrown away.',
  },
  {
    key: 'archive', route: '/', mood: 'idle',
    anchor: ['.archive-cal', '.archive-cal-grid'],
    title: 'Everything you finished',
    body: 'Laid out by the day you finished it, month by month.',
  },
  {
    key: 'archive-search', route: '/', mood: 'think',
    anchor: ['.arc-search'],
    title: 'And it is searchable',
    body: 'Title, notes, project, updates. Old projects stay here for good.',
  },
  {
    key: 'board-back', route: '/', mood: 'point', act: 'click',
    anchor: ['.tab-board'],
    title: 'Back to the board',
    body: 'Click Board. That is the whole taskboard.',
  },

  // — deadlines ————————————————————————————————————————————————
  {
    key: 'deadlines-go', route: '/', mood: 'point', act: 'click',
    anchor: [NAV.deadlines],
    title: 'Click Deadlines',
    body: 'Second tab down. Anything you gave a date to is waiting there.',
  },
  {
    key: 'upcoming', route: '/deadlines', mood: 'idle',
    anchor: ['.dl-upcoming'],
    title: 'What is coming',
    body: 'Sorted by date, nearest first. That is most of what this tab is for.',
  },
  {
    key: 'views', route: '/deadlines', mood: 'point',
    anchor: ['.dl-views'],
    title: 'Today, week, month',
    body: 'Three zoom levels on the same dates. Pick whichever you think in.',
  },

  // — community ————————————————————————————————————————————————
  {
    key: 'community-go', route: '/deadlines', mood: 'point', act: 'click',
    anchor: [NAV.community],
    title: 'Click Community',
    body: 'Friends, a market, and the reason to bring people with you.',
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
    body: 'Pick something you hold, name your price, put it up. Take it back any time.',
  },

  // — the garden, room by room ————————————————————————————————
  {
    key: 'garden-go', route: '/community', mood: 'happy', act: 'click',
    anchor: [NAV.garden],
    title: 'Click Garden',
    body: 'This is the part that pays you for finishing things.',
  },
  {
    key: 'beds', route: '/garden', mood: 'happy',
    anchor: ['.plot-grid', '.field-panel'],
    title: 'Your garden',
    body: 'Every flower you have grown, in the ground. Tap one for its name and its options.',
  },
  {
    key: 'greenhouse-go', route: '/garden', mood: 'point', act: 'click',
    anchor: ['[data-tour="room-greenhouse"]'],
    title: 'Open the greenhouse',
    body: 'Second along the row of rooms. It is where a seed becomes a flower.',
  },
  {
    key: 'greenhouse', route: '/garden', mood: 'idle',
    anchor: ['.growing-pot', '.greenhouse'],
    title: 'One seed at a time',
    body: 'It fills on a real clock. Clouds you banked pop here and cut the wait.',
  },
  {
    key: 'herbarium-go', route: '/garden', mood: 'point', act: 'click',
    anchor: ['[data-tour="room-herbarium"]'],
    title: 'Click the herbarium',
    body: 'Your record of species, kept even after you sell the flower.',
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
    body: 'Last icon. Coins buy packets, and a packet is a roll with printed odds.',
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
    body: 'This is the name friends see. Change it whenever you like.',
  },
  {
    key: 'workspace', route: '/account', mood: 'think',
    anchor: ['[data-tour="acct-workspace"]'],
    title: 'Workspace and theme',
    body: 'Switch between your personal board and a community board, and go dark.',
  },
  {
    key: 'quiet', route: '/account', mood: 'idle',
    anchor: ['[data-tour="acct-quiet"]'],
    title: 'Quiet mode',
    body: 'Turns the game down. Finished tasks pay coins instead of taking the screen.',
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
    body: 'Finish a task, pop the cloud, grow the thing. I will be on the strip.',
  },
]
