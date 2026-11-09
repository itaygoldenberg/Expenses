import type { ReactNode } from 'react'
import { AlertTriangle, Inbox, RotateCcw } from 'lucide-react'
import { Button } from './Button'
import { cx } from './cx'
import styles from './States.module.css'

type SkeletonProps = {
  variant?: 'line' | 'block' | 'circle'
  width?: number | string
  height?: number | string
  /** Number of lines (variant "line"). */
  lines?: number
}

/** Loading placeholder; announces "טוען…" once to screen readers. */
export function Skeleton({ variant = 'line', width, height, lines = 1 }: SkeletonProps) {
  const items = variant === 'line' ? lines : 1
  return (
    <div className={styles.skeletonGroup} role="status">
      <span className="visually-hidden">טוען…</span>
      {Array.from({ length: items }, (_, i) => (
        <span
          key={i}
          aria-hidden="true"
          className={cx(styles.skeleton, styles[variant])}
          style={{ width: variant === 'line' && i === items - 1 && items > 1 ? '60%' : width, height }}
        />
      ))}
    </div>
  )
}

type EmptyProps = { icon?: ReactNode; title: string; description?: string; action?: ReactNode }

export function EmptyState({ icon, title, description, action }: EmptyProps) {
  return (
    <div className={styles.state}>
      <span className={styles.icon} aria-hidden="true">
        {icon ?? <Inbox size={40} strokeWidth={1.4} />}
      </span>
      <h3 className={styles.title}>{title}</h3>
      {description && <p className={styles.description}>{description}</p>}
      {action}
    </div>
  )
}

type ErrorProps = { title?: string; description: string; onRetry?: () => void; retryLabel?: string }

export function ErrorState({ title = 'משהו השתבש', description, onRetry, retryLabel = 'נסו שוב' }: ErrorProps) {
  return (
    <div className={cx(styles.state, styles.error)} role="alert">
      <span className={styles.icon} aria-hidden="true">
        <AlertTriangle size={36} strokeWidth={1.5} />
      </span>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.description}>{description}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" icon={<RotateCcw size={16} aria-hidden="true" />} onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
    </div>
  )
}
