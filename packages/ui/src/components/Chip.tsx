import type { HTMLAttributes, ReactNode } from 'react'
import { projectSlotClass } from '../projectColor'

export interface ChipProps extends HTMLAttributes<HTMLSpanElement> {
  /** `flag` = priority, `due` = deadline, `done` = completed, `neutral` = everything else. */
  tone?: 'neutral' | 'flag' | 'due' | 'done'
  children?: ReactNode
}

/**
 * A small pill of metadata on a task row.
 *
 * Never use a chip's colour as the only carrier of state — pair it with the
 * row's stripe or a written label. Roughly 8% of men cannot rely on the
 * red/amber distinction, and priority is the most consequential signal here.
 */
export function Chip({ tone = 'neutral', className, children, ...rest }: ChipProps) {
  return (
    <span {...rest} className={['bb-chip', `bb-chip--${tone}`, className].filter(Boolean).join(' ')}>
      {children}
    </span>
  )
}

export interface ProjectChipProps extends HTMLAttributes<HTMLSpanElement> {
  /** Project id — hashed to a stable colour slot, so a project keeps its colour. */
  projectId: string | number
  /** Show the saturated dot alongside the label. */
  dot?: boolean
  children?: ReactNode
}

/**
 * A chip carrying a project's identity colour, assigned by hashing `projectId`.
 *
 * The colour comes from CSS custom properties on a slot class, never an inline
 * style — that is what makes the dark variant follow the theme.
 */
export function ProjectChip({ projectId, dot = true, className, children, ...rest }: ProjectChipProps) {
  return (
    <span
      {...rest}
      className={['bb-chip', 'bb-chip--project', projectSlotClass(projectId), className].filter(Boolean).join(' ')}
    >
      {dot && <span className="bb-chip__dot" aria-hidden="true" />}
      {children}
    </span>
  )
}
