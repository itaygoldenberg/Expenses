import { CATEGORIES, type Category } from '../../../shared/categories'
import { formatAgorotWithSeparators, parseShekelsToAgorot } from '../../../shared/money'
import type { Expense } from '../../../shared/types'

/** 'amount' = total in agorot (whole numbers), 'count' = number of expenses. */
export type Metric = 'amount' | 'count'

export const SHORT_MONTHS = ['ינו', 'פבר', 'מרץ', 'אפר', 'מאי', 'יונ', 'יול', 'אוג', 'ספט', 'אוק', 'נוב', 'דצמ'] as const

function valueOf(e: Expense, metric: Metric): number {
  if (metric === 'count') return 1
  const parsed = parseShekelsToAgorot(e.amount)
  return parsed.ok ? parsed.agorot : 0
}

/** Totals per category, only categories that have expenses, largest first. */
export function byCategory(expenses: readonly Expense[], metric: Metric): { category: Category; value: number }[] {
  const totals = new Map<Category, number>()
  for (const e of expenses) totals.set(e.category, (totals.get(e.category) ?? 0) + valueOf(e, metric))
  const order = (c: Category) => CATEGORIES.indexOf(c)
  return [...totals.entries()]
    .map(([category, value]) => ({ category, value }))
    .sort((a, b) => b.value - a.value || order(a.category) - order(b.category))
}

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

/** Display text for a value: "₪ 1,249.90" for amounts, "3" for counts. */
export function formatValue(value: number, metric: Metric): string {
  return metric === 'amount' ? `₪ ${formatAgorotWithSeparators(value)}` : String(value)
}

/** Chart.js works in numbers: shekels for amounts (2 decimals, display only), counts as is. */
export function toChartNumber(value: number, metric: Metric): number {
  return metric === 'amount' ? value / 100 : value
}
