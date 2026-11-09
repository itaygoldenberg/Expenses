import { useId, useMemo, useState } from 'react'
import { Bar } from 'react-chartjs-2'
import type { ScriptableContext } from 'chart.js'
import { ChevronDown } from 'lucide-react'
import type { Expense } from '../../../shared/types'
import fieldStyles from '../expenses/ExpenseForm.module.css'
import { byMonth, byYear, formatValue, toChartNumber, yearsWithExpenses, type Metric } from './aggregate'
import { GRID_COLOR, tooltipStyle } from './chartTheme'
import styles from './Charts.module.css'

type Grouping = 'month' | 'year'

type Props = {
  expenses: readonly Expense[]
  metric: Metric
}

/** Cyan → Violet gradient, as in the mockup. */
function barGradient(ctx: ScriptableContext<'bar'>) {
  const { chart } = ctx
  const area = chart.chartArea
  if (!area) return '#22E1FF'
  const g = chart.ctx.createLinearGradient(0, area.bottom, 0, area.top)
  g.addColorStop(0, '#8B7CFF')
  g.addColorStop(1, '#22E1FF')
  return g
}

export function PeriodBars({ expenses, metric }: Props) {
  const id = useId()
  const years = useMemo(() => yearsWithExpenses(expenses), [expenses])
  const [grouping, setGrouping] = useState<Grouping>('month')
  const [chosenYear, setChosenYear] = useState('')
  // Default (and fallback if the chosen year no longer has expenses): the newest year
  const year = years.includes(chosenYear) ? chosenYear : (years[0] ?? '')

  const series = useMemo(
    () => (grouping === 'year' ? byYear(expenses, metric) : byMonth(expenses, year, metric)),
    [expenses, metric, grouping, year],
  )
  const summary = series.map((s) => `${s.label} ${formatValue(s.value, metric)}`).join(', ')
  const selectClass = `${fieldStyles.input} ${fieldStyles.select} ${styles.smallSelect}`

  return (
    <div className={styles.barsLayout}>
      <div className={styles.controls}>
        <label className={styles.control}>
          <span className="visually-hidden">קיבוץ</span>
          <span className={fieldStyles.control}>
            <select
              id={`${id}-grouping`}
              aria-label="קיבוץ"
              className={selectClass}
              value={grouping}
              onChange={(e) => setGrouping(e.target.value as Grouping)}
            >
              <option value="month">לפי חודשים</option>
              <option value="year">לפי שנים</option>
            </select>
            <ChevronDown className={fieldStyles.iconEnd} size={16} aria-hidden="true" />
          </span>
        </label>
        {grouping === 'month' && (
          <label className={styles.control}>
            <span className="visually-hidden">שנה</span>
            <span className={fieldStyles.control}>
              <select
                id={`${id}-year`}
                aria-label="שנה"
                className={selectClass}
                value={year}
                onChange={(e) => setChosenYear(e.target.value)}
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              <ChevronDown className={fieldStyles.iconEnd} size={16} aria-hidden="true" />
            </span>
          </label>
        )}
      </div>

      <div className={styles.barCanvas}>
        <Bar
          role="img"
          aria-label={`${grouping === 'year' ? 'הוצאות לפי שנים' : `הוצאות לפי חודשים ב-${year}`}: ${summary}`}
          data={{
            labels: series.map((s) => s.label),
            datasets: [
              {
                data: series.map((s) => toChartNumber(s.value, metric)),
                backgroundColor: barGradient,
                borderRadius: 6,
                maxBarThickness: 36,
              },
            ],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                ...tooltipStyle,
                callbacks: {
                  label: (ctx) => ` ${formatValue(series[ctx.dataIndex].value, metric)}`,
                },
              },
            },
            scales: {
              // Show every month label; Chart.js tilts them only when there is not enough room (phones)
              x: { grid: { display: false }, ticks: { autoSkip: false, maxRotation: 60 } },
              y: {
                beginAtZero: true,
                grid: { color: GRID_COLOR },
                ticks: {
                  precision: 0,
                  callback: (v) => (metric === 'amount' ? `₪${Number(v).toLocaleString('en-US')}` : String(v)),
                },
              },
            },
          }}
        />
      </div>
    </div>
  )
}
