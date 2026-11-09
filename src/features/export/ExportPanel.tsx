import { useId, useMemo, useState } from 'react'
import { ChevronDown, Download, FileDown } from 'lucide-react'
import type { Expense } from '../../../shared/types'
import { formatDisplayDate, todayLocal } from '../../../shared/dates'
import fieldStyles from '../expenses/ExpenseForm.module.css'
import { FilterFields } from '../filters/FilterFields'
import { EMPTY_FILTERS, availableYears, filterExpenses, parseMaxAmount, type Filters } from '../filters/filterExpenses'
import { sortExpenses, DEFAULT_SORT } from '../expenses/sortExpenses'
import { buildCsv } from './csv'
import { buildPdfDefinition, describeScope, type ExportScope } from './pdf'
import { downloadCsv, downloadPdf } from './download'
import styles from './ExportPanel.module.css'

export const NO_EXPORT_MATCHES = 'אין הוצאות מתאימות לייצוא.'
export const PDF_FAILED = 'לא הצלחנו ליצור את קובץ ה-PDF. נסו שוב.'

const MAX_AMOUNT_ERRORS = {
  invalid: 'יש להזין סכום חיובי',
  tooManyDecimals: 'עד שתי ספרות אחרי הנקודה',
} as const

type Props = {
  expenses: readonly Expense[]
  /** Injected for tests; the real ones download a file. */
  saveCsv?: typeof downloadCsv
  savePdf?: typeof downloadPdf
}

/**
 * Export area of the reports page. Its filters are its own: they never change
 * the charts and are unrelated to the filters page.
 */
export function ExportPanel({ expenses, saveCsv = downloadCsv, savePdf = downloadPdf }: Props) {
  const id = useId()
  const [scope, setScope] = useState<ExportScope>('all')
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)
  const [maxAmountError, setMaxAmountError] = useState<string>()
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const years = useMemo(() => availableYears(expenses), [expenses])

  /** The expenses to export, or null (with a message) when there is nothing to export. */
  function selection(): Expense[] | null {
    setMessage(null)
    if (scope === 'filtered') {
      const max = parseMaxAmount(filters.maxAmount)
      if (!max.ok) {
        setMaxAmountError(MAX_AMOUNT_ERRORS[max.error])
        return null
      }
    }
    setMaxAmountError(undefined)
    const chosen = scope === 'all' ? [...expenses] : filterExpenses(expenses, filters)
    if (chosen.length === 0) {
      setMessage(NO_EXPORT_MATCHES)
      return null
    }
    return sortExpenses(chosen, DEFAULT_SORT)
  }

  const fileName = (ext: string) => `expenses-${todayLocal()}.${ext}`

  function handleCsv() {
    const chosen = selection()
    if (chosen) saveCsv(buildCsv(chosen), fileName('csv'))
  }

  async function handlePdf() {
    const chosen = selection()
    if (!chosen) return
    setBusy(true)
    try {
      const definition = buildPdfDefinition(chosen, describeScope(scope, filters), formatDisplayDate(todayLocal()))
      await savePdf(definition, fileName('pdf'))
    } catch {
      setMessage(PDF_FAILED)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className={styles.panel} aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`} className={styles.title}>
        <FileDown size={22} aria-hidden="true" />
        ייצוא הוצאות
      </h2>

      <div className={styles.scope}>
        <label htmlFor={`${id}-scope`}>היקף ייצוא:</label>
        <span className={fieldStyles.control}>
          <select
            id={`${id}-scope`}
            className={`${fieldStyles.input} ${fieldStyles.select} ${styles.scopeSelect}`}
            value={scope}
            onChange={(e) => {
              setScope(e.target.value as ExportScope)
              setMessage(null)
            }}
          >
            <option value="all">כל ההוצאות</option>
            <option value="filtered">הוצאות מסוננות</option>
          </select>
          <ChevronDown className={fieldStyles.iconEnd} size={16} aria-hidden="true" />
        </span>
      </div>

      {scope === 'filtered' && (
        <FilterFields
          years={years}
          value={filters}
          onChange={(v) => {
            setFilters(v)
            setMessage(null)
            if (maxAmountError && v.maxAmount !== filters.maxAmount) setMaxAmountError(undefined)
          }}
          maxAmountError={maxAmountError}
        />
      )}

      {message && (
        <p className={styles.message} role="alert">
          {message}
        </p>
      )}

      <div className={fieldStyles.actions}>
        <button type="button" className={fieldStyles.primary} onClick={handleCsv} disabled={busy}>
          <Download size={18} aria-hidden="true" />
          הורדת CSV
        </button>
        <button type="button" className={`${fieldStyles.secondary} ${styles.pdfButton}`} onClick={handlePdf} disabled={busy}>
          <Download size={18} aria-hidden="true" />
          {busy ? 'מכין קובץ…' : 'הורדת PDF'}
        </button>
      </div>
    </section>
  )
}
