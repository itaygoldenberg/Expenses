import { Chart } from 'react-chartjs-2'
import { formatValue } from './aggregate'
import { GRID_COLOR, tooltipStyle } from './chartTheme'
import styles from './Charts.module.css'

export type TrendPoint = { label: string; net: number; income: number }

/** Monthly net expenses as bars, with income as a line when there is any (dashboard). */
export function TrendChart({ points }: { points: TrendPoint[] }) {
  const hasIncome = points.some((p) => p.income > 0)
  const summary = points
    .map((p) => `${p.label} ${formatValue(p.net, 'amount')}${hasIncome ? `, הכנסות ${formatValue(p.income, 'amount')}` : ''}`)
    .join('; ')

  return (
    <div className={styles.trendCanvas}>
      <Chart
        type="bar"
        role="img"
        aria-label={`הוצאות נטו ב-${points.length} החודשים האחרונים: ${summary}`}
        data={{
          labels: points.map((p) => p.label),
          datasets: [
            {
              type: 'bar' as const,
              label: 'הוצאות נטו',
              data: points.map((p) => p.net / 100),
              backgroundColor: 'rgb(110 168 255 / 0.75)',
              hoverBackgroundColor: '#6EA8FF',
              borderRadius: 6,
              maxBarThickness: 32,
              order: 2,
            },
            ...(hasIncome
              ? [
                  {
                    type: 'line' as const,
                    label: 'הכנסות',
                    data: points.map((p) => p.income / 100),
                    borderColor: '#3CCB8E',
                    backgroundColor: '#3CCB8E',
                    pointRadius: 3,
                    tension: 0.35,
                    cubicInterpolationMode: 'monotone' as const,
                    order: 1,
                  },
                ]
              : []),
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          plugins: {
            legend: { display: false },
            tooltip: {
              ...tooltipStyle,
              callbacks: {
                label: (ctx) => {
                  const p = points[ctx.dataIndex]
                  const value = ctx.dataset.label === 'הכנסות' ? p.income : p.net
                  return ` ${ctx.dataset.label}: ${formatValue(value, 'amount')}`
                },
              },
            },
          },
          scales: {
            x: { grid: { display: false } },
            y: {
              beginAtZero: true,
              grid: { color: GRID_COLOR },
              ticks: { precision: 0, callback: (v) => `₪${Number(v).toLocaleString('en-US')}` },
            },
          },
        }}
      />
    </div>
  )
}
