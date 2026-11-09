import type { Category } from './categories.js'

/** An expense as returned by the API. */
export type Expense = {
  id: string
  category: Category
  description: string | null
  /** Shekels with exactly two decimals, e.g. "249.90" */
  amount: string
  /** YYYY-MM-DD */
  expenseDate: string
}

/** Body of POST /api/expenses (and PUT in a later milestone). */
export type ExpenseInput = {
  category: string
  description: string
  amount: string
  expenseDate: string
}

export type FieldErrors = Partial<Record<keyof ExpenseInput, string>>

export type ApiError = {
  error: { code: string; message: string; fields?: FieldErrors }
}
