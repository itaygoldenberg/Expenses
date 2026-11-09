import { useMemo, useState } from 'react'
import { Bar } from 'react-chartjs-2'
import type { ScriptableContext } from 'chart.js'
import type { Expense } from '../../../shared/types'
import { SegmentedControl, SelectField } from '../../ui'
import { byMonth, byYear, formatValue, toChartNumber, yearsWithExpenses, type Metric } from './aggregate'
import { GRID_COLOR, tooltipStyle } from './chartTheme'
import styles from './Charts.module.css'

type Grouping = 'month' | 'year'

type Props = {
  expenses: Expense[]
  metric: Metric
}

/** Soft Blue → Cyan gradient (DESIGN 2.1). */
function barGradient(ctx: ScriptableContext<'bar'>) {
  const { chart } = ctx
  const area = chart.chartArea
  if (!area) return '#6EA8FF'
  const g = chart.ctx.createLinearGradient(0, area.bottom, 0, area.top)
  g.addColorStop(0, '#6EA8FF')
  g.addColorStop(1, '#5FD4E8')
  return g
}

export function PeriodBars({ expenses, metric }: Props) {
  const years = useMemo(() => yearsWithExpenses(expenses), [expenses])
  const [grouping, setGrouping] = useState<Grouping>('month')
  const [chosenYear, setChosenYear] = useState('')
  // Default (and fallback if the chosen year no longer has records): the newest year
  const year = years.includes(chosenYear) ? chosenYear : (years[0] ?? '')

  const series = useMemo(
    () => (grouping === 'year' ? byYear(expenses, metric) : byMonth(expenses, year, metric)),
    [expenses, metric, grouping, year],
  )
  const summary = series.map((s) => `${s.label} ${formatValue(s.value, metric)}`).join(', ')

  return (
    <div className={styles.barsLayout}>
      <div className={styles.controls}>
        <SegmentedControl
          label="קיבוץ"
          size="sm"
          value={grouping}
          onChange={setGrouping}
          options={[
            { value: 'month', label: 'לפי חודשים' },
            { value: 'year', label: 'לפי שנים' },
          ]}
        />
        {grouping === 'month' && (
          <SelectField
            label="שנה"
            className={styles.yearSelect}
            options={years.map((y) => ({ value: y, label: y }))}
            value={year}
            onChange={(e) => setChosenYear(e.target.value)}
          />
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
