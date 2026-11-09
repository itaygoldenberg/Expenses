import type { Content, TableCell, TDocumentDefinitions } from 'pdfmake/interfaces'
import { formatDisplayDate } from '../../../shared/dates'
import { formatAgorotWithSeparators, parseShekelsToAgorot } from '../../../shared/money'
import type { Expense } from '../../../shared/types'
import { HEBREW_MONTHS, parseMaxAmount, type Filters } from '../filters/filterExpenses'
import { toPdfRuns, wrapLines } from './rtl'

/** One full Heebo font (Hebrew + Latin + digits), TTF — see ADR-5. */
export const PDF_FONT = 'Heebo'

/** About how many characters fit on one line of the description column. */
const DESCRIPTION_LINE_CHARS = 42

export type ExportScope = 'all' | 'filtered'

const COLORS = {
  headerFill: '#0F1E34', // Panel Blue
  headerText: '#FFFFFF',
  zebra: '#EEF4FB',
  line: '#C9D6E6',
  text: '#0A1020', // Deep Navy
  muted: '#4A5A70',
  accent: '#E91E8A', // Magenta
}

/**
 * Right-aligned Hebrew text for pdfmake, as direction runs in visual order.
 * Long text is wrapped into lines first (a Hebrew run cannot be wrapped by pdfmake).
 */
function rtlText(text: string, extra: Record<string, unknown> = {}, maxChars = Infinity): Content {
  const lines = Number.isFinite(maxChars) ? wrapLines(text, maxChars) : [text]
  const line = (l: string) => ({ text: toPdfRuns(l).map((r) => ({ text: r.text })), alignment: 'right' as const })
  if (lines.length <= 1) return { ...line(lines[0] ?? ''), ...extra } as Content
  return { stack: lines.map(line), ...extra } as Content
}

function amountText(amount: string): string {
  const parsed = parseShekelsToAgorot(amount)
  return parsed.ok ? formatAgorotWithSeparators(parsed.agorot) : amount
}

/** Human description of what is being exported, e.g. "הוצאות מסוננות: שנה 2026, נובמבר, עד ₪ 100.00". */
export function describeScope(scope: ExportScope, filters: Filters): string {
  if (scope === 'all') return 'כל ההוצאות'
  const parts: string[] = []
  if (filters.year) parts.push(`שנה ${filters.year}`)
  if (filters.year && filters.month) parts.push(HEBREW_MONTHS[Number(filters.month) - 1])
  if (filters.year && filters.month && filters.day) parts.push(`יום ${filters.day}`)
  const max = parseMaxAmount(filters.maxAmount)
  if (max.ok && max.agorot !== null && max.agorot < Number.MAX_SAFE_INTEGER) {
    parts.push(`עד ₪ ${formatAgorotWithSeparators(max.agorot)}`)
  }
  return `הוצאות מסוננות: ${parts.length ? parts.join(', ') : 'ללא תנאים'}`
}

/**
 * pdfmake document for the expenses table. Columns are laid out right to left
 * (date on the right), because pdfmake itself only draws left to right.
 */
export function buildPdfDefinition(expenses: readonly Expense[], scopeText: string, generatedOn: string): TDocumentDefinitions {
  const header: TableCell[] = ['סכום (₪)', 'תיאור', 'קטגוריה', 'תאריך'].map((h) =>
    rtlText(h, { bold: true, color: COLORS.headerText, fillColor: COLORS.headerFill, margin: [4, 6, 4, 6] }),
  )

  const rows: TableCell[][] = expenses.map((e) => [
    { text: amountText(e.amount), alignment: 'left', margin: [4, 4, 4, 4] },
    rtlText(e.description ?? '', { margin: [4, 4, 4, 4] }, DESCRIPTION_LINE_CHARS),
    rtlText(e.category, { margin: [4, 4, 4, 4] }),
    { text: formatDisplayDate(e.expenseDate), alignment: 'right', margin: [4, 4, 4, 4] },
  ])

  const content: Content[] = [
    rtlText('דו"ח הוצאות', { fontSize: 22, bold: true, color: COLORS.text, margin: [0, 0, 0, 4] }),
    rtlText(scopeText, { fontSize: 12, color: COLORS.muted, margin: [0, 0, 0, 2] }),
    rtlText(`הופק בתאריך ${generatedOn}`, { fontSize: 10, color: COLORS.muted, margin: [0, 0, 0, 16] }),
    {
      table: {
        headerRows: 1,
        widths: [80, '*', 90, 80],
        body: [header, ...rows],
      },
      layout: {
        fillColor: (rowIndex: number) => (rowIndex > 0 && rowIndex % 2 === 0 ? COLORS.zebra : null),
        hLineColor: () => COLORS.line,
        vLineColor: () => COLORS.line,
        hLineWidth: () => 0.5,
        vLineWidth: () => 0.5,
      },
    },
  ]

  return {
    pageSize: 'A4',
    pageMargins: [40, 48, 40, 48],
    defaultStyle: { font: PDF_FONT, fontSize: 11, color: COLORS.text },
    info: { title: 'Expenses report' },
    content,
    footer: (currentPage: number, pageCount: number) => ({
      text: `${currentPage} / ${pageCount}`,
      alignment: 'center',
      fontSize: 9,
      color: COLORS.muted,
      margin: [0, 16, 0, 0],
    }),
  }
}
