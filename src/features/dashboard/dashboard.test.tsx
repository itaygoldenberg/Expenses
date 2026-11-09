// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen, within } from '@testing-library/react'
import type { Category } from '../../../shared/categories'
import { todayLocal } from '../../../shared/dates'
import type { Kind } from '../../../shared/kinds'
import type { Expense } from '../../../shared/types'
import { renderWithData } from '../../test/renderWithData'
import { computeDashboard } from './dashboardData'

const api = vi.hoisted(() => ({ fetchExpenses: vi.fn() }))
vi.mock('../../api/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../api/client')>()),
  fetchExpenses: api.fetchExpenses,
}))
// Charts are loaded lazily and need a canvas; the numbers are what matters here
vi.mock('./DashboardCharts', () => ({ DashboardTrend: () => null, DashboardDonut: () => null }))

const { HomePage } = await import('../../pages/HomePage')

let n = 0
const r = (kind: Kind, amount: string, expenseDate: string, category: Category | null = 'מזון'): Expense => ({
  id: String(++n),
  kind,
  category: kind === 'income' ? null : category,
  description: null,
  amount,
  expenseDate,
})

afterEach(cleanup)

describe('computeDashboard', () => {
  const today = '2026-11-10'

  it('this month: net expenses, income, record count and top category', () => {
    const d = computeDashboard(
      [
        r('expense', '300', '2026-11-02', 'דלק'),
        r('expense', '100', '2026-11-03', 'מזון'),
        r('refund', '50', '2026-11-04', 'דלק'),
        r('income', '9000', '2026-11-05'),
        r('expense', '200', '2026-10-15', 'מזון'),
      ],
      today,
    )
    expect(d.monthLabel).toBe('נובמבר 2026')
    expect(d.current).toMatchObject({ netExpenses: 35000, income: 900000, recordCount: 4 })
    expect(d.topCategory).toBe('דלק')
    expect(d.change).toBe(75) // 350 vs 200
  })

  it('shows no change without data for both months', () => {
    expect(computeDashboard([r('expense', '10', '2026-11-02')], today).change).toBeNull()
    // Income alone last month is not spending to compare with
    expect(computeDashboard([r('expense', '10', '2026-11-02'), r('income', '10', '2026-10-02')], today).change).toBeNull()
  })

  it('trend covers the last 6 months, oldest first, with net and income', () => {
    const d = computeDashboard([r('expense', '10', '2026-06-30'), r('expense', '10', '2026-06-01'), r('refund', '4', '2026-09-09'), r('income', '7', '2026-11-01'), r('expense', '99', '2026-05-31')], today)
    expect(d.trend.map((p) => p.label)).toEqual(['יונ', 'יול', 'אוג', 'ספט', 'אוק', 'נוב'])
    expect(d.trend.map((p) => p.net)).toEqual([2000, 0, 0, -400, 0, 0])
    expect(d.trend.at(-1)!.income).toBe(700)
  })

  it('recent: newest first, at most 6', () => {
    const many = Array.from({ length: 8 }, (_, i) => r('expense', '1', `2026-11-0${i + 1}`))
    expect(computeDashboard(many, today).recent.map((e) => e.expenseDate)).toEqual([
      '2026-11-08',
      '2026-11-07',
      '2026-11-06',
      '2026-11-05',
      '2026-11-04',
      '2026-11-03',
    ])
  })
})

describe('HomePage', () => {
  it('shows this month from real records', async () => {
    const today = todayLocal()
    api.fetchExpenses.mockResolvedValue([r('expense', '120.50', today, 'דלק'), r('income', '1000', today)])
    renderWithData(<HomePage />)
    const kpis = await screen.findByRole('region', { name: 'סיכום החודש' })
    expect(within(kpis).getByText('₪120.50', { selector: '.visually-hidden' })).toBeInTheDocument()
    expect(within(kpis).getByText('₪1,000.00', { selector: '.visually-hidden' })).toBeInTheDocument()
    expect(within(kpis).getByText('דלק')).toBeInTheDocument()
    expect(within(kpis).getByText('אין נתונים להשוואה לחודש הקודם')).toBeInTheDocument()
  })

  it('welcomes a user without records', async () => {
    api.fetchExpenses.mockResolvedValue([])
    renderWithData(<HomePage />)
    expect(await screen.findByRole('button', { name: /הוספת הוצאה ראשונה/ })).toBeInTheDocument()
  })
})
