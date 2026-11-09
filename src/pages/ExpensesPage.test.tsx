// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Category } from '../../shared/categories'
import type { Kind } from '../../shared/kinds'
import type { Expense } from '../../shared/types'
import { ApiRequestError } from '../api/client'
import { renderWithData } from '../test/renderWithData'

const api = vi.hoisted(() => ({ fetchExpenses: vi.fn(), updateExpense: vi.fn(), deleteExpense: vi.fn() }))
vi.mock('../api/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api/client')>()),
  fetchExpenses: api.fetchExpenses,
  updateExpense: api.updateExpense,
  deleteExpense: api.deleteExpense,
}))

const { ExpensesPage, NO_MATCHES_MESSAGE, NO_RECORDS_MESSAGE, NOT_FOUND_MESSAGE } = await import('./ExpensesPage')

const e = (id: string, description: string, amount: string, expenseDate: string, kind: Kind = 'expense', category: Category | null = 'מזון'): Expense => ({
  id,
  kind,
  category: kind === 'income' ? null : category,
  description,
  amount,
  expenseDate,
})

const data = [
  e('1', 'Super Pharm קניות', '100.00', '2026-11-01', 'expense', 'קניות'),
  e('2', 'החזר סופר', '20.00', '2026-11-05', 'refund', 'מזון'),
  e('3', 'משכורת', '9000.00', '2026-11-09', 'income'),
  e('4', 'סופרמרקט', '249.90', '2026-10-31', 'expense', 'מזון'),
  e('5', 'דלק שנה קודמת', '320.00', '2025-12-31', 'expense', 'דלק'),
]

beforeEach(() => {
  api.fetchExpenses.mockResolvedValue(data)
  api.updateExpense.mockReset()
  api.deleteExpense.mockReset()
})
afterEach(cleanup)

async function setup() {
  const user = userEvent.setup()
  renderWithData(<ExpensesPage />, '/expenses')
  await screen.findByRole('table')
  return user
}

/** The "N רישומים" line above the list (the toast region is another status). */
const summary = () => screen.getAllByRole('status').find((el) => el.tagName === 'P')!
const table = () => screen.getByRole('table')

/** Descriptions in the table, in order. */
const rows = () =>
  within(screen.getByRole('table'))
    .getAllByRole('row')
    .slice(1)
    .map((r) => within(r).getAllByRole('cell')[1].textContent)

