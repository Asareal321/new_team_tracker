import type { HTMLAttributes, ReactNode } from 'react'

export interface BoardProps extends HTMLAttributes<HTMLDivElement> {
  /** The navigation rail, rendered flush against the left edge. */
  rail?: ReactNode
  children?: ReactNode
}

/**
 * The baize table every piece sits on — the page-level surface.
 *
 * Wood is structure, paint is action, paper is data; the Board is the ground
 * those three read against. Designing a new screen starts by asking which of
 * the three each element is.
 */
export function Board({ rail, className, children, ...rest }: BoardProps) {
  return (
    <div {...rest} className={['bb-board', className].filter(Boolean).join(' ')}>
      {rail}
      <main className="bb-board__main">{children}</main>
    </div>
  )
}
