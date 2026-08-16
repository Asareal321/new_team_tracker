import type { HTMLAttributes, ReactNode } from 'react'

export interface TooltipProps extends HTMLAttributes<HTMLSpanElement> {
  children?: ReactNode
}

/**
 * A short hint on an inverted surface — dark ink ground with paper text.
 *
 * This is the one inversion in Beech & Baize, which is exactly why it reads as
 * a tooltip and not as another chip. It carries no edge.
 */
export function Tooltip({ className, children, ...rest }: TooltipProps) {
  return (
    <span role="tooltip" {...rest} className={['bb-tooltip', className].filter(Boolean).join(' ')}>
      {children}
    </span>
  )
}
