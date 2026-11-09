import { formatAgorotWithSeparators, parseShekelsToAgorot } from '../../../shared/money'

/** "1249.9" → "1,249.90" for display. */
export function displayAmount(amount: string): string {
  const parsed = parseShekelsToAgorot(amount)
  return parsed.ok ? formatAgorotWithSeparators(parsed.agorot) : amount
}
