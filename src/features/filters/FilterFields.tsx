import { SelectField, TextField } from '../../ui'
import { HEBREW_MONTHS, daysInMonth, normalizeFilters, type Filters } from './filterExpenses'
import styles from './FilterFields.module.css'

type Props<F extends Filters> = {
  years: string[]
  value: F
  onChange: (value: F) => void
  maxAmountError?: string
}

/**
 * The four date / amount filter fields (year, month, day, max amount), shared by the
 * expenses page and the export panel. Month needs a year, day needs a month, and every
 * change goes through normalizeFilters so a dependent choice is never left invalid.
 */
export function FilterFields<F extends Filters>({ years, value, onChange, maxAmountError }: Props<F>) {
  const days = value.year && value.month ? daysInMonth(Number(value.year), Number(value.month)) : 0
  const set = (field: keyof Filters, v: string) => onChange(normalizeFilters({ ...value, [field]: v }))

  return (
    <div className={styles.grid}>
      <SelectField
        label="שנה"
        placeholder="כל השנים"
        options={years.map((y) => ({ value: y, label: y }))}
        value={value.year}
        onChange={(e) => set('year', e.target.value)}
      />
      <SelectField
        label="חודש"
        placeholder="כל החודשים"
        options={HEBREW_MONTHS.map((name, i) => ({ value: String(i + 1), label: name }))}
        value={value.month}
        disabled={!value.year}
        onChange={(e) => set('month', e.target.value)}
      />
      <SelectField
        label="יום"
        placeholder="כל הימים"
        options={Array.from({ length: days }, (_, i) => ({ value: String(i + 1), label: String(i + 1) }))}
        value={value.day}
        disabled={!value.month}
        onChange={(e) => set('day', e.target.value)}
      />
      <TextField
        label="סכום מקסימלי (₪)"
        numeric
        startAdornment="₪"
        placeholder="עד סכום"
        value={value.maxAmount}
        onChange={(e) => set('maxAmount', e.target.value)}
        error={maxAmountError}
      />
    </div>
  )
}
