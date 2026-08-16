import type { HTMLAttributes, ReactNode } from 'react'

export interface ZoneLabelProps extends HTMLAttributes<HTMLSpanElement> {
  children?: ReactNode
}

/**
 * A small wooden tag marking a region of the board — "Today", "This week",
 * "Blocked". Same wood as the rail and plaques, pill-shaped because it is read
 * as a tag rather than pressed.
 */
export function ZoneLabel({ className, children, ...rest }: ZoneLabelProps) {
  return (
    <span {...rest} className={['bb-zone-label', className].filter(Boolean).join(' ')}>
      {children}
    </span>
  )
}
