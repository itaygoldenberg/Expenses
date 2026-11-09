// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Navigate, Route, Routes } from 'react-router'
import type { Expense } from '../../shared/types'

const api = vi.hoisted(() => ({ fetchExpenses: vi.fn(), createExpense: vi.fn() }))
vi.mock('../api/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api/client')>()),
  fetchExpenses: api.fetchExpenses,
  createExpense: api.createExpense,
}))

const { AppShell } = await import('./AppShell')
const { useExpensesData } = await import('../features/expenses/ExpensesProvider')

beforeEach(() => {
  api.fetchExpenses.mockResolvedValue([])
  api.createExpense.mockReset()
})
afterEach(cleanup)

/** Stand-in page that shows how many records the shared provider holds. */
function Page({ name }: { name: string }) {
  const { state } = useExpensesData()
  return <p>{`${name} (${state.status === 'ready' ? state.expenses.length : '…'})`}</p>
}

function setup(path = '/') {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Page name="ראשי" />} />
          <Route path="expenses" element={<Page name="הוצאות" />} />
          <Route path="filters" element={<Navigate to="/expenses" replace />} />
          <Route path="reports" element={<Page name="דו״חות" />} />
          <Route path="about" element={<Page name="אודות" />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
  return userEvent.setup()
}

describe('AppShell', () => {
  it('shows ראשי · הוצאות · דו"חות in the sidebar and the phone tab bar', () => {
    setup()
    const sidebar = screen.getByRole('navigation', { name: 'ניווט ראשי' })
    expect(within(sidebar).getAllByRole('link').map((l) => l.textContent)).toEqual(['ראשי', 'הוצאות', 'דו"חות'])
    const tabBar = screen.getByRole('navigation', { name: 'ניווט ראשי (טלפון)' })
    expect(within(tabBar).getAllByRole('link').map((l) => l.textContent)).toEqual(['ראשי', 'הוצאות', 'דו"חות'])
    expect(within(tabBar).getByRole('button', { name: 'הוספת רישום' })).toBeInTheDocument()
    expect(within(tabBar).getByRole('button', { name: 'עוד' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'ניווט משני' })).toHaveTextContent('אודות')
  })

  it('marks the active page with aria-current', () => {
    setup('/reports')
    const sidebar = screen.getByRole('navigation', { name: 'ניווט ראשי' })
    expect(within(sidebar).getByRole('link', { name: 'דו"חות' })).toHaveAttribute('aria-current', 'page')
    expect(within(sidebar).getByRole('link', { name: 'ראשי' })).not.toHaveAttribute('aria-current')
  })

  it('/filters leads to the expenses page', async () => {
    setup('/filters')
    expect(await screen.findByText(/^הוצאות \(/)).toBeInTheDocument()
  })

  it('"עוד" opens a sheet with אודות and navigates from it', async () => {
    const user = setup()
    const more = screen.getByRole('button', { name: 'עוד' })
    expect(more).toHaveAttribute('aria-expanded', 'false')
    await user.click(more)
    const sheet = screen.getByRole('dialog', { name: 'עוד' })
    await user.click(within(sheet).getByRole('link', { name: 'אודות' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByText(/^אודות \(/)).toBeInTheDocument()
  })

  it('➕ opens the add sheet on any page; a saved record reaches every page', async () => {
    const saved: Expense = { id: 'n', kind: 'expense', category: 'מזון', description: null, amount: '12.00', expenseDate: '2026-11-01' }
    api.createExpense.mockResolvedValue(saved)
    const user = setup('/reports')
    await screen.findByText('דו״חות (0)')
    api.fetchExpenses.mockResolvedValue([saved])

    const tabBar = screen.getByRole('navigation', { name: 'ניווט ראשי (טלפון)' })
    await user.click(within(tabBar).getByRole('button', { name: 'הוספת רישום' }))
    const sheet = screen.getByRole('dialog', { name: 'רישום חדש' })
    await user.selectOptions(within(sheet).getByLabelText('קטגוריה'), 'מזון')
    await user.type(within(sheet).getByLabelText('סכום (₪)'), '12')
    await user.click(within(sheet).getByRole('button', { name: /הוספת הוצאה/ }))

    expect(api.createExpense).toHaveBeenCalledWith(expect.objectContaining({ kind: 'expense', amount: '12' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(await screen.findByText('ההוצאה נשמרה')).toBeInTheDocument()
    expect(await screen.findByText('דו״חות (1)')).toBeInTheDocument()
  })

  it('has a skip link to the main content', () => {
    setup()
    expect(screen.getByRole('link', { name: 'דלג לתוכן' })).toHaveAttribute('href', '#main')
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main')
  })
})
