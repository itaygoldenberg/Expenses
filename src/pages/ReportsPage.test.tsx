// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Category } from '../../shared/categories'
import type { Kind } from '../../shared/kinds'
import type { Expense } from '../../shared/types'
import { renderWithData } from '../test/renderWithData'

const api = vi.hoisted(() => ({ fetchExpenses: vi.fn() }))
vi.mock('../api/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api/client')>()),
  fetchExpenses: api.fetchExpenses,
}))

// The real download module imports font files; not needed here
vi.mock('../features/export/download', () => ({ downloadCsv: vi.fn(), downloadPdf: vi.fn() }))

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
  return { Doughnut: Stub('pie'), Bar: Stub('bar'), Chart: Stub('chart') }
})

const { ReportsPage, NO_DATA_MESSAGE } = await import('./ReportsPage')

let n = 0
const e = (category: Category | null, amount: string, expenseDate: string, kind: Kind = 'expense'): Expense => ({
  id: String(++n),
  kind,
  category,
  description: null,
  amount,
  expenseDate,
})

const data = [
  e('מזון', '0.10', '2026-11-01'),
  e('מזון', '0.20', '2026-11-09'),
  e('דלק', '180.00', '2026-10-06'),
  e('דיור', '320.00', '2025-12-31'),
]

beforeEach(() => api.fetchExpenses.mockResolvedValue(data))
afterEach(cleanup)

const renderPage = () => renderWithData(<ReportsPage />, '/reports')
const items = (testId: string) => within(screen.getByTestId(testId)).getAllByRole('listitem').map((li) => li.textContent)

describe('ReportsPage', () => {
  it('shows only categories with expenses, with exact amounts (all time by default)', async () => {
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
    await user.click(screen.getByRole('radio', { name: 'כמות' }))
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
    await user.click(screen.getByRole('radio', { name: 'לפי שנים' }))
    expect(items('bar')).toEqual(['2025=320', '2026=180.3'])
    expect(screen.queryByLabelText('שנה')).not.toBeInTheDocument()
  })

  it('counts refunds against their category and leaves income out', async () => {
    api.fetchExpenses.mockResolvedValueOnce([
      e('מזון', '100.00', '2026-11-01'),
      e('מזון', '30.00', '2026-11-02', 'refund'),
      e(null, '5000.00', '2026-11-03', 'income'),
    ])
    renderPage()
    await screen.findByTestId('pie')
    expect(items('pie')).toEqual(['מזון=70'])
    const summary = screen.getByRole('region', { name: 'סיכום התקופה' })
    expect(within(summary).getByText('₪ 70.00')).toBeInTheDocument()
    expect(within(summary).getByText('₪ 5,000.00')).toBeInTheDocument()
  })

  it('limits to a custom range and compares with the period before it', async () => {
    const user = userEvent.setup()
    api.fetchExpenses.mockResolvedValueOnce([
      e('מזון', '150.00', '2026-10-15'),
      e('דלק', '50.00', '2026-10-20'),
      e('מזון', '100.00', '2026-09-20'), // previous period (same length, right before)
      e('דיור', '999.00', '2026-08-01'), // outside both
    ])
    renderPage()
    await screen.findByTestId('pie')
    await user.click(screen.getByRole('radio', { name: 'טווח' }))
    await user.type(screen.getByLabelText('מתאריך'), '2026-10-01')
    await user.type(screen.getByLabelText('עד תאריך'), '2026-10-31')
    expect(items('pie')).toEqual(['מזון=150', 'דלק=50'])

    await user.click(screen.getByRole('switch', { name: 'השוואה לתקופה הקודמת' }))
    const summary = screen.getByRole('region', { name: 'סיכום התקופה' })
    expect(within(summary).getByText('₪ 200.00')).toBeInTheDocument()
    expect(within(summary).getByText('₪ 100.00')).toBeInTheDocument()
    // Net expenses 200 vs 100, and 2 expense records vs 1
    expect(within(summary).getAllByText('+100%')).toHaveLength(2)
    const legend = screen.getByRole('list', { name: 'מקרא' })
    expect(within(legend).getAllByText(/בתקופה הקודמת/)).toHaveLength(2)
  })

  it('comparison is off for "הכול"', async () => {
    renderPage()
    await screen.findByTestId('pie')
    expect(screen.getByRole('switch', { name: 'השוואה לתקופה הקודמת' })).toBeDisabled()
  })

  it('shows a message instead of empty charts when there are no records', async () => {
    api.fetchExpenses.mockResolvedValueOnce([])
    renderPage()
    expect(await screen.findByText(NO_DATA_MESSAGE)).toBeInTheDocument()
    expect(screen.queryByTestId('pie')).not.toBeInTheDocument()
    expect(screen.queryByTestId('bar')).not.toBeInTheDocument()
  })

  it('shows a load error distinctly', async () => {
    api.fetchExpenses.mockRejectedValueOnce(new Error('offline'))
    renderPage()
    expect(await screen.findByText('לא הצלחנו לטעון את הרישומים.')).toBeInTheDocument()
    expect(screen.queryByText(NO_DATA_MESSAGE)).not.toBeInTheDocument()
  })
})
