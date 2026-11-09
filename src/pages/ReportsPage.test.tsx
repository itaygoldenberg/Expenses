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

// jsdom has no canvas: replace charts with a stand-in that shows the data they receive
vi.mock('react-chartjs-2', () => {
  const Stub =
    (kind: string) =>
    ({ data }: { data: { labels: string[]; datasets: { data: number[] }[] } }) => (
      <ul data-testid={kind}>
        {data.labels.map((l, i) => (
          <li key={l}>{`${l}=${data.datasets[0].data[i]}`}</li>
        ))}
      </ul>
    )
  return { Pie: Stub('pie'), Bar: Stub('bar') }
})

const { ReportsPage, NO_DATA_MESSAGE } = await import('./ReportsPage')

const e = (category: string, amount: string, expenseDate: string): Expense =>
  ({ id: Math.random().toString(), category, description: null, amount, expenseDate }) as Expense

const data = [
  e('מזון', '0.10', '2026-11-01'),
  e('מזון', '0.20', '2026-11-09'),
  e('דלק', '180.00', '2026-10-06'),
  e('דיור', '320.00', '2025-12-31'),
]

beforeEach(() => api.fetchExpenses.mockResolvedValue(data))
afterEach(cleanup)

const renderPage = () =>
  render(
    <MemoryRouter>
      <ReportsPage />
    </MemoryRouter>,
  )
const items = (testId: string) => within(screen.getByTestId(testId)).getAllByRole('listitem').map((li) => li.textContent)

describe('ReportsPage', () => {
  it('shows only categories with expenses, with exact amounts', async () => {
    renderPage()
    await screen.findByTestId('pie')
    expect(items('pie')).toEqual(['דיור=320', 'דלק=180', 'מזון=0.3'])
    const legend = screen.getByRole('list', { name: 'מקרא' })
    expect(within(legend).getByText('₪ 0.30')).toBeInTheDocument()
    expect(within(legend).getByText('₪ 320.00')).toBeInTheDocument()
  })

  it('switches both charts to count', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByTestId('pie')
    await user.selectOptions(screen.getByLabelText('מדד:'), 'count')
    expect(items('pie')).toEqual(['מזון=2', 'דלק=1', 'דיור=1'])
    // Bars: months of the newest year (2026)
    expect(items('bar')).toContain('נוב=2')
    expect(items('bar')).toContain('אוק=1')
  })

  it('shows months of the chosen year, or years', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByTestId('bar')
    expect(items('bar')).toHaveLength(12)
    expect(items('bar')).toContain('נוב=0.3')
    await user.selectOptions(screen.getByLabelText('שנה'), '2025')
    expect(items('bar')).toContain('דצמ=320')
    expect(items('bar')).toContain('נוב=0')
    await user.selectOptions(screen.getByLabelText('קיבוץ'), 'year')
    expect(items('bar')).toEqual(['2025=320', '2026=180.3'])
    expect(screen.queryByLabelText('שנה')).not.toBeInTheDocument()
  })

  it('shows a message instead of empty charts when there are no expenses', async () => {
    api.fetchExpenses.mockResolvedValueOnce([])
    renderPage()
    expect(await screen.findByText(new RegExp(NO_DATA_MESSAGE))).toBeInTheDocument()
    expect(screen.queryByTestId('pie')).not.toBeInTheDocument()
    expect(screen.queryByTestId('bar')).not.toBeInTheDocument()
  })

  it('shows a load error distinctly', async () => {
    api.fetchExpenses.mockRejectedValueOnce(new Error('offline'))
    renderPage()
    expect(await screen.findByText('לא הצלחנו לטעון את ההוצאות')).toBeInTheDocument()
    expect(screen.queryByText(new RegExp(NO_DATA_MESSAGE))).not.toBeInTheDocument()
  })
})
