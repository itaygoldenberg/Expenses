import Papa from 'papaparse'
import { formatDisplayDate } from '../../../shared/dates'
import { formatAgorot, parseShekelsToAgorot } from '../../../shared/money'
import type { Expense } from '../../../shared/types'

export const CSV_HEADERS = ['תאריך', 'קטגוריה', 'תיאור', 'סכום (₪)'] as const

/** UTF-8 byte order mark, so Excel opens Hebrew correctly. */
export const BOM = '﻿'

/**
 * Prevents CSV formula injection: a spreadsheet would run text that starts with
 * = + - @ (or tab / carriage return) as a formula, so such text gets a leading '.
 */
export function neutralizeFormula(value: string): string {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value
}

function amountText(amount: string): string {
  const parsed = parseShekelsToAgorot(amount)
  return parsed.ok ? formatAgorot(parsed.agorot) : amount
}

/** CSV text (with BOM) for the given expenses, in the order given. */
export function buildCsv(expenses: readonly Expense[]): string {
  const rows = expenses.map((e) => [
    formatDisplayDate(e.expenseDate),
    neutralizeFormula(e.category),
    neutralizeFormula(e.description ?? ''),
    amountText(e.amount), // number only (no thousands separator) so Excel reads it as a number
  ])
  return BOM + Papa.unparse({ fields: [...CSV_HEADERS], data: rows }, { newline: '\r\n', quotes: false })
}