describe('ExpensesPage', () => {
  it('lists all records newest first, with type badges and signed amounts', async () => {
    await setup()
    expect(rows()).toEqual(['משכורת', 'החזר סופר', 'Super Pharm קניות', 'סופרמרקט', 'דלק שנה קודמת'])
    const table = screen.getByRole('table')
    expect(within(table).getByText('+₪ 9,000.00')).toBeInTheDocument()
    expect(within(table).getByText('₪ 249.90')).toBeInTheDocument()
    expect(within(table).getByText('זיכוי')).toBeInTheDocument()
    expect(summary()).toHaveTextContent('5 רישומים')
  })

  it('searches the description (case and spaces do not matter)', async () => {
    const user = await setup()
    await user.type(screen.getByRole('searchbox', { name: 'חיפוש' }), '  super   PHARM ')
    expect(rows()).toEqual(['Super Pharm קניות'])
    expect(summary()).toHaveTextContent('מוצגים 1 מתוך 5 רישומים')
  })

  it('combines search, date, type and category with AND, shown as removable chips', async () => {
    const user = await setup()
    await user.click(screen.getByRole('button', { name: /סינון/ }))
    await user.selectOptions(screen.getByLabelText('שנה'), '2026')
    await user.selectOptions(screen.getByLabelText('סוג'), 'expense')
    expect(rows()).toEqual(['Super Pharm קניות', 'סופרמרקט'])
    await user.selectOptions(screen.getByLabelText('קטגוריה'), 'מזון')
    expect(rows()).toEqual(['סופרמרקט'])
    await user.type(screen.getByRole('searchbox', { name: 'חיפוש' }), 'פארם')
    expect(screen.getByText(NO_MATCHES_MESSAGE)).toBeInTheDocument()

    await user.clear(screen.getByRole('searchbox', { name: 'חיפוש' }))
    const chips = screen.getByLabelText('סינונים פעילים')
    await user.click(within(chips).getByRole('button', { name: 'הסרת קטגוריה: מזון' }))
    expect(rows()).toEqual(['Super Pharm קניות', 'סופרמרקט'])
    await user.click(within(chips).getByRole('button', { name: /איפוס/ }))
    expect(rows()).toHaveLength(5)
    expect(screen.queryByLabelText('סינונים פעילים')).not.toBeInTheDocument()
  })

  it('month needs a year, and removing the year chip clears the month too', async () => {
    const user = await setup()
    await user.click(screen.getByRole('button', { name: /סינון/ }))
    expect(screen.getByLabelText('חודש')).toBeDisabled()
    await user.selectOptions(screen.getByLabelText('שנה'), '2026')
    await user.selectOptions(screen.getByLabelText('חודש'), '11')
    expect(rows()).toEqual(['משכורת', 'החזר סופר', 'Super Pharm קניות'])
    await user.click(screen.getByRole('button', { name: 'הסרת שנה: 2026' }))
    expect(rows()).toHaveLength(5)
    expect(screen.queryByRole('button', { name: /הסרת חודש/ })).not.toBeInTheDocument()
  })

  it('filters by max amount and reports an invalid one', async () => {
    const user = await setup()
    await user.click(screen.getByRole('button', { name: /סינון/ }))
    await user.type(screen.getByLabelText('סכום מקסימלי (₪)'), '100')
    expect(rows()).toEqual(['החזר סופר', 'Super Pharm קניות'])
    await user.type(screen.getByLabelText('סכום מקסימלי (₪)'), 'x')
    expect(screen.getByText('יש להזין סכום חיובי')).toBeInTheDocument()
    expect(rows()).toHaveLength(5)
  })

  it('sorts by amount from the column header', async () => {
    const user = await setup()
    await user.click(within(screen.getByRole('table')).getByRole('button', { name: /סכום/ }))
    expect(rows()[0]).toBe('משכורת')
    expect(rows().at(-1)).toBe('החזר סופר')
  })

  it('edits a record and reports a missing one', async () => {
    const user = await setup()
    api.updateExpense.mockResolvedValue({ ...data[3], amount: '200.00' })
    await user.click(within(table()).getByRole('button', { name: /^עדכון: סופרמרקט/ }))
    const dialog = screen.getByRole('dialog', { name: 'עדכון הוצאה' })
    await user.clear(within(dialog).getByLabelText('סכום (₪)'))
    await user.type(within(dialog).getByLabelText('סכום (₪)'), '200')
    await user.click(within(dialog).getByRole('button', { name: /שמירה/ }))
    expect(api.updateExpense).toHaveBeenCalledWith('4', expect.objectContaining({ amount: '200', kind: 'expense' }))
    expect(await screen.findByText('הרישום עודכן')).toBeInTheDocument()

    api.updateExpense.mockRejectedValue(new ApiRequestError('gone', 404))
    await user.click(within(table()).getByRole('button', { name: /^עדכון: משכורת/ }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: /שמירה/ }))
    expect(await screen.findByText(NOT_FOUND_MESSAGE)).toBeInTheDocument()
  })

  it('deletes after confirmation', async () => {
    const user = await setup()
    api.deleteExpense.mockResolvedValue(undefined)
    api.fetchExpenses.mockResolvedValue(data.filter((x) => x.id !== '2'))
    await user.click(within(table()).getByRole('button', { name: /^מחיקה: החזר סופר/ }))
    const dialog = screen.getByRole('dialog', { name: 'מחיקת זיכוי' })
    expect(within(dialog).getByText('למחוק את הזיכוי?')).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: /^מחיקה/ }))
    expect(api.deleteExpense).toHaveBeenCalledWith('2')
    expect(await screen.findByText('הרישום מ-05/11/2026 נמחק')).toBeInTheDocument()
    expect(rows()).not.toContain('החזר סופר')
  })

  it('has a distinct empty state', async () => {
    api.fetchExpenses.mockResolvedValueOnce([])
    renderWithData(<ExpensesPage />, '/expenses')
    expect(await screen.findByText(NO_RECORDS_MESSAGE)).toBeInTheDocument()
  })
})
