import type { HTMLAttributes, ReactNode } from 'react'

/** `title` is the task's own text, so it shadows the HTML tooltip attribute. */
export interface TaskRowProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title: ReactNode
  /** Owner, timestamps, counts — set in the data face with tabular figures. */
  meta?: ReactNode
  /** Chips and avatars, right-aligned. */
  end?: ReactNode
  /** Drives the 4px leading stripe. Always pair it with a chip, never colour alone. */
  emphasis?: 'none' | 'high' | 'due'
  done?: boolean
}

/**
 * One task on the board. Paper, not a piece: flat, 4px radius, a hairline rule
 * between rows and deliberately no edge.
 *
 * This is the system's most-repeated element and the reason rows stay flat —
 * giving forty rows the piece treatment makes a board impossible to scan.
 */
export function TaskRow({ title, meta, end, emphasis = 'none', done = false, className, ...rest }: TaskRowProps) {
  return (
    <div
      {...rest}
      className={[
        'bb-task-row',
        emphasis === 'high' && 'bb-task-row--high',
        emphasis === 'due' && 'bb-task-row--due',
        done && 'bb-task-row--done',
        className,
      ].filter(Boolean).join(' ')}
    >
      <span className="bb-task-row__stripe" aria-hidden="true" />
      <span className="bb-task-row__body">
        <span className="bb-task-row__title">{title}</span>
        {meta && <span className="bb-task-row__meta">{meta}</span>}
      </span>
      <span className="bb-task-row__end">{end}</span>
    </div>
  )
}
