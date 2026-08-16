import type { HTMLAttributes, ReactNode } from 'react'

export interface WellProps extends HTMLAttributes<HTMLDivElement> {
  /** Optional small caps heading rendered inside the well. */
  label?: ReactNode
  children?: ReactNode
}

/**
 * A recessed tray holding a column of task rows.
 *
 * The well is routed *into* the board rather than sitting on it, so it has a
 * sunk surface and no edge beneath — the inverse of a piece.
 */
export function Well({ label, className, children, ...rest }: WellProps) {
  return (
    <div {...rest} className={['bb-well', className].filter(Boolean).join(' ')}>
      {label && <div className="bb-well__label">{label}</div>}
      {children}
    </div>
  )
}
