import { formatAgorot } from '../../shared/money.js'
import type { Expense } from '../../shared/types.js'
import type { Category } from '../../shared/categories.js'

/** A row of public.expenses as selected by the API (expense_date as YYYY-MM-DD text). */
export type ExpenseRow = {
  id: string
  category: string
  description: string | null
  amount_agorot: number
  expense_date: string
}

export function rowToExpense(row: ExpenseRow): Expense {
  return {
    id: row.id,
    category: row.category as Category,
    description: row.description,
    amount: formatAgorot(Number(row.amount_agorot)),
    expenseDate: row.expense_date,
  }
}
