import { Button } from '@trakkit/ui'

export const Primary = () => <Button>Add task</Button>

export const Secondary = () => <Button variant="secondary">End the day</Button>

export const Together = () => (
  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
    <Button>Add task</Button>
    <Button variant="secondary">End the day</Button>
  </div>
)

export const Small = () => (
  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
    <Button size="sm">Save</Button>
    <Button size="sm" variant="secondary">Cancel</Button>
  </div>
)

export const Disabled = () => (
  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
    <Button disabled>Saving…</Button>
    <Button variant="secondary" disabled>Cancel</Button>
  </div>
)
