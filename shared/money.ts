/** Upper limit: ₪100,000.00 in agorot. */
export const MAX_AMOUNT_AGOROT = 10_000_000

export type AmountError = 'required' | 'invalid' | 'tooManyDecimals' | 'notPositive' | 'tooLarge'

/**
 * Parses a shekel amount ("49.9", "1,250.50") into whole agorot without floating point.
 * Returns the agorot value or an error code.
 */
export function parseShekelsToAgorot(
  input: string | number,
): { ok: true; agorot: number } | { ok: false; error: AmountError } {
  const text = String(input).trim().replace(/,/g, '')
  if (text === '') return { ok: false, error: 'required' }
  if (/^-/.test(text)) return { ok: false, error: 'notPositive' }
  if (/^\d+\.\d{3,}$/.test(text)) return { ok: false, error: 'tooManyDecimals' }
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(text)
  if (!match) return { ok: false, error: 'invalid' }

  const whole = match[1].replace(/^0+(?=\d)/, '')
  if (whole.length > 6) return { ok: false, error: 'tooLarge' }
  const fraction = (match[2] ?? '').padEnd(2, '0')
  const agorot = Number(whole) * 100 + Number(fraction)

  if (agorot <= 0) return { ok: false, error: 'notPositive' }
  if (agorot > MAX_AMOUNT_AGOROT) return { ok: false, error: 'tooLarge' }
  return { ok: true, agorot }
}

/** 4990 → "49.90" */
export function formatAgorot(agorot: number): string {
  const whole = Math.floor(agorot / 100)
  const fraction = String(agorot % 100).padStart(2, '0')
  return `${whole}.${fraction}`
}

/** 124990 → "1,249.90" (for display) */
export function formatAgorotWithSeparators(agorot: number): string {
  const [whole, fraction] = formatAgorot(agorot).split('.')
  return `${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${fraction}`
}
