import { z } from 'zod'
import { isCategory, OTHER_CATEGORY, type Category } from './categories.js'
import { parseShekelsToAgorot, type AmountError } from './money.js'
import { isAfter, isValidIsoDate } from './dates.js'
import { isKind, kindHasCategory, type Kind } from './kinds.js'
import type { ExpenseInput, FieldErrors } from './types.js'

export const MAX_DESCRIPTION_LENGTH = 200

export const MESSAGES = {
  categoryRequired: 'יש לבחור קטגוריה',
  descriptionRequiredForOther: "בקטגוריה 'אחר' יש להזין תיאור",
  descriptionTooLong: `התיאור יכול להכיל עד ${MAX_DESCRIPTION_LENGTH} תווים`,
  dateInvalid: 'יש לבחור תאריך תקין',
  dateInFuture: 'לא ניתן לבחור תאריך עתידי',
  kindInvalid: 'יש לבחור סוג: הוצאה, זיכוי או הכנסה',
} as const

const AMOUNT_MESSAGES: Record<AmountError, string> = {
  required: 'יש להזין סכום',
  invalid: 'יש להזין סכום חיובי',
  notPositive: 'יש להזין סכום חיובי',
  tooManyDecimals: 'עד שתי ספרות אחרי הנקודה',
  tooLarge: 'הסכום המרבי הוא ₪100,000',
}

/** Validated, normalized expense ready to be stored. */
export type ValidExpense = {
  kind: Kind
  /** null for income */
  category: Category | null
  description: string | null
  amountAgorot: number
  expenseDate: string
}

// Shape check only; business rules are applied in validateExpenseInput.
const inputShape = z.object({
  kind: z.string().nullable().optional(),
  category: z.string().optional().default(''),
  description: z.string().nullable().optional().default(''),
  amount: z.union([z.string(), z.number()]).optional().default(''),
  expenseDate: z.string().optional().default(''),
})

/**
 * Validates an expense body. Used by both the form (browser) and the API (server),
 * so both reject exactly the same input with the same Hebrew messages.
 * `today` is YYYY-MM-DD; the server passes today in Asia/Jerusalem.
 */
export function validateExpenseInput(
  raw: unknown,
  today: string,
): { ok: true; value: ValidExpense } | { ok: false; errors: FieldErrors } {
  const parsed = inputShape.safeParse(raw ?? {})
  if (!parsed.success) {
    return {
      ok: false,
      errors: { category: MESSAGES.categoryRequired, amount: AMOUNT_MESSAGES.invalid, expenseDate: MESSAGES.dateInvalid },
    }
  }
  const input = parsed.data
  const errors: FieldErrors = {}

  // Missing kind = expense (clients from before record types existed)
  const kindText = (input.kind ?? '').trim() || 'expense'
  const kind: Kind | null = isKind(kindText) ? kindText : null
  if (!kind) errors.kind = MESSAGES.kindInvalid

  // Income has no category: whatever was sent is ignored
  const needsCategory = kind === null || kindHasCategory(kind)
  const category = needsCategory ? input.category.trim() : ''
  if (needsCategory && !isCategory(category)) errors.category = MESSAGES.categoryRequired

  const description = (input.description ?? '').trim()
  if (description.length > MAX_DESCRIPTION_LENGTH) {
    errors.description = MESSAGES.descriptionTooLong
  } else if (category === OTHER_CATEGORY && description === '') {
    errors.description = MESSAGES.descriptionRequiredForOther
  }

  const amount = parseShekelsToAgorot(input.amount)
  if (!amount.ok) errors.amount = AMOUNT_MESSAGES[amount.error]

  const expenseDate = input.expenseDate.trim()
  if (!isValidIsoDate(expenseDate)) errors.expenseDate = MESSAGES.dateInvalid
  else if (isAfter(expenseDate, today)) errors.expenseDate = MESSAGES.dateInFuture

  if (Object.keys(errors).length > 0 || !amount.ok || !kind) {
    return { ok: false, errors }
  }
  return {
    ok: true,
    value: {
      kind,
      category: isCategory(category) ? category : null,
      description: description === '' ? null : description,
      amountAgorot: amount.agorot,
      expenseDate,
    },
  }
}

export type { ExpenseInput }
