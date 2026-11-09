import { CATEGORIES, type Category } from '../../../shared/categories'
import { parseShekelsToAgorot } from '../../../shared/money'
import type { Expense } from '../../../shared/types'

/**
 * Metric definitions (PRD 4.8), all in whole agorot:
 * - expenses (net) = sum of expenses − sum of refunds
 * - income = sum of income
 * - count = number of expense records (refunds and income are not counted)
 */

export type Metric = 'amount' | 'count'

export function agorotOf(e: Expense): number {
  const parsed = parseShekelsToAgorot(e.amount)
  return parsed.ok ? parsed.agorot : 0
}

/** Contribution of one record to net expenses: expense +, refund −, income 0. */
export function netContribution(e: Expense): number {
  if (e.kind === 'income') return 0
  if (e.kind === 'refund') return -agorotOf(e)
  return agorotOf(e)
}

/** Value of one record for the chosen metric. */
export function metricValue(e: Expense, metric: Metric): number {
  if (metric === 'count') return e.kind === 'income' || e.kind === 'refund' ? 0 : 1
  return netContribution(e)
}

export type Summary = {
  /** expenses − refunds */
  netExpenses: number
  income: number
  /** number of expense records */
  expenseCount: number
  /** all records of every kind */
  recordCount: number
  /** at least one expense or refund (needed before comparing periods) */
  hasSpending: boolean
}

export function summarize(expenses: readonly Expense[]): Summary {
  const s: Summary = { netExpenses: 0, income: 0, expenseCount: 0, recordCount: 0, hasSpending: false }
  for (const e of expenses) {
    s.recordCount += 1
    if (e.kind === 'income') {
      s.income += agorotOf(e)
      continue
    }
    s.hasSpending = true
    s.netExpenses += netContribution(e)
    if (e.kind !== 'refund') s.expenseCount += 1
  }
  return s
}

/**
 * Per-category totals for the metric, only categories with a positive value
 * (a refund larger than the expenses leaves nothing to show), largest first.
 */
export function byCategory(expenses: readonly Expense[], metric: Metric): { category: Category; value: number }[] {
  const totals = new Map<Category, number>()
  for (const e of expenses) {
    if (!e.category) continue
    totals.set(e.category, (totals.get(e.category) ?? 0) + metricValue(e, metric))
  }
  const order = (c: Category) => CATEGORIES.indexOf(c)
  return [...totals.entries()]
    .filter(([, value]) => value > 0)
    .map(([category, value]) => ({ category, value }))
    .sort((a, b) => b.value - a.value || order(a.category) - order(b.category))
}

/** Change in percent from `previous` to `current`; null when there is no positive base to compare with. */
export function percentChange(current: number, previous: number): number | null {
  if (previous <= 0) return null
  return ((current - previous) / previous) * 100
}

/** Records whose date is within [from, to] (inclusive, YYYY-MM-DD). */
export function inRange(expenses: readonly Expense[], range: { from: string; to: string }): Expense[] {
  return expenses.filter((e) => e.expenseDate >= range.from && e.expenseDate <= range.to)
}
