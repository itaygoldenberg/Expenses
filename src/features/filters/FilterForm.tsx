import type { FormEvent } from 'react'
import { Search, X } from 'lucide-react'
import fieldStyles from '../expenses/ExpenseForm.module.css'
import { FilterFields } from './FilterFields'
import type { Filters } from './filterExpenses'
import styles from './FilterForm.module.css'

type Props = {
  years: string[]
  value: Filters
  onChange: (value: Filters) => void
  onApply: () => void
  onReset: () => void
  maxAmountError?: string
}

export function FilterForm({ years, value, onChange, onApply, onReset, maxAmountError }: Props) {
  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    onApply()
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <FilterFields years={years} value={value} onChange={onChange} maxAmountError={maxAmountError} />

      <div className={fieldStyles.actions}>
        <button type="submit" className={fieldStyles.primary}>
          <Search size={18} aria-hidden="true" />
          הצג תוצאות
        </button>
        <button type="button" className={`${fieldStyles.secondary} ${styles.reset}`} onClick={onReset}>
          <X size={18} aria-hidden="true" />
          איפוס סינון
        </button>
      </div>
    </form>
  )
}
