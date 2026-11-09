import { useEffect, useId, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cx } from './cx'
import styles from './Modal.module.css'

export type ModalProps = {
  title: string
  onClose: () => void
  children: ReactNode
  size?: 'md' | 'sm'
  /** Disables closing (Esc / X / backdrop) while a request is running. */
  busy?: boolean
  /** On phones, slide up from the bottom (see Sheet). */
  sheet?: boolean
}

/**
 * Modal dialog on top of the page, built on the native <dialog> element
 * (focus is kept inside, Esc closes, focus returns to the opener on close).
 * An element marked with data-autofocus inside the dialog receives the first focus.
 */
export function Modal({ title, onClose, children, size = 'md', busy = false, sheet = false }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    const opener = document.activeElement as HTMLElement | null
    if (typeof dialog.showModal === 'function') dialog.showModal()
    else dialog.setAttribute('open', '') // fallback (older browsers / tests)
    dialog.querySelector<HTMLElement>('[data-autofocus]')?.focus()
    return () => {
      if (typeof dialog.close === 'function' && dialog.open) dialog.close()
      opener?.focus?.()
    }
  }, [])

  return (
    <dialog
      ref={ref}
      className={cx('glass-2', styles.dialog, size === 'sm' && styles.sm, sheet && styles.sheet)}
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
        {sheet && <span className={styles.handle} aria-hidden="true" />}
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

/** Bottom sheet on phones, regular modal on larger screens. Same interface as Modal. */
export function Sheet(props: Omit<ModalProps, 'sheet'>) {
  return <Modal {...props} sheet />
}
