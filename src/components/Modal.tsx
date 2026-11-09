import { useEffect, useId, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'
import styles from './Modal.module.css'

type Props = {
  title: string
  onClose: () => void
  children: ReactNode
  size?: 'md' | 'sm'
  /** Disables closing (Esc / X / backdrop) while a request is running. */
  busy?: boolean
}

/**
 * Modal dialog on top of the page, built on the native <dialog> element
 * (focus is kept inside, Esc closes, focus returns to the opener on close).
 */
export function Modal({ title, onClose, children, size = 'md', busy = false }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    const opener = document.activeElement as HTMLElement | null
    if (typeof dialog.showModal === 'function') dialog.showModal()
    else dialog.setAttribute('open', '') // fallback (older browsers / tests)
    return () => {
      if (typeof dialog.close === 'function' && dialog.open) dialog.close()
      opener?.focus?.()
    }
  }, [])

  return (
    <dialog
      ref={ref}
      className={`${styles.dialog} ${size === 'sm' ? styles.sm : ''}`}
      aria-labelledby={titleId}
      onCancel={(e) => {
        // Esc key: let React state decide when to unmount
        e.preventDefault()
        if (!busy) onClose()
      }}
      onClick={(e) => {
        // Click on the backdrop (outside the panel)
        if (e.target === ref.current && !busy) onClose()
      }}
    >
      <div className={styles.panel}>
        <div className={styles.header}>
          <h2 id={titleId} className={styles.title}>
            {title}
          </h2>
          <button type="button" className={styles.close} onClick={onClose} disabled={busy} aria-label="סגירה">
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  )
}
