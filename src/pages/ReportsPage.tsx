import { useId, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { BarChart3, ChevronDown, PieChart } from 'lucide-react'
import { useExpenses } from '../hooks/useExpenses'
import { byCategory, type Metric } from '../features/reports/aggregate'
import { CategoryPie } from '../features/reports/CategoryPie'
import { PeriodBars } from '../features/reports/PeriodBars'
import { ExportPanel } from '../features/export/ExportPanel'
import fieldStyles from '../features/expenses/ExpenseForm.module.css'
import homeStyles from './HomePage.module.css'
import styles from './ReportsPage.module.css'

export const NO_DATA_MESSAGE = 'עדיין אין הוצאות להצגה בדו"חות.'

export function ReportsPage() {
  const id = useId()
  // Always all saved expenses: filters elsewhere never affect the charts
  const { state, reload } = useExpenses()
  const [metric, setMetric] = useState<Metric>('amount')

  const expenses = useMemo(() => (state.status === 'ready' ? state.expenses : []), [state])
  const categories = useMemo(() => byCategory(expenses, metric), [expenses, metric])

  return (
    <div className={homeStyles.page}>
      <section className={homeStyles.card} aria-labelledby="reports-title">
        <div className={styles.header}>
          <h1 id="reports-title" className={`${homeStyles.title} ${styles.title}`}>
            <BarChart3 size={24} aria-hidden="true" className={homeStyles.titleIcon} />
            דו"חות וניתוח הוצאות
          </h1>
          <div className={styles.metric}>
            <label htmlFor={`${id}-metric`}>מדד:</label>
            <span className={fieldStyles.control}>
              <select
                id={`${id}-metric`}
                className={`${fieldStyles.input} ${fieldStyles.select} ${styles.metricSelect}`}
                value={metric}
                onChange={(e) => setMetric(e.target.value as Metric)}
              >
                <option value="amount">סכום בשקלים</option>
                <option value="count">מספר הוצאות</option>
              </select>
              <ChevronDown className={fieldStyles.iconEnd} size={16} aria-hidden="true" />
            </span>
          </div>
        </div>

        {state.status === 'loading' && (
          <p className={homeStyles.message} role="status">
            טוען נתונים…
          </p>
        )}

        {state.status === 'error' && (
          <div className={homeStyles.errorBox} role="alert">
            <p>לא הצלחנו לטעון את ההוצאות</p>
            <button type="button" className={homeStyles.secondary} onClick={() => void reload()}>
              נסו שוב
            </button>
          </div>
        )}

        {state.status === 'ready' && expenses.length === 0 && (
          <p className={homeStyles.message}>
            {NO_DATA_MESSAGE} אפשר להוסיף הוצאות ב
            <Link to="/" className={homeStyles.link}>
              דף הבית
            </Link>
            .
          </p>
        )}

        {state.status === 'ready' && expenses.length > 0 && (
          <div className={styles.charts}>
            <figure className={styles.chartCard} aria-labelledby={`${id}-pie`}>
              <figcaption id={`${id}-pie`} className={styles.chartTitle}>
                <PieChart size={18} aria-hidden="true" />
                הוצאות לפי קטגוריות
              </figcaption>
              <CategoryPie data={categories} metric={metric} />
            </figure>

            <figure className={styles.chartCard} aria-labelledby={`${id}-bars`}>
              <figcaption id={`${id}-bars`} className={styles.chartTitle}>
                <BarChart3 size={18} aria-hidden="true" />
                הוצאות לפי שנים / חודשים
              </figcaption>
              <PeriodBars expenses={expenses} metric={metric} />
            </figure>
          </div>
        )}

        {state.status === 'ready' && expenses.length > 0 && <ExportPanel expenses={expenses} />}
      </section>
    </div>
  )
}
