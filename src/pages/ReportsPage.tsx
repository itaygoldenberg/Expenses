import { useMemo, useState } from 'react'
import { BarChart3, PieChart, Plus } from 'lucide-react'
import type { Category } from '../../shared/categories'
import { PageHeader } from '../components/PageHeader'
import { useExpensesData } from '../features/expenses/ExpensesProvider'
import { byCategory, formatValue, type Metric } from '../features/reports/aggregate'
import { CategoryPie } from '../features/reports/CategoryPie'
import { PeriodBars } from '../features/reports/PeriodBars'
import { ExportPanel } from '../features/export/ExportPanel'
import { inRange, percentChange, summarize, type Summary } from '../features/metrics/metrics'
import { PERIOD_OPTIONS, periodRange, previousRange, type DateRange, type PeriodKey } from '../features/metrics/periods'
import { formatDisplayDate, todayLocal } from '../../shared/dates'
import { Button, Card, EmptyState, ErrorState, SegmentedControl, Skeleton, TextField } from '../ui'
import { cx } from '../ui/cx'
import styles from './ReportsPage.module.css'

export const NO_DATA_MESSAGE = 'עדיין אין רישומים להצגה בדו"חות.'

const rangeText = (r: DateRange) => `${formatDisplayDate(r.from)}–${formatDisplayDate(r.to)}`

function Delta({ current, previous, lowerIsBetter }: { current: number; previous: number; lowerIsBetter: boolean }) {
  const change = percentChange(current, previous)
  if (change === null) return <span className={styles.muted}>אין נתונים להשוואה</span>
  const good = lowerIsBetter ? change <= 0 : change >= 0
  return (
    <span className={cx('num', good ? styles.good : styles.bad)}>
      {change > 0 ? '+' : ''}
      {change.toFixed(Math.abs(change) < 10 ? 1 : 0)}%
    </span>
  )
}

function Stat({
  label,
  value,
  previous,
  metric,
  compare,
  lowerIsBetter = true,
}: {
  label: string
  value: number
  previous: number | null
  metric: Metric
  compare: boolean
  lowerIsBetter?: boolean
}) {
  return (
    <div className={styles.stat}>
      <p className={styles.statLabel}>{label}</p>
      <p className={`num ${styles.statValue}`}>{formatValue(value, metric)}</p>
      {compare && previous !== null && (
        <p className={styles.statPrev}>
          קודמת: <span className="num">{formatValue(previous, metric)}</span> · <Delta current={value} previous={previous} lowerIsBetter={lowerIsBetter} />
        </p>
      )}
    </div>
  )
}

