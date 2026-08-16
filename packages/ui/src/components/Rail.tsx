import type { HTMLAttributes, ReactNode, ButtonHTMLAttributes } from 'react'

export interface RailProps extends HTMLAttributes<HTMLElement> {
  /** Rendered above the nav — typically the wordmark. */
  brand?: ReactNode
  /** Pinned to the bottom of the rail. */
  footer?: ReactNode
  children?: ReactNode
}

/**
 * The primary navigation rail: one continuous piece of wood down the left edge,
 * with a 4px ply edge instead of a border.
 *
 * It is furniture, so it does not collapse to icons. Below 820px an app should
 * lay it out as a horizontal strip instead.
 */
export function Rail({ brand, footer, className, children, ...rest }: RailProps) {
  return (
    <nav {...rest} className={['bb-rail', className].filter(Boolean).join(' ')}>
      {brand}
      <div className="bb-rail__nav">{children}</div>
      {footer && <div className="bb-rail__foot">{footer}</div>}
    </nav>
  )
}

export interface RailItemProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** The active item is a painted piece set into the wood — the only one with an edge. */
  active?: boolean
  children?: ReactNode
}

/**
 * One destination in the {@link Rail}.
 *
 * Active state is carried by paint and a hard edge rather than by font weight,
 * because that difference is legible across a room.
 */
export function RailItem({ active = false, className, children, ...rest }: RailItemProps) {
  return (
    <button
      type="button"
      aria-current={active ? 'page' : undefined}
      {...rest}
      className={['bb-rail-item', active && 'bb-rail-item--active', className].filter(Boolean).join(' ')}
    >
      {children}
    </button>
  )
}
