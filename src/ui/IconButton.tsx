import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Tooltip } from './Tooltip'
import { cx } from './cx'
import styles from './IconButton.module.css'

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label'> & {
  /** Required: what the button does, read by screen readers. */
  label: string
  icon: ReactNode
  /** Also show the label as a tooltip on hover / focus. */
  tooltip?: boolean
  variant?: 'glass' | 'ghost'
}

export function IconButton({ label, icon, tooltip = false, variant = 'glass', className, type = 'button', ...rest }: Props) {
  const button = (
    <button {...rest} type={type} aria-label={label} className={cx(styles.button, styles[variant], className)}>
      {icon}
    </button>
  )
  return tooltip ? <Tooltip content={label}>{button}</Tooltip> : button
}
