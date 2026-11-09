import { useRef, type CSSProperties, type KeyboardEvent } from 'react'
import { isRtl, nextIndex } from './rovingKeys'
import { cx } from './cx'
import styles from './SegmentedControl.module.css'

type Option<T extends string> = { value: T; label: string }

type Props<T extends string> = {
  label: string
  options: Option<T>[]
  value: T
  onChange: (value: T) => void
  size?: 'md' | 'sm'
}

/** A row of mutually exclusive options with a sliding indicator (role="radiogroup"). */
export function SegmentedControl<T extends string>({ label, options, value, onChange, size = 'md' }: Props<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const selected = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  )

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const next = nextIndex(e.key, selected, options.length, isRtl(e.currentTarget))
    if (next === null) return
    e.preventDefault()
    onChange(options[next].value)
    refs.current[next]?.focus()
  }

  const vars = { '--count': options.length, '--index': selected } as CSSProperties

  return (
    <div role="radiogroup" aria-label={label} className={cx(styles.group, styles[size])} style={vars} onKeyDown={onKeyDown}>
      <span className={styles.indicator} aria-hidden="true" />
      {options.map((o, i) => {
        const checked = i === selected
        return (
          <button
            key={o.value}
            ref={(el) => {
              refs.current[i] = el
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={checked ? 0 : -1}
            className={cx(styles.option, checked && styles.checked)}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
