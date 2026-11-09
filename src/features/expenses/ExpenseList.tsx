import { formatDisplayDate } from '../../../shared/dates'
import { formatAgorotWithSeparators, parseShekelsToAgorot } from '../../../shared/money'
import type { Expense } from '../../../shared/types'
import styles from './ExpenseList.module.css'

function displayAmount(amount: string): string {
  const parsed = parseShekelsToAgorot(amount)
  return parsed.ok ? formatAgorotWithSeparators(parsed.agorot) : amount
}

export function ExpenseList({ expenses }: { expenses: Expense[] }) {
  return (
    <>
      {/* Desktop: table */}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">תאריך</th>
              <th scope="col">תיאור</th>
              <th scope="col">קטגוריה</th>
              <th scope="col">סכום (₪)</th>
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: cards */}
      <ul className={styles.cards}>
        {expenses.map((e) => (
          <li key={e.id} className={styles.card}>
            <p className={styles.cardAmount}>
              <span className="num">₪ {displayAmount(e.amount)}</span>
            </p>
            <p className={styles.cardMeta}>
              {e.description ? `${e.description} · ${e.category}` : e.category}
            </p>
            <p className={styles.cardDate}>
              <span className="num">{formatDisplayDate(e.expenseDate)}</span>
            </p>
          </li>
        ))}
      </ul>
    </>
  )
}
