import { Pie } from 'react-chartjs-2'
import type { Category } from '../../../shared/categories'
import { formatValue, toChartNumber, type Metric } from './aggregate'
import { SLICE_BORDER, categoryColor, tooltipStyle } from './chartTheme'
import styles from './Charts.module.css'

type Props = {
  data: { category: Category; value: number }[]
  metric: Metric
}

export function CategoryPie({ data, metric }: Props) {
  const summary = data.map((d) => `${d.category} ${formatValue(d.value, metric)}`).join(', ')

  return (
    <div className={styles.pieLayout}>
      <div className={styles.pieCanvas}>
        <Pie
          role="img"
          aria-label={`הוצאות לפי קטגוריות: ${summary}`}
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
      </div>

      <ul className={styles.legend} aria-label="מקרא">
        {data.map((d) => (
          <li key={d.category}>
            <span className={styles.swatch} style={{ background: categoryColor(d.category) }} aria-hidden="true" />
            <span className={styles.legendLabel}>{d.category}</span>
            <span className={`${styles.legendValue} num`}>{formatValue(d.value, metric)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
