import { Pencil, Trash2 } from 'lucide-react'
import { formatDisplayDate } from '../../../shared/dates'
import { KIND_LABELS, type Kind } from '../../../shared/kinds'
import type { Category } from '../../../shared/categories'
import type { Expense } from '../../../shared/types'
import { Badge, DataTable, IconButton, SelectField, type Column, type Tone } from '../../ui'
import { categoryColor } from '../reports/categoryColors'
import { cx } from '../../ui/cx'
import { describeRecord, isMoneyIn, signedAmount } from './displayAmount'
import { SORT_OPTIONS, type SortKey, type SortState } from './sortExpenses'
import styles from './ExpenseList.module.css'

type Props = {
  expenses: Expense[]
  sort: SortState
  onSortColumn: (key: SortKey) => void
  onSortChange: (sort: SortState) => void
  /** When omitted, no edit/delete buttons are shown. */
  onEdit?: (expense: Expense) => void
  onDelete?: (expense: Expense) => void
}

export const KIND_TONES: Record<Kind, Tone> = { expense: 'neutral', refund: 'accent', income: 'positive' }

export function KindBadge({ kind }: { kind: Kind }) {
  return <Badge tone={KIND_TONES[kind]}>{KIND_LABELS[kind]}</Badge>
}

/** Category with its fixed chart color as a small dot. */
export function CategoryTag({ category }: { category: Category | null }) {
  if (!category) return <span className={styles.muted}>—</span>
  return (
    <span className={styles.category}>
      <span className={styles.dot} style={{ background: categoryColor(category) }} aria-hidden="true" />
      {category}
    </span>
  )
}

function Amount({ expense }: { expense: Expense }) {
  return <span className={cx('num', isMoneyIn(expense) && styles.moneyIn)}>{signedAmount(expense)}</span>
}

function Actions({ expense, onEdit, onDelete }: { expense: Expense; onEdit: (e: Expense) => void; onDelete: (e: Expense) => void }) {
  return (
    <div className={styles.actions}>
      <IconButton
        variant="ghost"
        label={`עדכון: ${describeRecord(expense)}`}
        title="עדכון"
        icon={<Pencil size={18} aria-hidden="true" />}
        onClick={() => onEdit(expense)}
      />
      <IconButton
        variant="ghost"
        className={styles.delete}
        label={`מחיקה: ${describeRecord(expense)}`}
        title="מחיקה"
        icon={<Trash2 size={18} aria-hidden="true" />}
        onClick={() => onDelete(expense)}
      />
    </div>
  )
}

/** Records as a sortable glass table (tablet / desktop) and as cards with a sort select (phone). */
export function ExpenseList({ expenses, sort, onSortColumn, onSortChange, onEdit, onDelete }: Props) {
  const selected = SORT_OPTIONS.find((o) => o.sort.key === sort.key && o.sort.direction === sort.direction)

  const columns: Column<Expense>[] = [
    {
      key: 'date',
      header: 'תאריך',
      sortable: true,
      render: (e) => <span className="num">{formatDisplayDate(e.expenseDate)}</span>,
    },
    {
      key: 'description',
      header: 'תיאור',
      render: (e) => (e.description ? <span className={styles.description}>{e.description}</span> : <span className={styles.muted}>—</span>),
    },
    { key: 'category', header: 'קטגוריה', sortable: true, render: (e) => <CategoryTag category={e.category} /> },
    { key: 'kind', header: 'סוג', render: (e) => <KindBadge kind={e.kind} /> },
    { key: 'amount', header: 'סכום (₪)', sortable: true, numeric: true, render: (e) => <Amount expense={e} /> },
  ]
  if (onEdit && onDelete) {
    columns.push({ key: 'actions', header: 'פעולות', render: (e) => <Actions expense={e} onEdit={onEdit} onDelete={onDelete} /> })
  }

  return (
    <>
      <div className={styles.table}>
        <DataTable
          caption="רשימת הרישומים"
          columns={columns}
          rows={expenses}
          rowKey={(e) => e.id}
          sort={sort}
          onSort={(key) => onSortColumn(key as SortKey)}
        />
      </div>

      <div className={styles.mobile}>
        <SelectField
          label="מיון"
          className={styles.sortSelect}
          options={SORT_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          value={selected?.value}
          onChange={(ev) => {
            const option = SORT_OPTIONS.find((o) => o.value === ev.target.value)
            if (option) onSortChange(option.sort)
          }}
        />
        <ul className={styles.cards}>
          {expenses.map((e) => (
            <li key={e.id} className={styles.card}>
              <div className={styles.cardBody}>
                <p className={styles.cardAmount}>
                  <Amount expense={e} />
                </p>
                <p className={styles.cardMeta}>{[e.description, e.category].filter(Boolean).join(' · ') || KIND_LABELS[e.kind]}</p>
                <p className={styles.cardFooter}>
                  <span className="num">{formatDisplayDate(e.expenseDate)}</span>
                  {e.kind !== 'expense' && <KindBadge kind={e.kind} />}
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
