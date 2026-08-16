import type { InputHTMLAttributes, ReactNode } from 'react'

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: ReactNode
  /** Message shown below the field. Presence also puts the input in its error state. */
  error?: ReactNode
}

/**
 * A single-line text field. Paper: 4px radius, hairline border, body type at
 * full size rather than a shrunken UI size.
 *
 * An error always renders a written message alongside the colour change —
 * never colour alone.
 */
export function Input({ label, error, className, id, ...rest }: InputProps) {
  const describedBy = error && id ? `${id}-error` : undefined
  return (
    <label className="bb-field" htmlFor={id}>
      {label && <span className="bb-field__label">{label}</span>}
      <input
        {...rest}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={['bb-input', error && 'bb-input--error', className].filter(Boolean).join(' ')}
      />
      {error && (
        <span className="bb-field__error" id={describedBy}>
          <span aria-hidden="true">▲</span>
          {error}
        </span>
      )}
    </label>
  )
}
