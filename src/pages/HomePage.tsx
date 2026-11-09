import { useCallback, useEffect, useState } from 'react'
import { CheckCircle2, ListChecks, PlusCircle } from 'lucide-react'
import type { Expense } from '../../shared/types'
import { createExpense, fetchExpenses } from '../api/client'
import { ExpenseForm } from '../features/expenses/ExpenseForm'
import { ExpenseList } from '../features/expenses/ExpenseList'
import styles from './HomePage.module.css'

type LoadState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; expenses: Expense[] }

export function HomePage() {
  const [state, setState] = useState<LoadState>({ status: 'loading' })
  const [savedNotice, setSavedNotice] = useState(false)

  const load = useCallback(async () => {
    setState({ status: 'loading' })
    try {
      setState({ status: 'ready', expenses: await fetchExpenses() })
    } catch {
      setState({ status: 'error' })
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!savedNotice) return
    const timer = setTimeout(() => setSavedNotice(false), 3000)
    return () => clearTimeout(timer)
  }, [savedNotice])

  function handleSaved() {
    setSavedNotice(true)
    // Reload from the server so the list reflects what was actually stored
    void load()
  }

  return (
    <div className={styles.page}>
      <section className={styles.card} aria-labelledby="add-title">
        <h2 id="add-title" className={styles.title}>
          <PlusCircle size={22} aria-hidden="true" className={styles.titleIcon} />
          הוספת הוצאה
        </h2>
        <ExpenseForm onSubmit={createExpense} onSaved={handleSaved} />
        {savedNotice && (
          <p className={styles.notice} role="status">
            <CheckCircle2 size={18} aria-hidden="true" />
            ההוצאה נשמרה
          </p>
        )}
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

        {state.status === 'ready' && state.expenses.length > 0 && <ExpenseList expenses={state.expenses} />}
      </section>
    </div>
  )
}
