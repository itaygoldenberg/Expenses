import type { ReactNode } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import { cx } from './cx'
import styles from './DataTable.module.css'

export type SortDirection = 'asc' | 'desc'

export type Column<T> = {
  key: string
  header: string
  render: (row: T) => ReactNode
  /** Numbers / dates: left-to-right with aligned digits. */
  numeric?: boolean
  sortable?: boolean
}

type Props<T> = {
  caption: string
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string
  sort?: { key: string; direction: SortDirection }
  onSort?: (key: string) => void
  /** Hide the caption visually (still read by screen readers). */
  hideCaption?: boolean
}

/** Glass table: sticky header, hover rows, sortable headers with aria-sort. */
export function DataTable<T>({ caption, columns, rows, rowKey, sort, onSort, hideCaption = true }: Props<T>) {
  return (
    <div className={styles.wrap}>
      <table className={styles.table}>
        <caption className={hideCaption ? 'visually-hidden' : styles.caption}>{caption}</caption>
        <thead>
          <tr>
            {columns.map((c) => {
              const active = sort?.key === c.key
              const ariaSort = active ? (sort.direction === 'asc' ? 'ascending' : 'descending') : c.sortable ? 'none' : undefined
              const Icon = !active ? ArrowUpDown : sort.direction === 'asc' ? ArrowUp : ArrowDown
              return (
                <th key={c.key} scope="col" aria-sort={ariaSort} className={cx(c.numeric && styles.numeric)}>
                  {c.sortable && onSort ? (
                    <button type="button" className={cx(styles.sort, active && styles.sortActive)} onClick={() => onSort(c.key)}>
                      {c.header}
                      <Icon size={14} aria-hidden="true" />
                    </button>
                  ) : (
                    c.header
                  )}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)}>
              {columns.map((c) => (
                <td key={c.key} className={cx(c.numeric && cx(styles.numeric, 'num'))}>
                  {c.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
