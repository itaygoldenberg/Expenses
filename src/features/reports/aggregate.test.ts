import { describe, expect, it } from 'vitest'
import type { Expense } from '../../../shared/types'
import { byCategory, byMonth, byYear, formatValue, yearsWithExpenses } from './aggregate'

const e = (category: string, amount: string, expenseDate: string): Expense =>
  ({ id: Math.random().toString(), category, description: null, amount, expenseDate }) as Expense

const list = [
  e('מזון', '0.10', '2026-11-01'),
  e('מזון', '0.20', '2026-11-09'),
  e('דלק', '33.33', '2026-10-31'),
  e('דלק', '33.33', '2026-01-01'),
  e('דלק', '33.33', '2025-12-31'),
  e('דיור', '320.00', '2023-05-05'),
]

describe('byCategory', () => {
  it('sums exactly in agorot, only categories with expenses, largest first', () => {
    expect(byCategory(list, 'amount')).toEqual([
      { category: 'דיור', value: 32000 },
      { category: 'דלק', value: 9999 },
      { category: 'מזון', value: 30 },
    ])
  })

  it('counts expenses', () => {
    expect(byCategory(list, 'count')).toEqual([
      { category: 'דלק', value: 3 },
      { category: 'מזון', value: 2 },
      { category: 'דיור', value: 1 },
    ])
  })

  it('breaks ties by the PRD category order', () => {
    const tie = [e('דלק', '10', '2026-01-01'), e('מזון', '10', '2026-01-01')]
    expect(byCategory(tie, 'amount').map((x) => x.category)).toEqual(['מזון', 'דלק'])
  })

  it('is empty without expenses', () => {
    expect(byCategory([], 'amount')).toEqual([])
  })
})

describe('byYear', () => {
  it('goes from oldest to newest and fills empty years with 0', () => {
    expect(byYear(list, 'amount')).toEqual([
      { label: '2023', value: 32000 },
      { label: '2024', value: 0 },
      { label: '2025', value: 3333 },
      { label: '2026', value: 6696 },
    ])
    expect(byYear(list, 'count').map((x) => x.value)).toEqual([1, 0, 1, 4])
  })

  it('is empty without expenses', () => {
    expect(byYear([], 'count')).toEqual([])
  })
})

describe('byMonth', () => {
  it('returns 12 months for the chosen year, with zeros', () => {
    const months = byMonth(list, '2026', 'amount')
    expect(months).toHaveLength(12)
    expect(months[0]).toEqual({ label: 'ינו', value: 3333 })
    expect(months[9]).toEqual({ label: 'אוק', value: 3333 })
    expect(months[10]).toEqual({ label: 'נוב', value: 30 })
    expect(months[11]).toEqual({ label: 'דצמ', value: 0 })
  })

  it('puts 31/12 and 01/01 in the right year', () => {
    expect(byMonth(list, '2025', 'count')[11].value).toBe(1)
    expect(byMonth(list, '2025', 'count')[0].value).toBe(0)
    expect(byMonth(list, '2026', 'count')[0].value).toBe(1)
  })
})

describe('helpers', () => {
  it('lists years newest first', () => {
    expect(yearsWithExpenses(list)).toEqual(['2026', '2025', '2023'])
  })

  it('formats values', () => {
    expect(formatValue(124990, 'amount')).toBe('₪ 1,249.90')
    expect(formatValue(30, 'amount')).toBe('₪ 0.30')
    expect(formatValue(3, 'count')).toBe('3')
  })
})
