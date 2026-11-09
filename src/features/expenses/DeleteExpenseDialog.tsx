import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { KIND_LABELS } from '../../../shared/kinds'
import type { Expense } from '../../../shared/types'
import { formatDisplayDate } from '../../../shared/dates'
import { ApiRequestError } from '../../api/client'
import { Button, Modal } from '../../ui'
import { signedAmount } from './displayAmount'
import styles from './DeleteExpenseDialog.module.css'

export const DELETE_FAILED_MESSAGE = 'המחיקה נכשלה, הרישום לא נמחק. נסו שוב.'

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
  const label = KIND_LABELS[expense.kind]
  const what = [expense.description, expense.category].filter(Boolean).join(' · ') || label

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
    <Modal title={`מחיקת ${label}`} onClose={onClose} size="sm" busy={deleting}>
      <p className={styles.question}>{`למחוק את ה${label}?`}</p>
      <dl className={styles.details}>
        <div>
          <dt>תאריך</dt>
          <dd>
            <span className="num">{formatDisplayDate(expense.expenseDate)}</span>
          </dd>
        </div>
        <div>
          <dt>{expense.description ? 'תיאור' : expense.category ? 'קטגוריה' : 'סוג'}</dt>
          <dd>{what}</dd>
        </div>
        <div>
          <dt>סכום</dt>
          <dd>
            <span className="num">{signedAmount(expense)}</span>
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
        <Button variant="danger" loading={deleting} icon={<Trash2 size={18} aria-hidden="true" />} onClick={handleDelete}>
          {deleting ? 'מוחק…' : 'מחיקה'}
        </Button>
        <Button variant="secondary" onClick={onClose} disabled={deleting} data-autofocus>
          ביטול
        </Button>
      </div>
    </Modal>
  )
}
