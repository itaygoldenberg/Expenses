// Fixed category list from PRD 4.2 (order as listed there).
export const CATEGORIES = [
  'מזון',
  'דלק',
  'פנאי',
  'רשויות',
  'בריאות',
  'קניות',
  'תחבורה',
  'דיור',
  'חינוך',
  'אחר',
  'הכשרה',
] as const

export type Category = (typeof CATEGORIES)[number]

/** Category that requires a description. */
export const OTHER_CATEGORY: Category = 'אחר'

export function isCategory(value: unknown): value is Category {
  return typeof value === 'string' && (CATEGORIES as readonly string[]).includes(value)
}
