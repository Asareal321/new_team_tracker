import { TaskRow, Well, Chip, ProjectChip } from '@trakkit/ui'

export const Default = () => (
  <TaskRow
    title="Rebuild the project tints on the new curve"
    meta={<><span>ana</span><span>not started</span></>}
    end={<ProjectChip projectId="design-system">design-system</ProjectChip>}
  />
)

export const HighPriority = () => (
  <TaskRow
    title="Fix cream-on-wood contrast in the rail"
    meta={<><span>ana</span><span>due today</span></>}
    emphasis="high"
    end={<><ProjectChip projectId="design-system">design-system</ProjectChip><Chip tone="flag">high</Chip></>}
  />
)

export const Deadline = () => (
  <TaskRow
    title="Move garden coins to the server clock"
    meta={<><span>ana</span><span>due Fri</span></>}
    emphasis="due"
    end={<><ProjectChip projectId="garden">garden</ProjectChip><Chip tone="due">Fri</Chip></>}
  />
)

export const Done = () => (
  <TaskRow
    title="Cloud odds check running in CI"
    meta={<><span>sam</span><span>done 09:41</span></>}
    done
    end={<Chip tone="done">done</Chip>}
  />
)

export const InAWell = () => (
  <Well label="Today">
    <TaskRow
      title="Fix cream-on-wood contrast in the rail"
      meta={<><span>ana</span><span>due today</span></>}
      emphasis="high"
      end={<Chip tone="flag">high</Chip>}
    />
    <TaskRow
      title="Daily summary email sends twice"
      meta={<><span>sam</span><span>2d overdue</span></>}
      emphasis="high"
      end={<Chip tone="flag">high</Chip>}
    />
    <TaskRow
      title="Move garden coins to the server clock"
      meta={<><span>ana</span><span>due Fri</span></>}
      emphasis="due"
      end={<Chip tone="due">Fri</Chip>}
    />
  </Well>
)
