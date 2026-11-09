import { useCallback, useEffect, useState } from 'react'
import type { Expense } from '../../shared/types'
import { fetchExpenses } from '../api/client'

export type ExpensesState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; expenses: Expense[] }

/**
 * Loads all expenses from the API on mount.
 * reload(false) refreshes without switching to "loading", so the list stays on screen.
 */
export function useExpenses() {
  const [state, setState] = useState<ExpensesState>({ status: 'loading' })

  const reload = useCallback(async (showLoading = true) => {
    if (showLoading) setState({ status: 'loading' })
    try {
      setState({ status: 'ready', expenses: await fetchExpenses() })
    } catch {
      setState({ status: 'error' })
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  return { state, reload }
}
