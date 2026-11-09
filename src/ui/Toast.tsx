import { useEffect } from 'react'
import { AlertCircle, CheckCircle2, Info } from 'lucide-react'
import { cx } from './cx'
import styles from './Toast.module.css'

export type ToastMessage = { id: number; text: string; kind: 'success' | 'error' | 'info' }

const ICONS = { success: CheckCircle2, error: AlertCircle, info: Info }

/**
 * Short message that disappears after a few seconds: above the tab bar on phones,
 * in the corner on larger screens.
 */
export function Toast({ message, onDone }: { message: ToastMessage | null; onDone: () => void }) {
  useEffect(() => {
    if (!message) return
    const timer = setTimeout(onDone, message.kind === 'error' ? 5000 : 3000)
    return () => clearTimeout(timer)
  }, [message, onDone])

  const Icon = message ? ICONS[message.kind] : null

  return (
    <div className={styles.region} role="status" aria-live="polite">
      {message && Icon && (
        <p key={message.id} className={cx('glass-3', styles.toast, styles[message.kind])}>
          <Icon size={18} aria-hidden="true" />
          {message.text}
        </p>
      )}
    </div>
  )
}
