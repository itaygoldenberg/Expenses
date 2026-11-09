// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Papa from 'papaparse'
import type { Expense } from '../../../shared/types'

// The real download module imports font files; not needed here
vi.mock('./download', () => ({ downloadCsv: vi.fn(), downloadPdf: vi.fn() }))

const { ExportPanel, NO_EXPORT_MATCHES, PDF_FAILED } = await import('./ExportPanel')

const e = (description: string, amount: string, expenseDate: string): Expense =>
  ({ id: description, kind: 'expense', category: 'מזון', description, amount, expenseDate }) as Expense

const data = [
  e('נובמבר', '100.00', '2026-11-01'),
  e('אוקטובר', '249.90', '2026-10-31'),
  e('שנה-קודמת', '320.00', '2025-12-31'),
]

afterEach(cleanup)

function setup() {
  const saveCsv = vi.fn()
  const savePdf = vi.fn().mockResolvedValue(undefined)
  render(<ExportPanel expenses={data} saveCsv={saveCsv} savePdf={savePdf} />)
  const csvDescriptions = () =>
    Papa.parse<string[]>((saveCsv.mock.calls.at(-1)![0] as string).slice(1), { skipEmptyLines: true })
      .data.slice(1)
      .map((r) => r[3])
  return { saveCsv, savePdf, csvDescriptions, user: userEvent.setup() }
}

describe('ExportPanel', () => {
  it('exports all records to CSV, newest first, with a dated file name', async () => {
    const { saveCsv, csvDescriptions, user } = setup()
    await user.click(screen.getByRole('button', { name: /הורדת CSV/ }))
    expect(csvDescriptions()).toEqual(['נובמבר', 'אוקטובר', 'שנה-קודמת'])
    expect(saveCsv.mock.calls[0][1]).toMatch(/^expenses-\d{4}-\d{2}-\d{2}\.csv$/)
  })

  it('shows the filters only for a filtered export, and exports only matches', async () => {
    const { csvDescriptions, user } = setup()
    expect(screen.queryByLabelText('שנה')).not.toBeInTheDocument()
    await user.click(screen.getByRole('radio', { name: 'רישומים מסוננים' }))
    await user.selectOptions(screen.getByLabelText('שנה'), '2026')
    await user.type(screen.getByLabelText('סכום מקסימלי (₪)'), '100')
    await user.click(screen.getByRole('button', { name: /הורדת CSV/ }))
    expect(csvDescriptions()).toEqual(['נובמבר'])
  })

  it('shows a message and downloads nothing when nothing matches', async () => {
    const { saveCsv, savePdf, user } = setup()
    await user.click(screen.getByRole('radio', { name: 'רישומים מסוננים' }))
    await user.type(screen.getByLabelText('סכום מקסימלי (₪)'), '1')
    await user.click(screen.getByRole('button', { name: /הורדת CSV/ }))
    await user.click(screen.getByRole('button', { name: /הורדת PDF/ }))
    expect(screen.getByText(NO_EXPORT_MATCHES)).toBeInTheDocument()
    expect(saveCsv).not.toHaveBeenCalled()
    expect(savePdf).not.toHaveBeenCalled()
  })

  it('rejects an invalid max amount', async () => {
    const { saveCsv, user } = setup()
    await user.click(screen.getByRole('radio', { name: 'רישומים מסוננים' }))
    await user.type(screen.getByLabelText('סכום מקסימלי (₪)'), 'abc')
    await user.click(screen.getByRole('button', { name: /הורדת CSV/ }))
    expect(screen.getByText('יש להזין סכום חיובי')).toBeInTheDocument()
    expect(saveCsv).not.toHaveBeenCalled()
  })

  it('builds a PDF of the selection', async () => {
    const { savePdf, user } = setup()
    await user.click(screen.getByRole('button', { name: /הורדת PDF/ }))
    expect(savePdf).toHaveBeenCalledTimes(1)
    const [definition, fileName] = savePdf.mock.calls[0]
    expect(fileName).toMatch(/\.pdf$/)
    const table = definition.content.find((c: { table?: unknown }) => c.table).table
    expect(table.body).toHaveLength(4)
  })

  it('reports a PDF failure without pretending it worked', async () => {
    const { savePdf, user } = setup()
    savePdf.mockRejectedValueOnce(new Error('font failed'))
    await user.click(screen.getByRole('button', { name: /הורדת PDF/ }))
    expect(await screen.findByText(PDF_FAILED)).toBeInTheDocument()
  })
})
