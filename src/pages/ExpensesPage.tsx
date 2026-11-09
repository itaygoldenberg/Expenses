import { useMemo, useState } from 'react'
import { Plus, Search, SlidersHorizontal, X } from 'lucide-react'
import { CATEGORIES } from '../../shared/categories'
import { formatDisplayDate } from '../../shared/dates'
import { KIND_LABELS, KINDS } from '../../shared/kinds'
import type { Expense } from '../../shared/types'
import { PageHeader } from '../components/PageHeader'
import { useExpensesData } from '../features/expenses/ExpensesProvider'
import { ExpenseList } from '../features/expenses/ExpenseList'
import { EditExpenseModal } from '../features/expenses/EditExpenseModal'
import { DeleteExpenseDialog } from '../features/expenses/DeleteExpenseDialog'
import { DEFAULT_SORT, nextSort, sortExpenses, type SortState } from '../features/expenses/sortExpenses'
import { FilterFields } from '../features/filters/FilterFields'
import {
  activeFilterCount,
  availableYears,
  EMPTY_RECORD_FILTERS,
  filterRecords,
  HEBREW_MONTHS,
  normalizeFilters,
  parseMaxAmount,
  type RecordFilters,
} from '../features/filters/filterExpenses'
import { useMediaQuery, WIDE_SCREEN } from '../hooks/useMediaQuery'
import { Button, Card, Chip, EmptyState, ErrorState, SelectField, Sheet, Skeleton, TextField } from '../ui'
import styles from './ExpensesPage.module.css'

export const NOT_FOUND_MESSAGE = 'הרישום לא נמצא — ייתכן שכבר נמחק.'
export const NO_RECORDS_MESSAGE = 'עדיין אין רישומים'
export const NO_MATCHES_MESSAGE = 'אין רישומים שתואמים לחיפוש'
const MAX_AMOUNT_ERRORS = { invalid: 'יש להזין סכום חיובי', tooManyDecimals: 'עד שתי ספרות אחרי הנקודה' } as const

type ChipItem = { key: string; label: string; clear: (f: RecordFilters) => RecordFilters }

/** Active conditions as removable chips. Removing the year also clears month and day. */
function activeChips(f: RecordFilters): ChipItem[] {
  const chips: ChipItem[] = []
  if (f.year) chips.push({ key: 'year', label: `שנה: ${f.year}`, clear: (x) => normalizeFilters({ ...x, year: '' }) })
  if (f.month)
    chips.push({ key: 'month', label: `חודש: ${HEBREW_MONTHS[Number(f.month) - 1]}`, clear: (x) => normalizeFilters({ ...x, month: '' }) })
  if (f.day) chips.push({ key: 'day', label: `יום: ${f.day}`, clear: (x) => ({ ...x, day: '' }) })
  if (f.maxAmount.trim()) chips.push({ key: 'max', label: `עד ₪${f.maxAmount.trim()}`, clear: (x) => ({ ...x, maxAmount: '' }) })
  if (f.kind) chips.push({ key: 'kind', label: `סוג: ${KIND_LABELS[f.kind]}`, clear: (x) => ({ ...x, kind: '' }) })
  if (f.category) chips.push({ key: 'category', label: `קטגוריה: ${f.category}`, clear: (x) => ({ ...x, category: '' }) })
  return chips
}

