import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Kind } from '../../../shared/kinds'
import type { Expense, ExpenseInput } from '../../../shared/types'
import { createExpense, deleteExpense, fetchExpenses, updateExpense } from '../../api/client'
import { Sheet, Toast, type ToastMessage } from '../../ui'
import { ExpenseForm } from './ExpenseForm'

export type ExpensesState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; expenses: Expense[] }

type ExpensesContext = {
  state: ExpensesState
  /** reload(false) refreshes without switching to "loading", so lists stay on screen. */
  reload: (showLoading?: boolean) => Promise<void>
  create: (input: ExpenseInput) => Promise<Expense>
  update: (id: string, input: ExpenseInput) => Promise<Expense>
  remove: (id: string) => Promise<void>
  /** Short message at the bottom / corner of the screen. */
  notify: (text: string, kind?: ToastMessage['kind']) => void
  /** Opens the "add record" sheet (from any page). */
  openAdd: () => void
}

/** Hebrew gender differs per type (זיכוי is masculine). */
export const SAVED_MESSAGES: Record<Kind, string> = {
  expense: 'ההוצאה נשמרה',
  refund: 'הזיכוי נשמר',
  income: 'ההכנסה נשמרה',
}

const Context = createContext<ExpensesContext | null>(null)

/**
 * Loads the records once for the whole app and shares them with every page,
 * so a record added from any page shows up everywhere right away (ADR-11).
 */
export function ExpensesProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ExpensesState>({ status: 'loading' })
  const [toast, setToast] = useState<ToastMessage | null>(null)
  const [adding, setAdding] = useState(false)
  const toastId = useRef(0)

  const reload = useCallback(async (showLoading = true) => {
    if (showLoading) setState({ status: 'loading' })
    try {
      setState({ status: 'ready', expenses: await fetchExpenses() })
    } catch {
      // Keep the list on screen when a background refresh fails
      if (showLoading) setState({ status: 'error' })
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  const notify = useCallback((text: string, kind: ToastMessage['kind'] = 'success') => {
    toastId.current += 1
    setToast({ id: toastId.current, text, kind })
  }, [])

  // After every change, reload from the server so lists reflect what was actually stored
  const create = useCallback(
    async (input: ExpenseInput) => {
      const saved = await createExpense(input)
      void reload(false)
      return saved
    },
    [reload],
  )
  const update = useCallback(
    async (id: string, input: ExpenseInput) => {
      const saved = await updateExpense(id, input)
      void reload(false)
      return saved
    },
    [reload],
  )
  const remove = useCallback(
    async (id: string) => {
      try {
        await deleteExpense(id)
      } finally {
        void reload(false)
      }
    },
    [reload],
  )

  const value = useMemo<ExpensesContext>(
    () => ({ state, reload, create, update, remove, notify, openAdd: () => setAdding(true) }),
    [state, reload, create, update, remove, notify],
  )

  return (
    <Context.Provider value={value}>
      {children}
      {adding && (
        <Sheet title="רישום חדש" onClose={() => setAdding(false)}>
          <ExpenseForm
            onSubmit={create}
            onSaved={(saved) => {
              setAdding(false)
              notify(SAVED_MESSAGES[saved.kind])
            }}
          />
        </Sheet>
      )}
      <Toast message={toast} onDone={() => setToast(null)} />
    </Context.Provider>
  )
}

export function useExpensesData(): ExpensesContext {
  const ctx = useContext(Context)
  if (!ctx) throw new Error('useExpensesData must be used inside <ExpensesProvider>')
  return ctx
}
