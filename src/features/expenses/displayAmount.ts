import { formatDisplayDate } from '../../../shared/dates'
import { KIND_LABELS } from '../../../shared/kinds'
import { formatAgorotWithSeparators, parseShekelsToAgorot } from '../../../shared/money'
import type { Expense } from '../../../shared/types'

/** "1249.9" → "1,249.90" for display. */
export function displayAmount(amount: string): string {
  const parsed = parseShekelsToAgorot(amount)
  return parsed.ok ? formatAgorotWithSeparators(parsed.agorot) : amount
}

/** Money that came in (refund / income) is shown with "+" and in green. */
export function isMoneyIn(e: Expense): boolean {
  return e.kind === 'refund' || e.kind === 'income'
}

/** "₪ 180.00" for an expense, "+₪ 120.00" for a refund or income. */
export function signedAmount(e: Expense): string {
  return `${isMoneyIn(e) ? '+' : ''}₪ ${displayAmount(e.amount)}`
}

/** Category, or "—" for income (which has none). */
export function categoryText(e: Expense): string {
  return e.category ?? '—'
}

/** Short text identifying a record, for screen-reader labels. */
export function describeRecord(e: Expense): string {
  const what = e.description ?? e.category ?? KIND_LABELS[e.kind]
  return `${what}, ${displayAmount(e.amount)} ₪, ${formatDisplayDate(e.expenseDate)}`
}
