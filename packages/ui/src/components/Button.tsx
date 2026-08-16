import type { ButtonHTMLAttributes, ReactNode } from 'react'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** `primary` is the painted piece and the only accent-coloured control on a screen. */
  variant?: 'primary' | 'secondary'
  size?: 'md' | 'sm'
  children?: ReactNode
}

/**
 * A painted wooden piece you can press.
 *
 * Carries the system's interaction physics: 2px border, a 3px hard edge in its
 * own edge colour, lifting 1px on hover and pressing 2px down on `:active`.
 * Colour never changes on interaction — only geometry.
 *
 * There is deliberately no ghost or tertiary variant. If a screen needs a third
 * level of action, it has too many actions; demote one to a text link.
 */
export function Button({ variant = 'primary', size = 'md', className, children, ...rest }: ButtonProps) {
  return (
    <button
      type="button"
      {...rest}
      className={['bb-btn', `bb-btn--${variant}`, size === 'sm' && 'bb-btn--sm', className]
        .filter(Boolean).join(' ')}
    >
      {children}
    </button>
  )
}
