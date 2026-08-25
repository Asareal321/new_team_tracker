// The tasks a brand-new account starts with.
//
// An empty app teaches nothing. The bands look identical whether they are
// limited or not, Deadlines is a blank month, the archive says "no archived
// tasks yet", and the tour spends five steps pointing at nothing. So the first
// run seeds a board that already looks like a week of work: two things being
// done, a few queued with dates, a couple finished today, a braindump with a
// backlog in it, and some history in the archive.
//
// They are deliberately generic and deliberately few — enough to make the
// shapes legible, few enough to delete in a minute. The two finished ones are
// the point of the exercise: they bank the clouds the tour tells you to pop.

// The bands the board enforces. Seeding past them would make the limit a lie
// on the very first screen, which is the one screen where it has to be true.
export const MAX_DOING = 2
export const MAX_UP_NEXT = 4

function dayString(base, offset) {
  const d = new Date(base.getFullYear(), base.getMonth(), base.getDate() + offset)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// `projectId` files everything under the project the person just named during
// setup, so their own words are on the board rather than an invented project.
// Null is fine: unfiled tasks are ordinary.
export function sampleTasks({ today = new Date(), projectId = null } = {}) {
  const day = n => dayString(today, n)
  const row = (title, status, extra = {}) => ({
    title, notes: '', status, priority: 'medium', due_date: null,
    project_id: projectId, ...extra,
  })

  return [
    // Doing — full, so the refusal you get on the third one makes sense.
    row('Write up where this project actually stands', 'in_progress', { priority: 'high', due_date: day(0) }),
    row('Reply to the message you have been avoiding', 'in_progress'),

    // Up next — dated across the week so Deadlines has something to draw.
    row('Book the thing that needs booking', 'todo', { priority: 'high', due_date: day(1) }),
    row('Read the doc someone sent you', 'todo', { due_date: day(2) }),
    row('Tidy up last week’s notes', 'todo', { priority: 'low', due_date: day(4) }),
    row('Plan next week on Friday', 'todo', { due_date: day(6) }),

    // Done today — these are what pay out the first clouds.
    row('Open Trakkit', 'done', { priority: 'low' }),
    row('Decide what this week is for', 'done'),

    // The braindump: everything that has no date and no turn yet.
    row('Chase the invoice', 'braindump'),
    row('Find a better calendar habit', 'braindump', { priority: 'low' }),
    row('Ask about the budget', 'braindump'),
    row('Sort out the shared folder', 'braindump', { priority: 'low' }),

    // History, so the archive and its search have something to find.
    row('Set up the project', 'archived'),
    row('Send last week’s update', 'archived'),
    row('Cancel the subscription nobody used', 'archived', { priority: 'low' }),
  ]
}

// How many clouds the seed is worth: one per finished task, which is the same
// rule a task you finish yourself follows.
export function seededClouds(rows) {
  return rows.filter(t => t.status === 'done').length
}
