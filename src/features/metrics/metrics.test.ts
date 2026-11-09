import { describe, expect, it } from 'vitest'
import type { Category } from '../../../shared/categories'
import type { Kind } from '../../../shared/kinds'
import type { Expense } from '../../../shared/types'
import { byCategory, inRange, percentChange, summarize } from './metrics'
import { currentAndPreviousMonth, lastMonths, periodRange, previousRange } from './periods'

let n = 0
const r = (kind: Kind, amount: string, expenseDate: string, category: Category | null = 'מזון'): Expense => ({
  id: String(++n),
  kind,
  category: kind === 'income' ? null : category,
  description: null,
  amount,
  expenseDate,
})

describe('summarize (PRD 4.8)', () => {
  it('net expenses = expenses − refunds; income separate; count = expense records only', () => {
    const s = summarize([
      r('expense', '100.10', '2026-11-01'),
      r('expense', '49.90', '2026-11-02', 'דלק'),
      r('refund', '20.05', '2026-11-03'),
      r('income', '12000', '2026-11-04'),
    ])
    expect(s).toEqual({ netExpenses: 12995, income: 1200000, expenseCount: 2, recordCount: 4, hasSpending: true })
  })

  it('income alone is not spending', () => {
    expect(summarize([r('income', '10', '2026-11-01')])).toMatchObject({ netExpenses: 0, hasSpending: false })
  })

  it('stays exact in agorot (no floating point drift)', () => {
    const many = Array.from({ length: 10 }, () => r('expense', '0.10', '2026-11-01'))
    expect(summarize(many).netExpenses).toBe(100)
  })
})

describe('byCategory', () => {
  it('nets refunds per category and drops categories that are not positive', () => {
    const data = [
      r('expense', '100', '2026-11-01', 'מזון'),
      r('refund', '30', '2026-11-02', 'מזון'),
      r('expense', '50', '2026-11-01', 'דלק'),
      r('refund', '80', '2026-11-02', 'דלק'), // refund larger than the expense
      r('income', '500', '2026-11-03'),
    ]
    expect(byCategory(data, 'amount')).toEqual([{ category: 'מזון', value: 7000 }])
  })

  it('count metric counts expense records only', () => {
    const data = [
      r('expense', '1', '2026-11-01', 'מזון'),
      r('expense', '1', '2026-11-01', 'מזון'),
      r('refund', '1', '2026-11-01', 'מזון'),
      r('refund', '1', '2026-11-01', 'דלק'),
    ]
    expect(byCategory(data, 'count')).toEqual([{ category: 'מזון', value: 2 }])
  })
})

describe('percentChange', () => {
  it('compares only against a positive base', () => {
    expect(percentChange(150, 100)).toBe(50)
    expect(percentChange(50, 100)).toBe(-50)
    expect(percentChange(50, 0)).toBeNull()
    expect(percentChange(50, -10)).toBeNull()
  })
})

describe('periods', () => {
  it('month, 3 months and year end with the current calendar month', () => {
    expect(periodRange('month', '2026-11-10')).toEqual({ from: '2026-11-01', to: '2026-11-30' })
    expect(periodRange('3months', '2026-02-15')).toEqual({ from: '2025-12-01', to: '2026-02-28' })
    expect(periodRange('year', '2026-11-10')).toEqual({ from: '2025-12-01', to: '2026-11-30' })
    expect(periodRange('month', '2028-02-03')).toEqual({ from: '2028-02-01', to: '2028-02-29' })
    expect(periodRange('all', '2026-11-10')).toBeNull()
  })

  it('custom range needs two valid, ordered dates', () => {
    expect(periodRange('custom', '2026-11-10', { from: '2026-10-01', to: '2026-10-15' })).toEqual({
      from: '2026-10-01',
      to: '2026-10-15',
    })
    expect(periodRange('custom', '2026-11-10', { from: '2026-10-15', to: '2026-10-01' })).toBeNull()
    expect(periodRange('custom', '2026-11-10', { from: '2026-10-15' })).toBeNull()
  })

  it('previous period has the same length, right before', () => {
    expect(previousRange('month', { from: '2026-01-01', to: '2026-01-31' })).toEqual({ from: '2025-12-01', to: '2025-12-31' })
    expect(previousRange('month', { from: '2026-03-01', to: '2026-03-31' })).toEqual({ from: '2026-02-01', to: '2026-02-28' })
    expect(previousRange('3months', { from: '2026-09-01', to: '2026-11-30' })).toEqual({ from: '2026-06-01', to: '2026-08-31' })
    expect(previousRange('custom', { from: '2026-03-01', to: '2026-03-10' })).toEqual({ from: '2026-02-19', to: '2026-02-28' })
  })

  it('lastMonths and current/previous month', () => {
    expect(lastMonths('2026-02-10', 3)).toEqual(['2025-12', '2026-01', '2026-02'])
    expect(currentAndPreviousMonth('2026-01-05')).toEqual({
      current: { from: '2026-01-01', to: '2026-01-31' },
      previous: { from: '2025-12-01', to: '2025-12-31' },
    })
  })

  it('inRange is inclusive', () => {
    const data = [r('expense', '1', '2026-10-31'), r('expense', '1', '2026-11-01'), r('expense', '1', '2026-11-30'), r('expense', '1', '2026-12-01')]
    expect(inRange(data, { from: '2026-11-01', to: '2026-11-30' }).map((e) => e.expenseDate)).toEqual(['2026-11-01', '2026-11-30'])
  })
})
