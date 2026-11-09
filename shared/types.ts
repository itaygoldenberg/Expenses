import type { Category } from './categories.js'
import type { Kind } from './kinds.js'

/** An expense as returned by the API. */
export type Expense = {
  id: string
  kind: Kind
  /** null for income */
  category: Category | null
  description: string | null
  /** Shekels with exactly two decimals, e.g. "249.90" */
  amount: string
  /** YYYY-MM-DD */
  expenseDate: string
}

/** Body of POST /api/expenses and PUT /api/expenses/:id. */
export type ExpenseInput = {
  /** Optional for backward compatibility; missing = 'expense'. */
  kind?: string
  category: string
  description: string
  amount: string
  expenseDate: string
}

export type FieldErrors = Partial<Record<keyof ExpenseInput, string>>

export type ApiError = {
  error: { code: string; message: string; fields?: FieldErrors }
}
