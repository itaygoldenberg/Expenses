import {
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js'

// Register only what the charts need (keeps the bundle small); the trend chart mixes bars and a line
ChartJS.register(ArcElement, BarElement, BarController, LineElement, LineController, PointElement, CategoryScale, LinearScale, Tooltip)

ChartJS.defaults.font.family = "'Heebo', 'Inter', system-ui, sans-serif"
ChartJS.defaults.font.size = 13
ChartJS.defaults.color = '#9AA4B5' // secondary text

export { PALETTE, categoryColor } from './categoryColors'

export const GRID_COLOR = 'rgb(255 255 255 / 0.08)'
export const SLICE_BORDER = '#0B1426' // Deep Navy, separates pie slices

export const tooltipStyle = {
  backgroundColor: 'rgb(8 12 22 / 0.92)',
  borderColor: 'rgb(255 255 255 / 0.14)',
  borderWidth: 1,
  titleColor: '#F2F5FA',
  bodyColor: '#F2F5FA',
  padding: 10,
  cornerRadius: 12,
  rtl: true,
  textDirection: 'rtl' as const,
}
