import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  LinearScale,
  Tooltip,
} from 'chart.js'
import { CATEGORIES, type Category } from '../../../shared/categories'

// Register only what the two charts need (keeps the bundle small)
ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip)

ChartJS.defaults.font.family = "'Heebo', 'Inter', system-ui, sans-serif"
ChartJS.defaults.font.size = 13
ChartJS.defaults.color = 'rgb(234 242 255 / 0.75)' // Text Light, muted

/**
 * One fixed color per category (DESIGN 2.1): the six accent colors of the palette,
 * then lighter/darker tones of the same colors for the remaining five categories.
 */
const PALETTE = [
  '#22E1FF', // Cyan
  '#FF3B78', // Hot Pink
  '#8B7CFF', // Violet
  '#2DD4BF', // Teal
  '#E91E8A', // Magenta
  '#4DE8DC', // Aqua
  '#9AF0FF', // Cyan, light
  '#FF9DBB', // Hot Pink, light
  '#C2B9FF', // Violet, light
  '#1A9E8E', // Teal, dark
  '#5B4FD6', // Violet, dark
] as const

export function categoryColor(category: Category): string {
  return PALETTE[CATEGORIES.indexOf(category) % PALETTE.length]
}

export const GRID_COLOR = 'rgb(34 225 255 / 0.12)'
export const SLICE_BORDER = '#0F1E34' // Panel Blue, separates pie slices

export const tooltipStyle = {
  backgroundColor: '#0A1020',
  borderColor: 'rgb(34 225 255 / 0.5)',
  borderWidth: 1,
  titleColor: '#EAF2FF',
  bodyColor: '#EAF2FF',
  padding: 10,
  rtl: true,
  textDirection: 'rtl' as const,
}
