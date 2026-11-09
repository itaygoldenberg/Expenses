import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ListChecks, PlusCircle } from 'lucide-react'
import type { Expense } from '../../shared/types'
import { createExpense, deleteExpense, fetchExpenses, updateExpense } from '../api/client'
import { ExpenseForm } from '../features/expenses/ExpenseForm'
import { ExpenseList } from '../features/expenses/ExpenseList'
import { EditExpenseModal } from '../features/expenses/EditExpenseModal'
import { DeleteExpenseDialog } from '../features/expenses/DeleteExpenseDialog'
import { DEFAULT_SORT, nextSort, sortExpenses, type SortState } from '../features/expenses/sortExpenses'
import { Toast, type ToastMessage } from '../components/Toast'
import styles from './HomePage.module.css'

type LoadState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; expenses: Expense[] }

export const NOT_FOUND_MESSAGE = 'ההוצאה לא נמצאה — ייתכן שכבר נמחקה.'

export function HomePage() {
  const [state, setState] = useState<LoadState>({ status: 'loading' })
  const [sort, setSort] = useState<SortState>(DEFAULT_SORT)
  const [editing, setEditing] = useState<Expense | null>(null)
  const [deleting, setDeleting] = useState<Expense | null>(null)
  const [toast, setToast] = useState<ToastMessage | null>(null)
  const toastId = useRef(0)

  const showToast = useCallback((text: string, kind: ToastMessage['kind'] = 'success') => {
    toastId.current += 1
    setToast({ id: toastId.current, text, kind })
  }, [])
  const clearToast = useCallback(() => setToast(null), [])

  // Initial load shows "loading"; reloads after a change keep the current list on screen
  const load = useCallback(async (showLoading = true) => {
    if (showLoading) setState({ status: 'loading' })
    try {
      setState({ status: 'ready', expenses: await fetchExpenses() })
    } catch {
      setState({ status: 'error' })
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const sorted = useMemo(
    () => (state.status === 'ready' ? sortExpenses(state.expenses, sort) : []),
    [state, sort],
  )

  function afterChange(message: string, kind: ToastMessage['kind'] = 'success') {
    showToast(message, kind)
    // Reload from the server so the list reflects what was actually stored
    void load(false)
  }

  function handleNotFound() {
    setEditing(null)
    setDeleting(null)
    afterChange(NOT_FOUND_MESSAGE, 'error')
  }

  return (
    <div className={styles.page}>
      <section className={styles.card} aria-labelledby="add-title">
        <h2 id="add-title" className={styles.title}>
          <PlusCircle size={22} aria-hidden="true" className={styles.titleIcon} />
          הוספת הוצאה
        </h2>
        <ExpenseForm onSubmit={createExpense} onSaved={() => afterChange('ההוצאה נשמרה')} />
      </section>

      <section className={styles.card} aria-labelledby="list-title">
        <h2 id="list-title" className={styles.title}>
          <ListChecks size={22} aria-hidden="true" className={styles.titleIcon} />
          רשימת הוצאות
        </h2>

        {state.status === 'loading' && (
          <p className={styles.message} role="status">
            טוען הוצאות…
          </p>
        )}

        {state.status === 'error' && (
          <div className={styles.errorBox} role="alert">
            <p>לא הצלחנו לטעון את ההוצאות</p>
            <button type="button" className={styles.secondary} onClick={() => void load()}>
              נסו שוב
            </button>
          </div>
        )}

        {state.status === 'ready' && state.expenses.length === 0 && (
          <p className={styles.message}>עדיין אין הוצאות. אפשר להוסיף את הראשונה בטופס למעלה.</p>
        )}

        {state.status === 'ready' && state.expenses.length > 0 && (
          <ExpenseList
            expenses={sorted}
            sort={sort}
            onSortColumn={(key) => setSort((s) => nextSort(s, key))}
            onSortChange={setSort}
            onEdit={setEditing}
            onDelete={setDeleting}
          />
        )}
      </section>

      {editing && (
        <EditExpenseModal
          key={editing.id}
          expense={editing}
          onSubmit={updateExpense}
          onSaved={() => {
            setEditing(null)
            afterChange('ההוצאה עודכנה')
          }}
          onNotFound={handleNotFound}
          onClose={() => setEditing(null)}
        />
      )}

      {deleting && (
        <DeleteExpenseDialog
          key={deleting.id}
          expense={deleting}
          onConfirm={deleteExpense}
          onDeleted={() => {
            setDeleting(null)
            afterChange('ההוצאה נמחקה')
          }}
          onNotFound={handleNotFound}
          onClose={() => setDeleting(null)}
        />
      )}

      <Toast message={toast} onDone={clearToast} />
    </div>
  )
}
