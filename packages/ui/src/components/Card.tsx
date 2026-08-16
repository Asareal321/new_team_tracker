import type { HTMLAttributes, ReactNode } from 'react'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode
}

/**
 * A sheet of card stock for a genuinely discrete object — one project, one
 * summary, one settings group.
 *
 * Cards are paper: a hairline border, 8px routed corners, no edge and no
 * shadow. Don't wrap a list of fields in one; that's a list.
 */
export function Card({ className, children, ...rest }: CardProps) {
  return (
    <div {...rest} className={['bb-card', className].filter(Boolean).join(' ')}>
      {children}
    </div>
  )
}