export function ReportsPage() {
  // Always the user's saved records: filters elsewhere never affect the reports
  const { state, reload, openAdd } = useExpensesData()
  const [metric, setMetric] = useState<Metric>('amount')
  const [period, setPeriod] = useState<PeriodKey>('all')
  const [custom, setCustom] = useState<Partial<DateRange>>({})
  const [compareOn, setCompareOn] = useState(false)
  const today = todayLocal()

  const expenses = useMemo(() => (state.status === 'ready' ? state.expenses : []), [state])
  const range = periodRange(period, today, custom)
  const previous = range ? previousRange(period, range) : null
  const compare = compareOn && previous !== null

  // Ranges are rebuilt on every render; filter again only when their dates change
  const rangeKey = range ? `${range.from}|${range.to}` : ''
  const previousKey = previous ? `${previous.from}|${previous.to}` : ''
  const inPeriod = useMemo(() => {
    if (!rangeKey) return expenses
    const [from, to] = rangeKey.split('|')
    return inRange(expenses, { from, to })
  }, [expenses, rangeKey])
  const inPrevious = useMemo(() => {
    if (!previousKey) return []
    const [from, to] = previousKey.split('|')
    return inRange(expenses, { from, to })
  }, [expenses, previousKey])

  const categories = useMemo(() => byCategory(inPeriod, metric), [inPeriod, metric])
  const previousByCategory = useMemo(
    () => new Map<Category, number>(byCategory(inPrevious, metric).map((c) => [c.category, c.value])),
    [inPrevious, metric],
  )
  const now: Summary = summarize(inPeriod)
  const before: Summary = summarize(inPrevious)
  const canCompare = compare && now.hasSpending && before.hasSpending

  return (
    <div className={styles.page}>
      <PageHeader title='דו"חות' subtitle="ניתוח ההוצאות לפי תקופה, קטגוריה וזמן" />

      <Card className={styles.toolbar} aria-label="הגדרות הדו״ח">
        <SegmentedControl label="תקופה" options={PERIOD_OPTIONS} value={period} onChange={setPeriod} size="sm" />
        {period === 'custom' && (
          <div className={styles.custom}>
            <TextField
              label="מתאריך"
              type="date"
              numeric
              max={custom.to || today}
              value={custom.from ?? ''}
              onChange={(e) => setCustom((c) => ({ ...c, from: e.target.value }))}
            />
            <TextField
              label="עד תאריך"
              type="date"
              numeric
              min={custom.from}
              max={today}
              value={custom.to ?? ''}
              onChange={(e) => setCustom((c) => ({ ...c, to: e.target.value }))}
            />
          </div>
        )}
        <div className={styles.toolbarRow}>
          <SegmentedControl
            label="מדד"
            size="sm"
            value={metric}
            onChange={setMetric}
            options={[
              { value: 'amount', label: '₪ סכום' },
              { value: 'count', label: 'כמות' },
            ]}
          />
          <label className={cx(styles.switch, period === 'all' && styles.switchDisabled)}>
            <input
              type="checkbox"
              role="switch"
              checked={compareOn}
              disabled={period === 'all'}
              onChange={(e) => setCompareOn(e.target.checked)}
            />
            <span className={styles.track} aria-hidden="true" />
            השוואה לתקופה הקודמת
          </label>
        </div>
        {range && (
          <p className={styles.rangeNote}>
            <span className="num">{rangeText(range)}</span>
            {compare && previous && (
              <>
                {' '}
                · קודמת: <span className="num">{rangeText(previous)}</span>
              </>
            )}
          </p>
        )}
        {period === 'custom' && !range && <p className={styles.rangeNote}>בחרו תאריך התחלה ותאריך סיום.</p>}
      </Card>

      {state.status === 'loading' && <Skeleton variant="block" height={280} />}

      {state.status === 'error' && <ErrorState description="לא הצלחנו לטעון את הרישומים." onRetry={() => void reload()} />}

      {state.status === 'ready' && expenses.length === 0 && (
        <Card>
          <EmptyState
            icon={<BarChart3 size={40} strokeWidth={1.4} />}
            title={NO_DATA_MESSAGE}
            description="הדו״חות יופיעו אחרי הרישום הראשון."
            action={
              <Button icon={<Plus size={18} aria-hidden="true" />} onClick={openAdd}>
                הוספת רישום
              </Button>
            }
          />
        </Card>
      )}

      {state.status === 'ready' && expenses.length > 0 && (
        <>
          <Card as="section" aria-label="סיכום התקופה" className={styles.stats}>
            <Stat label="הוצאות (נטו)" value={now.netExpenses} previous={canCompare ? before.netExpenses : null} metric="amount" compare={compare} />
            <Stat label="הכנסות" value={now.income} previous={compare ? before.income : null} metric="amount" compare={compare} lowerIsBetter={false} />
            <Stat label="מספר הוצאות" value={now.expenseCount} previous={canCompare ? before.expenseCount : null} metric="count" compare={compare} />
            {compare && !canCompare && <p className={styles.muted}>השוואה מוצגת רק כשיש הוצאות בשתי התקופות.</p>}
          </Card>

          <div className={styles.charts}>
            <Card title="לפי קטגוריות" icon={<PieChart size={20} aria-hidden="true" />}>
              {categories.length > 0 ? (
                <>
                  {compare && <p className={styles.legendHead}>עמודה שמאלית: התקופה הקודמת</p>}
                  <CategoryPie data={categories} metric={metric} previous={compare ? previousByCategory : undefined} />
                </>
              ) : (
                <EmptyState title="אין הוצאות בתקופה הזו" description="בחרו תקופה אחרת." />
              )}
            </Card>

            <Card title="לפי שנים / חודשים" icon={<BarChart3 size={20} aria-hidden="true" />}>
              <PeriodBars expenses={expenses} metric={metric} />
            </Card>
          </div>

          <ExportPanel expenses={expenses} />
        </>
      )}
    </div>
  )
}
