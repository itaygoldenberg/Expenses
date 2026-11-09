import type { Category } from '../../../shared/categories'
import type { Expense } from '../../../shared/types'
import { HEBREW_MONTHS } from '../filters/filterExpenses'
import { SHORT_MONTHS } from '../reports/aggregate'
import type { TrendPoint } from '../reports/TrendChart'
import { agorotOf, byCategory, inRange, netContribution, percentChange, summarize, type Summary } from '../metrics/metrics'
import { currentAndPreviousMonth, lastMonths, monthKey } from '../metrics/periods'

export const TREND_MONTHS = 6
export const RECENT_COUNT = 6

export type Dashboard = {
  /** "נובמבר 2026" */
  monthLabel: string
  current: Summary
  /** Change of net expenses vs. the previous month; null unless both months have spending. */
  change: number | null
  topCategory: Category | null
  categories: { category: Category; value: number }[]
  trend: TrendPoint[]
  recent: Expense[]
}

/** Everything the home page shows, computed only from the user's real records. */
export function computeDashboard(expenses: readonly Expense[], today: string): Dashboard {
  const { current: thisMonth, previous: lastMonth } = currentAndPreviousMonth(today)
  const currentRecords = inRange(expenses, thisMonth)
  const current = summarize(currentRecords)
  const previous = summarize(inRange(expenses, lastMonth))
  const categories = byCategory(currentRecords, 'amount')

  const months = lastMonths(today, TREND_MONTHS)
  const totals = new Map(months.map((m) => [m, { net: 0, income: 0 }]))
  for (const e of expenses) {
    const t = totals.get(monthKey(e.expenseDate))
    if (!t) continue
    if (e.kind === 'income') t.income += agorotOf(e)
    else t.net += netContribution(e)
  }

  const [y, m] = [Number(today.slice(0, 4)), Number(today.slice(5, 7))]
  return {
    monthLabel: `${HEBREW_MONTHS[m - 1]} ${y}`,
    current,
    change: current.hasSpending && previous.hasSpending ? percentChange(current.netExpenses, previous.netExpenses) : null,
    topCategory: categories[0]?.category ?? null,
    categories,
    trend: months.map((key) => ({
      label: SHORT_MONTHS[Number(key.slice(5, 7)) - 1],
      ...totals.get(key)!,
    })),
    // The API already returns newest date first (then newest created)
    recent: [...expenses].sort((a, b) => (a.expenseDate < b.expenseDate ? 1 : a.expenseDate > b.expenseDate ? -1 : 0)).slice(0, RECENT_COUNT),
  }
}

