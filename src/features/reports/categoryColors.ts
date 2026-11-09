import { CATEGORIES, type Category } from '../../../shared/categories'

/**
 * One fixed color per category, in category order (DESIGN 2.1, --chart-1..11).
 * Kept apart from chartTheme so lists can use the colors without loading Chart.js.
 */
export const PALETTE = [
  '#6EA8FF',
  '#5FD4E8',
  '#3CCB8E',
  '#B49BFF',
  '#F2B45C',
  '#FF8FA3',
  '#7FB8C9',
  '#9DB6FF',
  '#C9A86B',
  '#8FD3B6',
  '#A7AFBF',
] as const

export function categoryColor(category: Category): string {
  return PALETTE[CATEGORIES.indexOf(category) % PALETTE.length]
}
