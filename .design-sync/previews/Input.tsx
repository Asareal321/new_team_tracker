import { Input } from '@trakkit/ui'

export const Default = () => (
  <div style={{ maxWidth: 320 }}>
    <Input id="task-title" label="Task title" defaultValue="Rebuild the project tints" />
  </div>
)

export const Placeholder = () => (
  <div style={{ maxWidth: 320 }}>
    <Input id="task-new" label="Task title" placeholder="What needs doing?" />
  </div>
)

export const WithError = () => (
  <div style={{ maxWidth: 320 }}>
    <Input
      id="task-invalid"
      label="Task title"
      defaultValue=""
      error="A task needs a title before you can save it."
    />
  </div>
)

export const Disabled = () => (
  <div style={{ maxWidth: 320 }}>
    <Input id="task-locked" label="Task title" defaultValue="Archived task" disabled />
  </div>
)
