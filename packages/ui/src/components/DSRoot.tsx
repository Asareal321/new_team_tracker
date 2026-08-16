import type { ReactNode, HTMLAttributes } from 'react'

export interface DSRootProps extends HTMLAttributes<HTMLDivElement> {
  /** Colour mode. Beech & Baize ships a real dark design, not an inversion. */
  theme?: 'light' | 'dark'
  children?: ReactNode
}

/**
 * Root wrapper for the design system. Establishes the base typography and,
 * when `theme="dark"`, the dark token set via `data-theme`.
 *
 * Every Beech & Baize screen must be inside a DSRoot (or must otherwise set
 * `data-theme` and import `@trakkit/ui/styles.css`), because all component
 * colour comes from custom properties defined at this level. Components
 * rendered outside it fall back to unstyled browser defaults.
 */
export function DSRoot({ theme = 'light', children, className, ...rest }: DSRootProps) {
  return (
    <div
      {...rest}
      data-theme={theme === 'dark' ? 'dark' : undefined}
      className={['bb-root', className].filter(Boolean).join(' ')}
    >
      {children}
    </div>
  )
}
