import type { ReactNode } from 'react'
import { Button } from './Button'
import { Modal } from './Modal'
import styles from './ConfirmDialog.module.css'

type Props = {
  title: string
  children: ReactNode
  confirmLabel: string
  cancelLabel?: string
  tone?: 'danger' | 'primary'
  busy?: boolean
  onConfirm: () => void
  onClose: () => void
}

/** Small confirmation dialog; "Cancel" gets the first focus so Enter never confirms by accident. */
export function ConfirmDialog({
  title,
  children,
  confirmLabel,
  cancelLabel = 'ביטול',
  tone = 'danger',
  busy = false,
  onConfirm,
  onClose,
}: Props) {
  return (
    <Modal title={title} onClose={onClose} size="sm" busy={busy}>
      <div className={styles.body}>{children}</div>
      <div className={styles.actions}>
        <Button variant={tone} loading={busy} onClick={onConfirm}>
          {confirmLabel}
        </Button>
        <Button variant="secondary" onClick={onClose} disabled={busy} data-autofocus>
          {cancelLabel}
        </Button>
      </div>
    </Modal>
  )
}
