/**
 * Report periods (milestone-c plan 5.3). Dates are YYYY-MM-DD strings; month math is done
 * on (year, month) numbers so there are no time-zone surprises.
 */

export type PeriodKey = 'all' | 'month' | '3months' | 'year' | 'custom'

export type DateRange = { from: string; to: string }

export const PERIOD_OPTIONS: { value: PeriodKey; label: string }[] = [
  { value: 'all', label: 'הכול' },
  { value: 'month', label: 'החודש' },
  { value: '3months', label: '3 חודשים' },
  { value: 'year', label: 'שנה' },
  { value: 'custom', label: 'טווח' },
]

const pad = (n: number) => String(n).padStart(2, '0')

function lastDay(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

/** Adds `delta` months to (year, month 1–12). */
export function addMonths(year: number, month: number, delta: number): { year: number; month: number } {
  const index = year * 12 + (month - 1) + delta
  return { year: Math.floor(index / 12), month: (index % 12) + 1 }
}

/** "YYYY-MM" key of a date. */
export function monthKey(isoDate: string): string {
  return isoDate.slice(0, 7)
}

/** The calendar months [start month … start + count − 1] as a date range. */
function monthsRange(year: number, month: number, count: number): DateRange {
  const end = addMonths(year, month, count - 1)
  return {
    from: `${year}-${pad(month)}-01`,
    to: `${end.year}-${pad(end.month)}-${pad(lastDay(end.year, end.month))}`,
  }
}

const MONTHS_IN: Record<'month' | '3months' | 'year', number> = { month: 1, '3months': 3, year: 12 }

/**
 * Range of the chosen period, ending with the current calendar month.
 * "all" → null (no limit). "custom" uses the given range (null until both dates are valid and ordered).
 */
export function periodRange(key: PeriodKey, today: string, custom?: Partial<DateRange>): DateRange | null {
  if (key === 'all') return null
  if (key === 'custom') {
    const from = custom?.from ?? ''
    const to = custom?.to ?? ''
    if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to) || from > to) return null
    return { from, to }
  }
  const months = MONTHS_IN[key]
  const [y, m] = [Number(today.slice(0, 4)), Number(today.slice(5, 7))]
  const start = addMonths(y, m, -(months - 1))
  return monthsRange(start.year, start.month, months)
}

function toUtc(iso: string): number {
  return Date.UTC(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, Number(iso.slice(8, 10)))
}

function fromUtc(ms: number): string {
  const d = new Date(ms)
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
}

const DAY = 24 * 60 * 60 * 1000

/**
 * The period right before `range`, of the same length: the same number of calendar months
 * for month-based periods, the same number of days for a custom range.
 */
export function previousRange(key: PeriodKey, range: DateRange): DateRange {
  if (key === 'month' || key === '3months' || key === 'year') {
    const months = MONTHS_IN[key]
    const [y, m] = [Number(range.from.slice(0, 4)), Number(range.from.slice(5, 7))]
    const start = addMonths(y, m, -months)
    return monthsRange(start.year, start.month, months)
  }
  const days = Math.round((toUtc(range.to) - toUtc(range.from)) / DAY) + 1
  const to = toUtc(range.from) - DAY
  return { from: fromUtc(to - (days - 1) * DAY), to: fromUtc(to) }
}

/** The last `count` month keys ("YYYY-MM"), oldest first, ending with the month of `today`. */
export function lastMonths(today: string, count: number): string[] {
  const [y, m] = [Number(today.slice(0, 4)), Number(today.slice(5, 7))]
  return Array.from({ length: count }, (_, i) => {
    const d = addMonths(y, m, i - (count - 1))
    return `${d.year}-${pad(d.month)}`
  })
}

/** The whole calendar month of `today`, and the month before it. */
export function currentAndPreviousMonth(today: string): { current: DateRange; previous: DateRange } {
  const current = periodRange('month', today)!
  return { current, previous: previousRange('month', current) }
}
