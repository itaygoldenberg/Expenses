// Record types (PRD 4.4). A refund lowers the expenses of its category; income is counted separately.
export const KINDS = ['expense', 'refund', 'income'] as const

export type Kind = (typeof KINDS)[number]

export const KIND_LABELS: Record<Kind, string> = {
  expense: 'הוצאה',
  refund: 'זיכוי',
  income: 'הכנסה',
}

export function isKind(value: unknown): value is Kind {
  return typeof value === 'string' && (KINDS as readonly string[]).includes(value)
}

/** Expenses and refunds belong to a category; income does not. */
export function kindHasCategory(kind: Kind): boolean {
  return kind !== 'income'
}