/** All records: search + filters (AND), sorting, edit and delete. */
export function ExpensesPage() {
  const { state, reload, update, remove, notify, openAdd } = useExpensesData()
  const wide = useMediaQuery(WIDE_SCREEN)
  const [filters, setFilters] = useState<RecordFilters>(EMPTY_RECORD_FILTERS)
  const [panelOpen, setPanelOpen] = useState(false)
  const [sort, setSort] = useState<SortState>(DEFAULT_SORT)
  const [editing, setEditing] = useState<Expense | null>(null)
  const [deleting, setDeleting] = useState<Expense | null>(null)

  const expenses = useMemo(() => (state.status === 'ready' ? state.expenses : []), [state])
  const years = useMemo(() => availableYears(expenses), [expenses])
  const max = parseMaxAmount(filters.maxAmount)
  // An invalid max amount is shown as an error and does not limit the results
  const effective = useMemo(() => (max.ok ? filters : { ...filters, maxAmount: '' }), [filters, max.ok])
  const shown = useMemo(() => sortExpenses(filterRecords(expenses, effective), sort), [expenses, effective, sort])
  const chips = activeChips(filters)
  const count = activeFilterCount(filters)
  const hasConditions = count > 0 || filters.search.trim() !== ''

  function handleNotFound() {
    setEditing(null)
    setDeleting(null)
    notify(NOT_FOUND_MESSAGE, 'error')
  }

  const extraFields = (
    <div className={styles.extra}>
      <SelectField
        label="סוג"
        placeholder="כל הסוגים"
        options={KINDS.map((k) => ({ value: k, label: KIND_LABELS[k] }))}
        value={filters.kind}
        onChange={(e) => setFilters((f) => ({ ...f, kind: e.target.value as RecordFilters['kind'] }))}
      />
      <SelectField
        label="קטגוריה"
        placeholder="כל הקטגוריות"
        options={CATEGORIES.map((c) => ({ value: c, label: c }))}
        value={filters.category}
        onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value as RecordFilters['category'] }))}
      />
    </div>
  )

  const filterPanel = (
    <div className={styles.panelBody}>
      <FilterFields
        years={years}
        value={filters}
        onChange={setFilters}
        maxAmountError={max.ok ? undefined : MAX_AMOUNT_ERRORS[max.error]}
      />
      {extraFields}
    </div>
  )

  return (
    <div className={styles.page}>
      <PageHeader
        title="הוצאות"
        subtitle="כל הרישומים: הוצאות, זיכויים והכנסות"
        actions={
          <Button icon={<Plus size={18} aria-hidden="true" />} onClick={openAdd}>
            הוספה
          </Button>
        }
      />

      <Card className={styles.card} aria-label="רשימת הרישומים">
        <div className={styles.toolbar} role="search">
          <TextField
            label="חיפוש"
            className={styles.search}
            type="search"
            placeholder="חיפוש בתיאור"
            startAdornment={<Search size={18} aria-hidden="true" />}
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
          />
          <Button
            variant="secondary"
            icon={<SlidersHorizontal size={18} aria-hidden="true" />}
            aria-expanded={panelOpen}
            onClick={() => setPanelOpen((o) => !o)}
          >
            סינון{count > 0 && <span className={`num ${styles.count}`}>{count}</span>}
          </Button>
        </div>

        {/* Desktop / tablet: filter row under the toolbar */}
        {wide && panelOpen && <div className={styles.panel}>{filterPanel}</div>}

        {chips.length > 0 && (
          <div className={styles.chips} aria-label="סינונים פעילים">
            {chips.map((c) => (
              <Chip key={c.key} onRemove={() => setFilters((f) => c.clear(f))} removeLabel={`הסרת ${c.label}`}>
                {c.label}
              </Chip>
            ))}
            <Button size="sm" variant="ghost" icon={<X size={16} aria-hidden="true" />} onClick={() => setFilters(EMPTY_RECORD_FILTERS)}>
              איפוס
            </Button>
          </div>
        )}

        {state.status === 'loading' && <Skeleton lines={6} />}

        {state.status === 'error' && <ErrorState description="לא הצלחנו לטעון את הרישומים." onRetry={() => void reload()} />}

        {state.status === 'ready' && expenses.length === 0 && (
          <EmptyState
            title={NO_RECORDS_MESSAGE}
            description="הוסיפו הוצאה, זיכוי או הכנסה כדי להתחיל."
            action={
              <Button icon={<Plus size={18} aria-hidden="true" />} onClick={openAdd}>
                הוספת רישום
              </Button>
            }
          />
        )}

        {state.status === 'ready' && expenses.length > 0 && shown.length === 0 && (
          <EmptyState
            icon={<Search size={40} strokeWidth={1.4} />}
            title={NO_MATCHES_MESSAGE}
            description="נסו לשנות את החיפוש או את הסינון."
            action={
              <Button variant="secondary" onClick={() => setFilters(EMPTY_RECORD_FILTERS)}>
                איפוס הסינון
              </Button>
            }
          />
        )}

        {state.status === 'ready' && shown.length > 0 && (
          <>
            <p className={styles.summary} role="status">
              {hasConditions ? (
                <>
                  מוצגים <span className="num">{shown.length}</span> מתוך <span className="num">{expenses.length}</span> רישומים
                </>
              ) : (
                <>
                  <span className="num">{shown.length}</span> רישומים
                </>
              )}
            </p>
            <ExpenseList
              expenses={shown}
              sort={sort}
              onSortColumn={(key) => setSort((s) => nextSort(s, key))}
              onSortChange={setSort}
              onEdit={setEditing}
              onDelete={setDeleting}
            />
          </>
        )}
      </Card>

      {/* Phone: filters in a bottom sheet */}
      {!wide && panelOpen && (
        <Sheet title="סינון" onClose={() => setPanelOpen(false)}>
          <div className={styles.sheetBody}>
            {filterPanel}
            <div className={styles.sheetActions}>
              <Button onClick={() => setPanelOpen(false)}>
                הצגת <span className="num">{shown.length}</span> רישומים
              </Button>
              <Button variant="secondary" onClick={() => setFilters((f) => ({ ...EMPTY_RECORD_FILTERS, search: f.search }))}>
                איפוס
              </Button>
            </div>
          </div>
        </Sheet>
      )}

      {editing && (
        <EditExpenseModal
          expense={editing}
          onSubmit={update}
          onSaved={() => {
            setEditing(null)
            notify('הרישום עודכן')
          }}
          onNotFound={handleNotFound}
          onClose={() => setEditing(null)}
        />
      )}

      {deleting && (
        <DeleteExpenseDialog
          expense={deleting}
          onConfirm={remove}
          onDeleted={() => {
            setDeleting(null)
            notify(`הרישום מ-${formatDisplayDate(deleting.expenseDate)} נמחק`)
          }}
          onNotFound={handleNotFound}
          onClose={() => setDeleting(null)}
        />
      )}
    </div>
  )
}
