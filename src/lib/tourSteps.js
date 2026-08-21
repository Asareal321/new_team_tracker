// The guided walk through the tabs, as data.
//
// The first tour was seven screens of dense paragraphs in a modal, which meant
// you finished it without ever having seen the app underneath. This one points
// at the real thing: each step names a route and a selector, and the overlay
// puts a hole over that element. Nothing here is a mock — if a selector stops
// matching, the step degrades to a plain card rather than lying about where
// something is.
//
// Two rules, both checked by scripts/check-tour.mjs:
//   • every body is short. The whole reason there are many steps is that each
//     one says one thing; a long body here is the old tour growing back.
//   • every route is one the app actually serves.

export const TOUR_ROUTES = ['/', '/community', '/garden']

// The most a step may say. Roughly a spoken sentence.
export const MAX_BODY = 130

// `anchor` is tried in order — the first selector that matches wins, so a step
// can name a phone element and a desktop one without branching.
export const TOUR_STEPS = [
  // — the board ————————————————————————————————————————————————
  {
    key: 'rail', route: '/', mood: 'point',
    anchor: ['.sidebar-nav'],
    title: 'These are your tabs',
    body: 'Six places. We are going to walk three of them.',
  },
  {
    key: 'strip', route: '/', mood: 'happy',
    anchor: ['.greenhouse-strip'],
    title: 'I live up here',
    body: 'Whatever is most worth doing right now, I say it on this strip.',
  },
  {
    key: 'bar', route: '/', mood: 'idle',
    anchor: ['.gh-bar'],
    title: 'Your flower, growing',
    body: 'It fills on a real clock. Finishing tasks makes clouds, and clouds cut the wait.',
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
    key: 'chevrons', route: '/', mood: 'point',
    anchor: ['.row-advance', '.paper-row'],
    title: 'Moving work',
    body: 'The chevrons send a task forward or back. Tap the task itself to edit it.',
  },
  {
    key: 'dump', route: '/', mood: 'think',
    anchor: ['.tab-dump', '.tabs'],
    title: 'The braindump',
    body: 'Everything you thought of, filed under a project. No limit here.',
  },

  // — community ————————————————————————————————————————————————
  {
    key: 'community', route: '/community', mood: 'point',
    anchor: ['.cp-card'],
    title: 'This is Community',
    body: 'Friends, and a market. Nobody sees your garden until you let them.',
  },
  {
    key: 'visibility', route: '/community', mood: 'think',
    anchor: ['.cp-visibility'],
    title: 'Public or private',
    body: 'You chose this a moment ago. This is where you change your mind.',
  },
  {
    key: 'find', route: '/community', mood: 'point',
    anchor: ['.cp-tabs'],
    title: 'Finding people',
    body: 'Browse the public list, or search a name. Part of a name is enough.',
  },
  {
    key: 'market', route: '/community', mood: 'happy',
    anchor: ['.mk-card'],
    title: 'The marketplace',
    body: 'Flowers and seed packets, priced by whoever is selling them.',
  },
  {
    key: 'sell', route: '/community', mood: 'point',
    anchor: ['.mk-sell', '.mk-list'],
    title: 'Selling',
    body: 'Pick something you hold, name your price, put it up. Take it back any time.',
  },

  // — the garden ————————————————————————————————————————————————
  {
    key: 'garden', route: '/garden', mood: 'happy',
    anchor: ['.plot-grid', '.field-panel'],
    title: 'Your garden',
    body: 'Every flower you have grown, in the ground. Drag a bed to rearrange it.',
  },
  {
    key: 'plot', route: '/garden', mood: 'point',
    anchor: ['.plot.filled', '.plot'],
    title: 'A bed',
    body: 'Hover one for two choices: sell it on the market, or compost it.',
  },
  {
    key: 'growing', route: '/garden', mood: 'idle',
    anchor: ['.growing-pot', '.greenhouse'],
    title: 'What is growing',
    body: 'One seed at a time. This is the same flower the board strip was counting.',
  },
  {
    key: 'shop', route: '/garden', mood: 'think',
    anchor: ['.seed-packet', '.shop-panel'],
    title: 'Packets',
    body: 'Coins buy packets. A packet is a roll, not a species — the odds are printed on it.',
  },
  {
    key: 'herbarium', route: '/garden', mood: 'happy',
    anchor: ['.herbarium-panel'],
    title: 'The herbarium',
    body: 'Every species you have ever seen, kept even after you sell the flower.',
  },
  {
    key: 'done-tour', route: '/garden', mood: 'happy',
    anchor: null,
    title: 'That is the place',
    body: 'Add a task, finish it, tap the cloud. I will be on the strip if you need me.',
  },
]
