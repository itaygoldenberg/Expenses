import { useId, type SelectHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'
import { cx } from './cx'
import styles from './Field.module.css'

type Props = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string
  options: { value: string; label: string }[]
  placeholder?: string
  hint?: string
  error?: string
}

/** Native <select> (browser keyboard support, comfortable on phones) in the glass style. */
export function SelectField({ label, options, placeholder, hint, error, id: givenId, className, ...rest }: Props) {
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
        <select
          {...rest}
          id={id}
          className={cx(styles.input, styles.select)}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
        >
          {placeholder !== undefined && <option value="">{placeholder}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown size={18} aria-hidden="true" className={styles.chevron} />
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
