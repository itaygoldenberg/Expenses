import { cloneElement, useEffect, useId, useState, type ReactElement, type ReactNode } from 'react'
import { cx } from './cx'
import styles from './Tooltip.module.css'

type ChildProps = {
  'aria-describedby'?: string
  onFocus?: (e: unknown) => void
  onBlur?: (e: unknown) => void
}

type Props = {
  content: ReactNode
  children: ReactElement<ChildProps>
  placement?: 'top' | 'start'
}

/** Small label shown on hover and keyboard focus; Esc hides it. */
export function Tooltip({ content, children, placement = 'top' }: Props) {
  const id = useId()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const trigger = cloneElement(children, {
    'aria-describedby': open ? id : undefined,
    onFocus: (e: unknown) => {
      setOpen(true)
      children.props.onFocus?.(e)
    },
    onBlur: (e: unknown) => {
      setOpen(false)
      children.props.onBlur?.(e)
    },
  })

  return (
    <span className={styles.wrap} onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      {trigger}
      {open && (
        <span id={id} role="tooltip" className={cx(styles.tip, styles[placement], 'glass-3')}>
          {content}
        </span>
      )}
    </span>
  )
}
