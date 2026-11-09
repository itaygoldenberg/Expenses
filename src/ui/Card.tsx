import type { HTMLAttributes, ReactNode } from 'react'
import { cx } from './cx'
import styles from './Card.module.css'

type Props = HTMLAttributes<HTMLElement> & {
  level?: 1 | 2 | 3
  padding?: 'md' | 'lg' | 'none'
  title?: ReactNode
  icon?: ReactNode
  /** Hover lift for clickable cards. */
  interactive?: boolean
  as?: 'section' | 'div' | 'article'
}

export function Card({
  level = 1,
  padding = 'md',
  title,
  icon,
  interactive = false,
  as: Tag = 'section',
  className,
  children,
  ...rest
}: Props) {
  return (
    <Tag
      {...rest}
      className={cx(`glass-${level}`, styles.card, styles[`pad-${padding}`], interactive && styles.interactive, className)}
    >
      {title && (
        <h2 className={styles.title}>
          {icon && <span className={styles.icon}>{icon}</span>}
          {title}
        </h2>
      )}
      {children}
    </Tag>
  )
}
