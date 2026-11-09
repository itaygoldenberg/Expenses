import { useId } from 'react'
import { ChevronDown } from 'lucide-react'
import fieldStyles from '../expenses/ExpenseForm.module.css'
import { HEBREW_MONTHS, daysInMonth, normalizeFilters, type Filters } from './filterExpenses'
import styles from './FilterForm.module.css'

type Props = {
  years: string[]
  value: Filters
  onChange: (value: Filters) => void
  maxAmountError?: string
}

/**
 * The four filter fields (year, month, day, max amount), shared by the filters page
 * and the export panel. Month needs a year, day needs a month, and every change goes
 * through normalizeFilters so a dependent choice is never left invalid.
 */
export function FilterFields({ years, value, onChange, maxAmountError }: Props) {
  const id = useId()
  const fid = (name: string) => `${id}-${name}`
  const days = value.year && value.month ? daysInMonth(Number(value.year), Number(value.month)) : 0
  const set = (field: keyof Filters, v: string) => onChange(normalizeFilters({ ...value, [field]: v }))
  const selectClass = `${fieldStyles.input} ${fieldStyles.select}`

  return (
    <div className={styles.grid}>
      <div className={fieldStyles.field}>
        <label htmlFor={fid('year')}>שנה</label>
        <div className={fieldStyles.control}>
          <select id={fid('year')} className={selectClass} value={value.year} onChange={(e) => set('year', e.target.value)}>
            <option value="">כל השנים</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <ChevronDown className={fieldStyles.iconEnd} size={18} aria-hidden="true" />
        </div>
      </div>

      <div className={fieldStyles.field}>
        <label htmlFor={fid('month')}>חודש</label>
        <div className={fieldStyles.control}>
          <select
            id={fid('month')}
            className={selectClass}
            value={value.month}
            disabled={!value.year}
            onChange={(e) => set('month', e.target.value)}
          >
            <option value="">כל החודשים</option>
            {HEBREW_MONTHS.map((name, i) => (
              <option key={name} value={String(i + 1)}>
                {name}
              </option>
            ))}
          </select>
          <ChevronDown className={fieldStyles.iconEnd} size={18} aria-hidden="true" />
        </div>
      </div>

      <div className={fieldStyles.field}>
        <label htmlFor={fid('day')}>יום</label>
        <div className={fieldStyles.control}>
          <select
            id={fid('day')}
            className={selectClass}
            value={value.day}
            disabled={!value.month}
            onChange={(e) => set('day', e.target.value)}
          >
            <option value="">כל הימים</option>
            {Array.from({ length: days }, (_, i) => String(i + 1)).map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <ChevronDown className={fieldStyles.iconEnd} size={18} aria-hidden="true" />
        </div>
      </div>

      <div className={fieldStyles.field}>
        <label htmlFor={fid('max')}>סכום מקסימלי (₪)</label>
        <div className={fieldStyles.control}>
          <input
            id={fid('max')}
            type="text"
            inputMode="decimal"
            dir="ltr"
            placeholder="עד סכום"
            value={value.maxAmount}
            onChange={(e) => set('maxAmount', e.target.value)}
            aria-invalid={!!maxAmountError}
            aria-describedby={maxAmountError ? `${fid('max')}-error` : undefined}
            className={`${fieldStyles.input} ${fieldStyles.numeric} ${fieldStyles.withIcon}`}
          />
          <span className={fieldStyles.iconStart} aria-hidden="true">
            ₪
          </span>
        </div>
        {maxAmountError && (
          <p id={`${fid('max')}-error`} className={fieldStyles.fieldError} role="alert">
            {maxAmountError}
          </p>
        )}
      </div>
    </div>
  )
}
