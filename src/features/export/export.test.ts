import { describe, expect, it } from 'vitest'
import Papa from 'papaparse'
import type { Expense } from '../../../shared/types'
import { BOM, buildCsv, neutralizeFormula } from './csv'
import { toPdfRuns, visualText, wrapLines } from './rtl'
import { buildPdfDefinition, describeScope } from './pdf'
import { EMPTY_FILTERS } from '../filters/filterExpenses'

const e = (category: string, description: string | null, amount: string, expenseDate: string): Expense =>
  ({ id: Math.random().toString(), category, description, amount, expenseDate }) as Expense

const list = [
  e('מזון', 'סופרמרקט, "שופרסל"', '1249.9', '2026-11-08'),
  e('אחר', '=SUM(1+1)', '10', '2026-11-02'),
  e('דלק', null, '180.00', '2025-01-05'),
]

describe('buildCsv', () => {
  const csv = buildCsv(list)
  const parsed = Papa.parse<string[]>(csv.slice(1), { skipEmptyLines: true }).data

  it('starts with a UTF-8 BOM and Hebrew headers', () => {
    expect(csv.startsWith(BOM)).toBe(true)
    expect(parsed[0]).toEqual(['תאריך', 'סוג', 'קטגוריה', 'תיאור', 'סכום (₪)'])
  })

  it('writes one row per expense with formatted values', () => {
    expect(parsed).toHaveLength(4)
    expect(parsed[1]).toEqual(['08/11/2026', 'הוצאה', 'מזון', 'סופרמרקט, "שופרסל"', '1249.90'])
    expect(parsed[3]).toEqual(['05/01/2025', 'הוצאה', 'דלק', '', '180.00'])
  })

  it('neutralizes text that a spreadsheet would run as a formula', () => {
    expect(parsed[2][3]).toBe("'=SUM(1+1)")
    for (const bad of ['=1+1', '+1', '-1', '@cmd', '\t=x', '\r=x']) {
      expect(neutralizeFormula(bad).startsWith("'")).toBe(true)
    }
    expect(neutralizeFormula('סופר')).toBe('סופר')
  })

  it('uses Windows line endings for Excel', () => {
    expect(csv).toContain('\r\n')
  })
})

describe('toVisualRtl', () => {
  it('reverses Hebrew words for drawing left to right', () => {
    expect(visualText('דו"ח הוצאות')).toBe('תואצוה ח"וד')
  })

  it('keeps numbers, dates and amounts left to right', () => {
    expect(visualText('הוצאות 2026')).toBe('2026 תואצוה')
    expect(visualText('תאריך 08/11/2026')).toBe('08/11/2026 ךיראת')
    expect(visualText('עד ₪ 100.00')).toBe('₪ 100.00 דע')
  })

  it('keeps English words left to right inside Hebrew', () => {
    expect(visualText('קנייה ב-ABC Store')).toBe('ABC Store-ב היינק')
  })

  it('mirrors brackets in Hebrew', () => {
    expect(visualText('סופרמרקט (בדיקה)')).toBe('(הקידב) טקרמרפוס')
  })

  it('gives pdfmake runs in visual order, Hebrew kept in letter order with non-breaking spaces', () => {
    expect(toPdfRuns('מזון 12')).toEqual([
      { text: '12', rtl: false },
      { text: 'מזון ', rtl: true },
    ])
    expect(toPdfRuns('דו"ח הוצאות')).toEqual([{ text: 'דו"ח הוצאות', rtl: true }])
    // Brackets inside Hebrew are mirrored, because the font engine reverses the letters
    expect(toPdfRuns('סופרמרקט (בדיקה)')).toEqual([{ text: 'סופרמרקט )בדיקה(', rtl: true }])
    expect(toPdfRuns('')).toEqual([])
  })

  it('wraps long text into lines at spaces', () => {
    expect(wrapLines('אחת שתיים שלוש ארבע', 9)).toEqual(['אחת שתיים', 'שלוש ארבע'])
    expect(wrapLines('   ', 10)).toEqual([])
    expect(wrapLines('מילה-ארוכה-מאוד', 5)).toEqual(['מילה-ארוכה-מאוד'])
  })

  it('leaves pure English and numbers as they are', () => {
    expect(visualText('ABC 123')).toBe('ABC 123')
    expect(visualText('249.90')).toBe('249.90')
  })
})

describe('buildPdfDefinition', () => {
  it('describes the export scope', () => {
    expect(describeScope('all', EMPTY_FILTERS)).toBe('כל הרישומים')
    expect(describeScope('filtered', { year: '2026', month: '11', day: '', maxAmount: '100' })).toBe(
      'רישומים מסוננים: שנה 2026, נובמבר, עד ₪ 100.00',
    )
    expect(describeScope('filtered', EMPTY_FILTERS)).toBe('רישומים מסוננים: ללא תנאים')
  })

  it('builds a right-to-left table with one row per expense', () => {
    const def = buildPdfDefinition(list, 'כל הרישומים', '09/11/2026')
    const table = (def.content as { table?: { body: unknown[][]; widths: unknown[] } }[]).find((c) => c.table)!.table!
    expect(table.body).toHaveLength(list.length + 1)
    // Joins a cell's runs as pdfmake receives them
    const cellText = (cell: unknown): string => {
      const t = (cell as { text: unknown }).text
      return Array.isArray(t) ? t.map((s: { text: string }) => s.text).join('') : String(t)
    }
    const runsText = (s: string) => toPdfRuns(s).map((r) => r.text).join('')
    // Columns from left to right: amount, description, category, type, date (date is on the right)
    const header = table.body[0].map(cellText)
    expect(header).toEqual([runsText('סכום (₪)'), runsText('תיאור'), runsText('קטגוריה'), runsText('סוג'), runsText('תאריך')])
    expect(table.body[1].map(cellText)).toEqual(['1,249.90', runsText('סופרמרקט, "שופרסל"'), 'מזון', runsText('הוצאה'), '08/11/2026'])
  })
})

describe('record types in exports', () => {
  const records: Expense[] = [
    { id: 'a', kind: 'expense', category: 'מזון', description: null, amount: '100.00', expenseDate: '2026-11-03' },
    { id: 'b', kind: 'refund', category: 'מזון', description: 'החזר', amount: '20.00', expenseDate: '2026-11-04' },
    { id: 'c', kind: 'income', category: null, description: 'משכורת', amount: '5000.00', expenseDate: '2026-11-05' },
  ]

  it('CSV shows the type, and "—" for the category of income', () => {
    const rows = Papa.parse<string[]>(buildCsv(records).slice(1), { skipEmptyLines: true }).data
    expect(rows.slice(1).map((r) => [r[1], r[2]])).toEqual([
      ['הוצאה', 'מזון'],
      ['זיכוי', 'מזון'],
      ['הכנסה', '—'],
    ])
  })

  it('PDF lists net expenses and income, and marks money that came in with "+"', () => {
    const def = buildPdfDefinition(records, 'כל הרישומים', '10/11/2026')
    const json = JSON.stringify(def.content)
    const runs = (s: string) => toPdfRuns(s).map((r) => r.text).join('')
    const flat = json.replace(/"\},\{"text":"/g, '')
    expect(flat).toContain(runs('הוצאות נטו: ₪ 80.00 · הכנסות: ₪ 5,000.00'))
    const table = (def.content as { table?: { body: { text: unknown }[][] } }[]).find((c) => c.table)!.table!
    expect(table.body[3][0].text).toBe('+5,000.00')
  })
})
