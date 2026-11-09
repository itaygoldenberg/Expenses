import { parseShekelsToAgorot } from '../../../shared/money'
import type { Expense } from '../../../shared/types'

/** Filter values as chosen in the form. Empty string = no condition. */
export type Filters = {
  year: string // "2026"
  month: string // "1".."12"
  day: string // "1".."31"
  maxAmount: string // shekels, e.g. "250" or "99.90"
}

export const EMPTY_FILTERS: Filters = { year: '', month: '', day: '', maxAmount: '' }

export const HEBREW_MONTHS = [
  'ינואר',
  'פברואר',
  'מרץ',
  'אפריל',
  'מאי',
  'יוני',
  'יולי',
  'אוגוסט',
  'ספטמבר',
  'אוקטובר',
  'נובמבר',
  'דצמבר',
] as const

/** Number of days in a month (month is 1–12), leap years included. */
export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

/** Years that have expenses, newest first. */
export function availableYears(expenses: readonly Expense[]): string[] {
  return [...new Set(expenses.map((e) => e.expenseDate.slice(0, 4)))].sort((a, b) => b.localeCompare(a))
}

/**
 * Keeps dependent choices valid after a change:
 * no year → no month/day; no month → no day; a day that does not exist in the
 * chosen month (e.g. 31 in a 30-day month, 29 Feb in a common year) is cleared.
 */
export function normalizeFilters(f: Filters): Filters {
  if (!f.year) return { ...f, month: '', day: '' }
  if (!f.month) return { ...f, day: '' }
  if (f.day && Number(f.day) > daysInMonth(Number(f.year), Number(f.month))) return { ...f, day: '' }
  return f
}

/** Converts the max amount field to agorot; null = no limit; 'invalid' with a reason. */
export function parseMaxAmount(
  value: string,
): { ok: true; agorot: number | null } | { ok: false; error: 'invalid' | 'tooManyDecimals' } {
  if (value.trim() === '') return { ok: true, agorot: null }
  const parsed = parseShekelsToAgorot(value)
  if (parsed.ok) return { ok: true, agorot: parsed.agorot }
  // A limit above ₪100,000 is harmless: no expense can be above it
  if (parsed.error === 'tooLarge') return { ok: true, agorot: Number.MAX_SAFE_INTEGER }
  return { ok: false, error: parsed.error === 'tooManyDecimals' ? 'tooManyDecimals' : 'invalid' }
}

/** Expenses that match ALL the given conditions (empty condition = no limit). */
export function filterExpenses(expenses: readonly Expense[], filters: Filters): Expense[] {
  const f = normalizeFilters(filters)
  const max = parseMaxAmount(f.maxAmount)
  const maxAgorot = max.ok ? max.agorot : null
  const pad = (s: string) => s.padStart(2, '0')

  return expenses.filter((e) => {
    const [y, m, d] = e.expenseDate.split('-')
    if (f.year && y !== f.year) return false
    if (f.month && m !== pad(f.month)) return false
    if (f.day && d !== pad(f.day)) return false
    if (maxAgorot !== null) {
      const amount = parseShekelsToAgorot(e.amount)
      if (!amount.ok || amount.agorot > maxAgorot) return false
    }
    return true
  })
}
