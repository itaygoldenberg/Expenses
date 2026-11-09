import { Doughnut } from 'react-chartjs-2'
import type { Category } from '../../../shared/categories'
import { formatValue, toChartNumber, type Metric } from './aggregate'
import { SLICE_BORDER, categoryColor, tooltipStyle } from './chartTheme'
import styles from './Charts.module.css'

type Props = {
  data: { category: Category; value: number }[]
  metric: Metric
  /** Values of the previous period, shown next to each category when comparing. */
  previous?: Map<Category, number>
  /** Accessible name prefix, e.g. "הוצאות לפי קטגוריות". */
  label?: string
}

/** Donut by category with an RTL legend (values, and the previous period when comparing). */
export function CategoryPie({ data, metric, previous, label = 'הוצאות לפי קטגוריות' }: Props) {
  const summary = data.map((d) => `${d.category} ${formatValue(d.value, metric)}`).join(', ')
  const total = data.reduce((sum, d) => sum + d.value, 0)

  return (
    <div className={styles.pieLayout}>
      <div className={styles.pieCanvas}>
        <Doughnut
          role="img"
          aria-label={`${label}: ${summary}`}
          data={{
            labels: data.map((d) => d.category),
            datasets: [
              {
                data: data.map((d) => toChartNumber(d.value, metric)),
                backgroundColor: data.map((d) => categoryColor(d.category)),
                borderColor: SLICE_BORDER,
                borderWidth: 2,
                hoverOffset: 6,
              },
            ],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            cutout: '64%',
            plugins: {
              legend: { display: false }, // HTML legend below, RTL and with values
              tooltip: {
                ...tooltipStyle,
                callbacks: {
                  label: (ctx) => ` ${ctx.label}: ${formatValue(data[ctx.dataIndex].value, metric)}`,
                },
              },
            },
          }}
        />
        <div className={styles.pieCenter} aria-hidden="true">
          <span className={styles.pieCenterLabel}>סה"כ</span>
          <span className={`num ${styles.pieCenterValue}`}>{formatValue(total, metric)}</span>
        </div>
      </div>

      <ul className={styles.legend} aria-label="מקרא">
        {data.map((d) => (
          <li key={d.category}>
            <span className={styles.swatch} style={{ background: categoryColor(d.category) }} aria-hidden="true" />
            <span className={styles.legendLabel}>{d.category}</span>
            <span className={`${styles.legendValue} num`}>{formatValue(d.value, metric)}</span>
            {previous && (
              <span className={`${styles.legendPrev} num`}>
                <span className="visually-hidden">בתקופה הקודמת: </span>
                {formatValue(previous.get(d.category) ?? 0, metric)}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
