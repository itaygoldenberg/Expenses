import { useEffect, useRef, useState } from 'react'
import { Trash2 } from 'lucide-react'
import type { Expense } from '../../../shared/types'
import { formatDisplayDate } from '../../../shared/dates'
import { Modal } from '../../components/Modal'
import { ApiRequestError } from '../../api/client'
import { displayAmount } from './displayAmount'
import styles from './DeleteExpenseDialog.module.css'

export const DELETE_FAILED_MESSAGE = 'המחיקה נכשלה, ההוצאה לא נמחקה. נסו שוב.'

type Props = {
  expense: Expense
  onConfirm: (id: string) => Promise<void>
  onDeleted: () => void
  onNotFound: () => void
  onClose: () => void
}

export function DeleteExpenseDialog({ expense, onConfirm, onDeleted, onNotFound, onClose }: Props) {
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)

  // Focus "ביטול" first, so pressing Enter never deletes by accident
  useEffect(() => {
    cancelRef.current?.focus()
  }, [])

  async function handleDelete() {
    setDeleting(true)
    setError(null)
    try {
      await onConfirm(expense.id)
      onDeleted()
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 404) onNotFound()
      else setError(DELETE_FAILED_MESSAGE)
      setDeleting(false)
    }
  }

  return (
    <Modal title="מחיקת הוצאה" onClose={onClose} size="sm" busy={deleting}>
      <p className={styles.question}>למחוק את ההוצאה?</p>
      <dl className={styles.details}>
        <div>
          <dt>תאריך</dt>
          <dd>
            <span className="num">{formatDisplayDate(expense.expenseDate)}</span>
          </dd>
        </div>
        <div>
          <dt>{expense.description ? 'תיאור' : 'קטגוריה'}</dt>
          <dd>{expense.description ? `${expense.description} · ${expense.category}` : expense.category}</dd>
        </div>
        <div>
          <dt>סכום</dt>
          <dd>
            <span className="num">₪ {displayAmount(expense.amount)}</span>
          </dd>
        </div>
      </dl>
      <p className={styles.warning}>לא ניתן לבטל פעולה זו.</p>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      <div className={styles.actions}>
        <button type="button" className={styles.danger} onClick={handleDelete} disabled={deleting}>
          <Trash2 size={18} aria-hidden="true" />
          {deleting ? 'מוחק…' : 'מחיקה'}
        </button>
        <button ref={cancelRef} type="button" className={styles.cancel} onClick={onClose} disabled={deleting}>
          ביטול
        </button>
      </div>
    </Modal>
  )
}
