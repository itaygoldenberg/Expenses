/**
 * Arrow-key navigation for radio groups / tab lists.
 * In RTL the "next" item is on the left, so ArrowLeft moves forward.
 */
export function nextIndex(key: string, current: number, count: number, rtl = true): number | null {
  const forward = rtl ? 'ArrowLeft' : 'ArrowRight'
  const backward = rtl ? 'ArrowRight' : 'ArrowLeft'
  switch (key) {
    case forward:
    case 'ArrowDown':
      return (current + 1) % count
    case backward:
    case 'ArrowUp':
      return (current - 1 + count) % count
    case 'Home':
      return 0
    case 'End':
      return count - 1
    default:
      return null
  }
}

/** The app is RTL; only an explicit dir="ltr" ancestor switches the arrow keys. */
export function isRtl(el: Element | null): boolean {
  return el?.closest('[dir]')?.getAttribute('dir') !== 'ltr'
}
