import { parseShekelsToAgorot } from '../../../shared/money'
import type { Expense } from '../../../shared/types'

export type SortKey = 'date' | 'category' | 'amount'
export type SortDirection = 'asc' | 'desc'
export type SortState = { key: SortKey; direction: SortDirection }

export const DEFAULT_SORT: SortState = { key: 'date', direction: 'desc' }

/** Direction used the first time a column is chosen. */
export const FIRST_DIRECTION: Record<SortKey, SortDirection> = {
  date: 'desc',
  category: 'asc',
  amount: 'desc',
}

/** Clicking the active column flips direction; another column starts at its first direction. */
export function nextSort(current: SortState, key: SortKey): SortState {
  if (current.key === key) return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' }
  return { key, direction: FIRST_DIRECTION[key] }
}

const hebrew = new Intl.Collator('he')

function agorot(e: Expense): number {
  const parsed = parseShekelsToAgorot(e.amount)
  return parsed.ok ? parsed.agorot : 0
}

/**
 * Returns a sorted copy. Ties keep the server order (newest date, then newest created),
 * because Array.prototype.sort is stable and the API already returns that order.
 */
export function sortExpenses(expenses: readonly Expense[], sort: SortState): Expense[] {
  const factor = sort.direction === 'asc' ? 1 : -1
  const compare = (a: Expense, b: Expense): number => {
    switch (sort.key) {
      case 'date':
        return a.expenseDate < b.expenseDate ? -1 : a.expenseDate > b.expenseDate ? 1 : 0
      case 'category':
        return hebrew.compare(a.category, b.category)
      case 'amount':
        return agorot(a) - agorot(b)
    }
  }
  return [...expenses].sort((a, b) => factor * compare(a, b))
}

/** Options for the mobile sort select. */
export const SORT_OPTIONS: { value: string; label: string; sort: SortState }[] = [
  { value: 'date-desc', label: 'תאריך (מהחדש לישן)', sort: { key: 'date', direction: 'desc' } },
  { value: 'date-asc', label: 'תאריך (מהישן לחדש)', sort: { key: 'date', direction: 'asc' } },
  { value: 'category-asc', label: 'קטגוריה (א–ת)', sort: { key: 'category', direction: 'asc' } },
  { value: 'category-desc', label: 'קטגוריה (ת–א)', sort: { key: 'category', direction: 'desc' } },
  { value: 'amount-desc', label: 'סכום (מהגבוה לנמוך)', sort: { key: 'amount', direction: 'desc' } },
  { value: 'amount-asc', label: 'סכום (מהנמוך לגבוה)', sort: { key: 'amount', direction: 'asc' } },
]
