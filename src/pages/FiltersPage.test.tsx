// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import type { Expense } from '../../shared/types'

const api = vi.hoisted(() => ({ fetchExpenses: vi.fn() }))
vi.mock('../api/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api/client')>()),
  fetchExpenses: api.fetchExpenses,
}))

const { FiltersPage, NO_MATCHES_MESSAGE } = await import('./FiltersPage')

const e = (id: string, description: string, amount: string, expenseDate: string): Expense =>
  ({ id, category: 'מזון', description, amount, expenseDate }) as Expense

const data = [
  e('1', 'נובמבר-א', '100.00', '2026-11-01'),
  e('2', 'אוקטובר', '249.90', '2026-10-31'),
  e('3', 'נובמבר-ב', '9.90', '2026-11-09'),
  e('4', 'שנה-קודמת', '320.00', '2025-12-31'),
]

beforeEach(() => api.fetchExpenses.mockResolvedValue(data))
afterEach(cleanup)

async function setup() {
  render(
    <MemoryRouter>
      <FiltersPage />
    </MemoryRouter>,
  )
  const user = userEvent.setup()
  const table = await screen.findByRole('table')
  const shown = () =>
    within(table)
      .queryAllByRole('row')
      .slice(1)
      .map((r) => within(r).getAllByRole('cell')[1].textContent)
  return { user, shown }
}

describe('FiltersPage', () => {
  it('shows all expenses at first, newest first', async () => {
    const { shown } = await setup()
    expect(shown()).toEqual(['נובמבר-ב', 'נובמבר-א', 'אוקטובר', 'שנה-קודמת'])
  })

  it('enables month only after year, and day only after month', async () => {
    const { user } = await setup()
    expect(screen.getByLabelText('חודש')).toBeDisabled()
    expect(screen.getByLabelText('יום')).toBeDisabled()
    await user.selectOptions(screen.getByLabelText('שנה'), '2026')
    expect(screen.getByLabelText('חודש')).toBeEnabled()
    expect(screen.getByLabelText('יום')).toBeDisabled()
    await user.selectOptions(screen.getByLabelText('חודש'), '11')
    expect(screen.getByLabelText('יום')).toBeEnabled()
    // November has 30 days (+ "כל הימים")
    expect(within(screen.getByLabelText('יום')).getAllByRole('option')).toHaveLength(31)
  })

  it('filters only when "הצג תוצאות" is pressed', async () => {
    const { user, shown } = await setup()
    await user.selectOptions(screen.getByLabelText('שנה'), '2026')
    await user.selectOptions(screen.getByLabelText('חודש'), '11')
    expect(shown()).toHaveLength(4)
    await user.click(screen.getByRole('button', { name: /הצג תוצאות/ }))
    expect(shown()).toEqual(['נובמבר-ב', 'נובמבר-א'])
  })

  it('combines date and max amount, including an amount equal to the limit', async () => {
    const { user, shown } = await setup()
    await user.selectOptions(screen.getByLabelText('שנה'), '2026')
    await user.type(screen.getByLabelText('סכום מקסימלי (₪)'), '100')
    await user.click(screen.getByRole('button', { name: /הצג תוצאות/ }))
    expect(shown()).toEqual(['נובמבר-ב', 'נובמבר-א'])
  })

  it('rejects an invalid max amount without filtering', async () => {
    const { user, shown } = await setup()
    await user.type(screen.getByLabelText('סכום מקסימלי (₪)'), 'abc')
    await user.click(screen.getByRole('button', { name: /הצג תוצאות/ }))
    expect(screen.getByText('יש להזין סכום חיובי')).toBeInTheDocument()
    expect(shown()).toHaveLength(4)
  })

  it('shows a clear message when nothing matches, and reset brings everything back', async () => {
    const { user } = await setup()
    await user.type(screen.getByLabelText('סכום מקסימלי (₪)'), '1')
    await user.click(screen.getByRole('button', { name: /הצג תוצאות/ }))
    expect(screen.getByText(NO_MATCHES_MESSAGE)).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    await user.click(screen.getAllByRole('button', { name: /איפוס סינון/ })[0])
    expect(await screen.findByRole('table')).toBeInTheDocument()
    expect((screen.getByLabelText('סכום מקסימלי (₪)') as HTMLInputElement).value).toBe('')
    expect((screen.getByLabelText('שנה') as HTMLSelectElement).value).toBe('')
  })

  it('clearing the year clears month and day', async () => {
    const { user } = await setup()
    await user.selectOptions(screen.getByLabelText('שנה'), '2026')
    await user.selectOptions(screen.getByLabelText('חודש'), '10')
    await user.selectOptions(screen.getByLabelText('יום'), '31')
    await user.selectOptions(screen.getByLabelText('חודש'), '11') // 31 does not exist in November
    expect((screen.getByLabelText('יום') as HTMLSelectElement).value).toBe('')
    await user.selectOptions(screen.getByLabelText('שנה'), '')
    expect((screen.getByLabelText('חודש') as HTMLSelectElement).value).toBe('')
  })

  it('sorts the results independently', async () => {
    const { user, shown } = await setup()
    await user.click(within(screen.getByRole('table')).getByRole('button', { name: /סכום/ }))
    expect(shown()).toEqual(['שנה-קודמת', 'אוקטובר', 'נובמבר-א', 'נובמבר-ב'])
  })

  it('distinguishes a load failure from no results', async () => {
    api.fetchExpenses.mockRejectedValueOnce(new Error('offline'))
    render(
      <MemoryRouter>
        <FiltersPage />
      </MemoryRouter>,
    )
    expect(await screen.findByText('לא הצלחנו לטעון את ההוצאות')).toBeInTheDocument()
    expect(screen.queryByText(NO_MATCHES_MESSAGE)).not.toBeInTheDocument()
  })
})
