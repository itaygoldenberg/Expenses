import { useId, type InputHTMLAttributes, type ReactNode } from 'react'
import { cx } from './cx'
import styles from './Field.module.css'

export type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> & {
  label: string
  hint?: string
  error?: string
  startAdornment?: ReactNode
  endAdornment?: ReactNode
  /** Numbers / amounts: left-to-right with aligned digits. */
  numeric?: boolean
}

export function TextField({
  label,
  hint,
  error,
  startAdornment,
  endAdornment,
  numeric = false,
  id: givenId,
  className,
  ...rest
}: TextFieldProps) {
  const autoId = useId()
  const id = givenId ?? autoId
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined

  return (
    <div className={cx(styles.field, className)}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <div className={cx(styles.control, error && styles.invalid, rest.disabled && styles.disabled)}>
        {startAdornment && <span className={styles.adornment}>{startAdornment}</span>}
        <input
          {...rest}
          id={id}
          className={cx(styles.input, numeric && styles.numeric)}
          dir={numeric ? 'ltr' : rest.dir}
          inputMode={numeric ? (rest.inputMode ?? 'decimal') : rest.inputMode}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
        />
        {endAdornment && <span className={styles.adornment}>{endAdornment}</span>}
      </div>
      {hint && (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
