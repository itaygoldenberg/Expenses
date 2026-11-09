import type { ReactNode } from 'react'
import styles from './PageHeader.module.css'

type Props = { title: string; subtitle?: ReactNode; actions?: ReactNode }

/** Page title row: H1 with an optional subtitle and actions on the other side. */
export function PageHeader({ title, subtitle, actions }: Props) {
  return (
    <header className={styles.header}>
      <div className={styles.text}>
        <h1>{title}</h1>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </header>
  )
}
