import { useEffect } from 'react'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import styles from './Toast.module.css'

export type ToastMessage = { id: number; text: string; kind: 'success' | 'error' }

/** Short message at the bottom of the screen that disappears after a few seconds. */
export function Toast({ message, onDone }: { message: ToastMessage | null; onDone: () => void }) {
  useEffect(() => {
    if (!message) return
    const timer = setTimeout(onDone, message.kind === 'error' ? 5000 : 3000)
    return () => clearTimeout(timer)
  }, [message, onDone])

  return (
    <div className={styles.region} role="status" aria-live="polite">
      {message && (
        <p key={message.id} className={`${styles.toast} ${message.kind === 'error' ? styles.error : ''}`}>
          {message.kind === 'error' ? (
            <AlertCircle size={18} aria-hidden="true" />
          ) : (
            <CheckCircle2 size={18} aria-hidden="true" />
          )}
          {message.text}
        </p>
      )}
    </div>
  )
}
