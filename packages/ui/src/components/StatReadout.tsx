import type { HTMLAttributes, ReactNode } from 'react'

export interface StatReadoutProps extends HTMLAttributes<HTMLDivElement> {
  label: ReactNode
  value: ReactNode
  size?: 'md' | 'sm'
}

/**
 * A labelled number — coins, streak days, open task counts, grow timers.
 *
 * The value is set in the data face with tabular figures, which is a
 * requirement and not a stylistic choice: a counter that ticks in proportional
 * figures visibly shivers as its digits change width.
 */
export function StatReadout({ label, value, size = 'md', className, ...rest }: StatReadoutProps) {
  return (
    <div {...rest} className={['bb-stat', size === 'sm' && 'bb-stat--sm', className].filter(Boolean).join(' ')}>
      <span className="bb-stat__label">{label}</span>
      <span className="bb-stat__value">{value}</span>
    </div>
  )
}
