import type { HTMLAttributes, ReactNode } from 'react'

export interface PlaqueProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'md' | 'sm'
  children?: ReactNode
}

/**
 * A carved nameplate. The heaviest piece in the system: 3px border and a 5px
 * edge, set in the display face.
 *
 * Plaques name a place — the board, a page, a zone. They never contain data and
 * never wrap to two lines. This is the only centred element in the system.
 */
export function Plaque({ size = 'md', className, children, ...rest }: PlaqueProps) {
  return (
    <div {...rest} className={['bb-plaque', size === 'sm' && 'bb-plaque--sm', className].filter(Boolean).join(' ')}>
      {children}
    </div>
  )
}
