import { describe, expect, it } from 'vitest'
import type { Expense } from '../../../shared/types'
import {
  EMPTY_FILTERS,
  availableYears,
  daysInMonth,
  filterExpenses,
  normalizeFilters,
  parseMaxAmount,
  type Filters,
} from './filterExpenses'

const e = (id: string, expenseDate: string, amount: string): Expense =>
  ({ id, category: 'מזון', description: null, amount, expenseDate }) as Expense

const list = [
  e('a', '2026-11-01', '100.00'),
  e('b', '2026-10-31', '249.90'),
  e('c', '2026-11-09', '9.90'),
  e('d', '2025-12-31', '320.00'),
  e('e', '2026-01-01', '100.00'),
  e('f', '2024-02-29', '50.00'),
]
const ids = (f: Partial<Filters>) =>
  filterExpenses(list, { ...EMPTY_FILTERS, ...f })
    .map((x) => x.id)
    .join('')

describe('filterExpenses', () => {
  it('returns everything without conditions', () => {
    expect(ids({})).toBe('abcdef')
  })

  it('filters by year', () => {
    expect(ids({ year: '2026' })).toBe('abce')
    expect(ids({ year: '2025' })).toBe('d')
  })

  it('filters by year and month, respecting month boundaries', () => {
    expect(ids({ year: '2026', month: '11' })).toBe('ac')
    expect(ids({ year: '2026', month: '10' })).toBe('b')
    expect(ids({ year: '2026', month: '1' })).toBe('e')
  })

  it('filters by year, month and day', () => {
    expect(ids({ year: '2026', month: '11', day: '1' })).toBe('a')
    expect(ids({ year: '2026', month: '10', day: '31' })).toBe('b')
    expect(ids({ year: '2024', month: '2', day: '29' })).toBe('f')
  })

  it('filters by max amount, including an amount equal to the limit', () => {
    expect(ids({ maxAmount: '100' })).toBe('acef')
    expect(ids({ maxAmount: '99.99' })).toBe('cf')
    expect(ids({ maxAmount: '9.90' })).toBe('c')
    expect(ids({ maxAmount: '200000' })).toBe('abcdef')
  })

  it('combines date and amount with AND', () => {
    expect(ids({ year: '2026', month: '11', maxAmount: '50' })).toBe('c')
    expect(ids({ year: '2026', maxAmount: '100' })).toBe('ace')
  })

  it('returns nothing when nothing matches', () => {
    expect(ids({ year: '2026', month: '3' })).toBe('')
  })

  it('ignores a month or day without its parent', () => {
    expect(ids({ month: '11' })).toBe('abcdef')
    expect(ids({ year: '2026', day: '1' })).toBe('abce')
  })
})

describe('daysInMonth', () => {
  it('handles leap years and month lengths', () => {
    expect(daysInMonth(2024, 2)).toBe(29)
    expect(daysInMonth(2026, 2)).toBe(28)
    expect(daysInMonth(2100, 2)).toBe(28)
    expect(daysInMonth(2000, 2)).toBe(29)
    expect(daysInMonth(2026, 4)).toBe(30)
    expect(daysInMonth(2026, 12)).toBe(31)
  })
})

describe('normalizeFilters', () => {
  it('clears month and day when the year is cleared', () => {
    expect(normalizeFilters({ year: '', month: '5', day: '3', maxAmount: '' })).toEqual(EMPTY_FILTERS)
  })

  it('clears the day when the month is cleared', () => {
    expect(normalizeFilters({ year: '2026', month: '', day: '3', maxAmount: '' }).day).toBe('')
  })

  it('clears a day that does not exist in the new month', () => {
    expect(normalizeFilters({ year: '2026', month: '4', day: '31', maxAmount: '' }).day).toBe('')
    expect(normalizeFilters({ year: '2026', month: '2', day: '29', maxAmount: '' }).day).toBe('')
    expect(normalizeFilters({ year: '2024', month: '2', day: '29', maxAmount: '' }).day).toBe('29')
  })

  it('keeps a day that still exists', () => {
    expect(normalizeFilters({ year: '2025', month: '3', day: '15', maxAmount: '' }).day).toBe('15')
  })
})

describe('availableYears / parseMaxAmount', () => {
  it('lists unique years, newest first', () => {
    expect(availableYears(list)).toEqual(['2026', '2025', '2024'])
  })

  it('parses the max amount', () => {
    expect(parseMaxAmount('')).toEqual({ ok: true, agorot: null })
    expect(parseMaxAmount('99.9')).toEqual({ ok: true, agorot: 9990 })
    expect(parseMaxAmount('abc')).toEqual({ ok: false, error: 'invalid' })
    expect(parseMaxAmount('-5')).toEqual({ ok: false, error: 'invalid' })
    expect(parseMaxAmount('0')).toEqual({ ok: false, error: 'invalid' })
    expect(parseMaxAmount('1.234')).toEqual({ ok: false, error: 'tooManyDecimals' })
  })
})
