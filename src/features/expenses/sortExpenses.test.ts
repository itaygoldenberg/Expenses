import { describe, expect, it } from 'vitest'
import type { Expense } from '../../../shared/types'
import { DEFAULT_SORT, nextSort, sortExpenses } from './sortExpenses'

const e = (id: string, category: string, amount: string, expenseDate: string): Expense =>
  ({ id, category, description: null, amount, expenseDate }) as Expense

// Server order: newest date first, then newest created
const list = [
  e('a', 'מזון', '249.90', '2026-11-08'),
  e('b', 'דלק', '9.90', '2026-11-08'),
  e('c', 'דיור', '100.00', '2026-11-02'),
  e('d', 'אחר', '1000.00', '2026-10-15'),
]
const ids = (xs: Expense[]) => xs.map((x) => x.id).join('')

describe('sortExpenses', () => {
  it('defaults to date, newest first, keeping server order for ties', () => {
    expect(DEFAULT_SORT).toEqual({ key: 'date', direction: 'desc' })
    expect(ids(sortExpenses(list, DEFAULT_SORT))).toBe('abcd')
  })

  it('sorts by date ascending', () => {
    expect(ids(sortExpenses(list, { key: 'date', direction: 'asc' }))).toBe('dcab')
  })

  it('sorts amounts numerically, not as text', () => {
    expect(ids(sortExpenses(list, { key: 'amount', direction: 'desc' }))).toBe('dacb')
    expect(ids(sortExpenses(list, { key: 'amount', direction: 'asc' }))).toBe('bcad')
  })

  it('sorts Hebrew categories alphabetically', () => {
    // אחר, דיור, דלק, מזון
    expect(ids(sortExpenses(list, { key: 'category', direction: 'asc' }))).toBe('dcba')
    expect(ids(sortExpenses(list, { key: 'category', direction: 'desc' }))).toBe('abcd')
  })

  it('does not change the original list', () => {
    sortExpenses(list, { key: 'amount', direction: 'asc' })
    expect(ids(list)).toBe('abcd')
  })
})

describe('nextSort', () => {
  it('flips direction on the active column', () => {
    expect(nextSort(DEFAULT_SORT, 'date')).toEqual({ key: 'date', direction: 'asc' })
  })

  it('starts a new column at its natural direction', () => {
    expect(nextSort(DEFAULT_SORT, 'category')).toEqual({ key: 'category', direction: 'asc' })
    expect(nextSort(DEFAULT_SORT, 'amount')).toEqual({ key: 'amount', direction: 'desc' })
  })
})
