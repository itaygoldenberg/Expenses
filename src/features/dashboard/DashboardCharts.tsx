// Loaded lazily by the home page, so Chart.js is not part of the first download.
import type { Category } from '../../../shared/categories'
import { CategoryPie } from '../reports/CategoryPie'
import { TrendChart, type TrendPoint } from '../reports/TrendChart'

export function DashboardTrend({ points }: { points: TrendPoint[] }) {
  return <TrendChart points={points} />
}

export function DashboardDonut({ data }: { data: { category: Category; value: number }[] }) {
  return <CategoryPie data={data} metric="amount" label="הוצאות החודש לפי קטגוריות" />
}
