import { ArrowDown, ArrowUp, ArrowUpDown, Pencil, Trash2 } from 'lucide-react'
import { formatDisplayDate } from '../../../shared/dates'
import type { Expense } from '../../../shared/types'
import { displayAmount } from './displayAmount'
import { SORT_OPTIONS, type SortKey, type SortState } from './sortExpenses'
import styles from './ExpenseList.module.css'

type Props = {
  expenses: Expense[]
  sort: SortState
  onSortColumn: (key: SortKey) => void
  onSortChange: (sort: SortState) => void
  /** When omitted (e.g. on the filters page), no edit/delete buttons are shown. */
  onEdit?: (expense: Expense) => void
  onDelete?: (expense: Expense) => void
}

function describe(e: Expense): string {
  return `${e.description ?? e.category}, ${displayAmount(e.amount)} ₪, ${formatDisplayDate(e.expenseDate)}`
}

function SortHeader({
  label,
  column,
  sort,
  onSort,
}: {
  label: string
  column: SortKey
  sort: SortState
  onSort: (key: SortKey) => void
}) {
  const active = sort.key === column
  const Icon = !active ? ArrowUpDown : sort.direction === 'asc' ? ArrowUp : ArrowDown
  return (
    <th scope="col" aria-sort={active ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button
        type="button"
        className={`${styles.sortButton} ${active ? styles.sortActive : ''}`}
        onClick={() => onSort(column)}
      >
        {label}
        <Icon size={14} aria-hidden="true" />
      </button>
    </th>
  )
}

function Actions({
  expense,
  onEdit,
  onDelete,
}: {
  expense: Expense
  onEdit: NonNullable<Props['onEdit']>
  onDelete: NonNullable<Props['onDelete']>
}) {
  return (
    <div className={styles.actions}>
      <button
        type="button"
        className={`${styles.iconButton} ${styles.edit}`}
        onClick={() => onEdit(expense)}
        title="עדכון"
        aria-label={`עדכון: ${describe(expense)}`}
      >
        <Pencil size={18} aria-hidden="true" />
      </button>
      <button
        type="button"
        className={`${styles.iconButton} ${styles.delete}`}
        onClick={() => onDelete(expense)}
        title="מחיקה"
        aria-label={`מחיקה: ${describe(expense)}`}
      >
        <Trash2 size={18} aria-hidden="true" />
      </button>
    </div>
  )
}

export function ExpenseList({ expenses, sort, onSortColumn, onSortChange, onEdit, onDelete }: Props) {
  const selected = SORT_OPTIONS.find((o) => o.sort.key === sort.key && o.sort.direction === sort.direction)
  const withActions = Boolean(onEdit && onDelete)

  return (
    <>
      {/* Desktop: table with sortable headers */}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <SortHeader label="תאריך" column="date" sort={sort} onSort={onSortColumn} />
              <th scope="col">תיאור</th>
              <SortHeader label="קטגוריה" column="category" sort={sort} onSort={onSortColumn} />
              <SortHeader label="סכום (₪)" column="amount" sort={sort} onSort={onSortColumn} />
              {withActions && <th scope="col">פעולות</th>}
            </tr>
          </thead>
          <tbody>
            {expenses.map((e) => (
              <tr key={e.id}>
                <td>
                  <span className="num">{formatDisplayDate(e.expenseDate)}</span>
                </td>
                <td className={e.description ? undefined : styles.muted}>{e.description ?? '—'}</td>
                <td>{e.category}</td>
                <td>
                  <span className="num">{displayAmount(e.amount)}</span>
                </td>
                {onEdit && onDelete && (
                  <td>
                    <Actions expense={e} onEdit={onEdit} onDelete={onDelete} />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: sort select + cards */}
      <div className={styles.mobile}>
        <label className={styles.sortSelect}>
          <span>מיון</span>
          <select
            value={selected?.value}
            onChange={(ev) => {
              const option = SORT_OPTIONS.find((o) => o.value === ev.target.value)
              if (option) onSortChange(option.sort)
            }}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <ul className={styles.cards}>
          {expenses.map((e) => (
            <li key={e.id} className={styles.card}>
              <div className={styles.cardBody}>
                <p className={styles.cardAmount}>
                  <span className="num">₪ {displayAmount(e.amount)}</span>
                </p>
                <p className={styles.cardMeta}>{e.description ? `${e.description} · ${e.category}` : e.category}</p>
                <p className={styles.cardDate}>
                  <span className="num">{formatDisplayDate(e.expenseDate)}</span>
                </p>
              </div>
              {onEdit && onDelete && <Actions expense={e} onEdit={onEdit} onDelete={onDelete} />}
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}
