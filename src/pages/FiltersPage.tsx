import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { Filter, ListFilter } from 'lucide-react'
import { useExpenses } from '../hooks/useExpenses'
import { FilterForm } from '../features/filters/FilterForm'
import {
  EMPTY_FILTERS,
  availableYears,
  filterExpenses,
  parseMaxAmount,
  type Filters,
} from '../features/filters/filterExpenses'
import { ExpenseList } from '../features/expenses/ExpenseList'
import { DEFAULT_SORT, nextSort, sortExpenses, type SortState } from '../features/expenses/sortExpenses'
import styles from './HomePage.module.css'

export const NO_MATCHES_MESSAGE = 'אין הוצאות שעונות על התנאים שבחרת.'

const MAX_AMOUNT_ERRORS = {
  invalid: 'יש להזין סכום חיובי',
  tooManyDecimals: 'עד שתי ספרות אחרי הנקודה',
} as const

export function FiltersPage() {
  const { state, reload } = useExpenses()
  // draft = what is in the form; applied = what the table shows ("הצג תוצאות")
  const [draft, setDraft] = useState<Filters>(EMPTY_FILTERS)
  const [applied, setApplied] = useState<Filters>(EMPTY_FILTERS)
  const [maxAmountError, setMaxAmountError] = useState<string>()
  const [sort, setSort] = useState<SortState>(DEFAULT_SORT)

  const expenses = state.status === 'ready' ? state.expenses : []
  const years = useMemo(() => availableYears(expenses), [expenses])
  const results = useMemo(
    () => sortExpenses(filterExpenses(expenses, applied), sort),
    [expenses, applied, sort],
  )

  function apply() {
    const max = parseMaxAmount(draft.maxAmount)
    if (!max.ok) {
      setMaxAmountError(MAX_AMOUNT_ERRORS[max.error])
      return
    }
    setMaxAmountError(undefined)
    setApplied(draft)
  }

  function reset() {
    setDraft(EMPTY_FILTERS)
    setApplied(EMPTY_FILTERS)
    setMaxAmountError(undefined)
    setSort(DEFAULT_SORT)
  }

  return (
    <div className={styles.page}>
      <section className={styles.card} aria-labelledby="filters-title">
        <h1 id="filters-title" className={styles.title}>
          <Filter size={24} aria-hidden="true" className={styles.titleIcon} />
          סינון הוצאות
        </h1>
        <FilterForm
          years={years}
          value={draft}
          onChange={(v) => {
            setDraft(v)
            if (maxAmountError && v.maxAmount !== draft.maxAmount) setMaxAmountError(undefined)
          }}
          onApply={apply}
          onReset={reset}
          maxAmountError={maxAmountError}
        />
      </section>

      <section className={styles.card} aria-labelledby="results-title">
        <h2 id="results-title" className={styles.title}>
          <ListFilter size={22} aria-hidden="true" className={styles.titleIcon} />
          הוצאות תואמות
        </h2>

        {state.status === 'loading' && (
          <p className={styles.message} role="status">
            טוען הוצאות…
          </p>
        )}

        {state.status === 'error' && (
          <div className={styles.errorBox} role="alert">
            <p>לא הצלחנו לטעון את ההוצאות</p>
            <button type="button" className={styles.secondary} onClick={() => void reload()}>
              נסו שוב
            </button>
          </div>
        )}

        {state.status === 'ready' && expenses.length === 0 && (
          <p className={styles.message}>
            עדיין אין הוצאות. אפשר להוסיף הוצאות ב<Link to="/" className={styles.link}>דף הבית</Link>.
          </p>
        )}

        {state.status === 'ready' && expenses.length > 0 && results.length === 0 && (
          <div className={styles.emptyBox} role="status">
            <p>{NO_MATCHES_MESSAGE}</p>
            <button type="button" className={styles.secondary} onClick={reset}>
              איפוס סינון
            </button>
          </div>
        )}

        {results.length > 0 && (
          <ExpenseList
            expenses={results}
            sort={sort}
            onSortColumn={(key) => setSort((s) => nextSort(s, key))}
            onSortChange={setSort}
          />
        )}
      </section>
    </div>
  )
}
