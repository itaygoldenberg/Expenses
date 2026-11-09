import { formatAgorotWithSeparators } from '../../../shared/money'
import { metricValue as valueOf, type Metric } from '../metrics/metrics'
import type { Expense } from '../../../shared/types'

export type { Metric } from '../metrics/metrics'
export { byCategory } from '../metrics/metrics'

export const SHORT_MONTHS = ['ינו', 'פבר', 'מרץ', 'אפר', 'מאי', 'יונ', 'יול', 'אוג', 'ספט', 'אוק', 'נוב', 'דצמ'] as const

/** Years that have expenses, newest first. */
export function yearsWithExpenses(expenses: readonly Expense[]): string[] {
  return [...new Set(expenses.map((e) => e.expenseDate.slice(0, 4)))].sort((a, b) => b.localeCompare(a))
}

/** Totals per year, oldest to newest, including empty years in between (value 0). */
export function byYear(expenses: readonly Expense[], metric: Metric): { label: string; value: number }[] {
  if (expenses.length === 0) return []
  const totals = new Map<number, number>()
  for (const e of expenses) {
    const y = Number(e.expenseDate.slice(0, 4))
    totals.set(y, (totals.get(y) ?? 0) + valueOf(e, metric))
  }
  const years = [...totals.keys()]
  const result: { label: string; value: number }[] = []
  for (let y = Math.min(...years); y <= Math.max(...years); y++) {
    result.push({ label: String(y), value: totals.get(y) ?? 0 })
  }
  return result
}

/** 12 monthly totals (January–December) for the given year; empty months are 0. */
export function byMonth(expenses: readonly Expense[], year: string, metric: Metric): { label: string; value: number }[] {
  const totals = new Array<number>(12).fill(0)
  for (const e of expenses) {
    if (e.expenseDate.slice(0, 4) !== year) continue
    totals[Number(e.expenseDate.slice(5, 7)) - 1] += valueOf(e, metric)
  }
  return totals.map((value, i) => ({ label: SHORT_MONTHS[i], value }))
}

/** Display text for a value: "₪ 1,249.90" for amounts ("−₪ 20.00" when negative), "3" for counts. */
export function formatValue(value: number, metric: Metric): string {
  if (metric !== 'amount') return String(value)
  return value < 0 ? `−₪ ${formatAgorotWithSeparators(-value)}` : `₪ ${formatAgorotWithSeparators(value)}`
}

/** Chart.js works in numbers: shekels for amounts (2 decimals, display only), counts as is. */
export function toChartNumber(value: number, metric: Metric): number {
  return metric === 'amount' ? value / 100 : value
}
