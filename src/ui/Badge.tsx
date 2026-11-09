import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { cx } from './cx'
import styles from './Badge.module.css'

export type Tone = 'neutral' | 'positive' | 'negative' | 'warning' | 'accent'

type BadgeProps = { tone?: Tone; dot?: boolean; children: ReactNode }

export function Badge({ tone = 'neutral', dot = false, children }: BadgeProps) {
  return (
    <span className={cx(styles.pill, styles[tone])}>
      {dot && <span className={styles.dot} aria-hidden="true" />}
      {children}
    </span>
  )
}

type ChipProps = {
  tone?: Tone
  children: ReactNode
  /** Shows an X button; `removeLabel` is read by screen readers. */
  onRemove?: () => void
  removeLabel?: string
}

export function Chip({ tone = 'neutral', children, onRemove, removeLabel = 'הסרה' }: ChipProps) {
  return (
    <span className={cx(styles.pill, styles.chip, styles[tone])}>
      {children}
      {onRemove && (
        <button type="button" className={styles.remove} onClick={onRemove} aria-label={removeLabel}>
          <X size={14} aria-hidden="true" />
        </button>
      )}
    </span>
  )
}
