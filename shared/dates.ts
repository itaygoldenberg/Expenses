/** Business time zone used to decide what "today" is on the server. */
export const BUSINESS_TIME_ZONE = 'Asia/Jerusalem'

/** Today's date (YYYY-MM-DD) in the given time zone. */
export function todayInTimeZone(timeZone: string, now: Date = new Date()): string {
  // en-CA formats as YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}

export function todayInJerusalem(now: Date = new Date()): string {
  return todayInTimeZone(BUSINESS_TIME_ZONE, now)
}

/** Today's date (YYYY-MM-DD) in the browser's local time zone. */
export function todayLocal(now: Date = new Date()): string {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** True for a real calendar date in YYYY-MM-DD form (rejects 2026-02-30). */
export function isValidIsoDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return false
  const [y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])]
  if (y < 1900 || m < 1 || m > 12 || d < 1) return false
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate()
  return d <= daysInMonth
}

/** ISO dates compare correctly as strings. */
export function isAfter(isoDate: string, otherIsoDate: string): boolean {
  return isoDate > otherIsoDate
}

/** "2026-11-09" → "09/11/2026" */
export function formatDisplayDate(isoDate: string): string {
  const [y, m, d] = isoDate.split('-')
  return `${d}/${m}/${y}`
}
