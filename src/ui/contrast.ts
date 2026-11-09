/** WCAG 2.x contrast helpers, used by the contrast test and the design-system page. */

export type Rgb = [number, number, number]

export function parseHex(hex: string): Rgb {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? [...h].map((c) => c + c).join('') : h
  const n = parseInt(full, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

/** Color of a translucent layer `fg` (alpha 0–1) painted over an opaque `bg`. */
export function composite(fg: Rgb, alpha: number, bg: Rgb): Rgb {
  return fg.map((c, i) => Math.round(c * alpha + bg[i] * (1 - alpha))) as Rgb
}

function luminance([r, g, b]: Rgb): number {
  const ch = (v: number) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b)
}

export function contrastRatio(fg: string | Rgb, bg: string | Rgb): number {
  const a = luminance(typeof fg === 'string' ? parseHex(fg) : fg)
  const b = luminance(typeof bg === 'string' ? parseHex(bg) : bg)
  const [hi, lo] = a > b ? [a, b] : [b, a]
  return (hi + 0.05) / (lo + 0.05)
}

const WHITE: Rgb = [255, 255, 255]
const BG_0 = parseHex('#070B14')
const BG_1 = parseHex('#0B1426')

/** Surfaces the text sits on (glass is measured over the lighter background, the worst case). */
export const SURFACES: { name: string; rgb: Rgb }[] = [
  { name: 'רקע Midnight', rgb: BG_0 },
  { name: 'רקע Deep Navy', rgb: BG_1 },
  { name: 'זכוכית 1', rgb: composite(WHITE, 0.07, BG_1) },
  { name: 'זכוכית 2 (מודאל)', rgb: composite(WHITE, 0.11, BG_1) },
  { name: 'משטח אטום', rgb: parseHex('#141B2B') },
]

export const TEXT_COLORS: { name: string; hex: string }[] = [
  { name: 'טקסט ראשי', hex: '#F2F5FA' },
  { name: 'טקסט משני', hex: '#9AA4B5' },
  { name: 'Soft Blue', hex: '#6EA8FF' },
  { name: 'Emerald', hex: '#3CCB8E' },
  { name: 'Coral', hex: '#FF6B7A' },
  { name: 'Amber', hex: '#F2B45C' },
]

/** Text on filled buttons: Midnight on Soft Blue (primary) and on Coral (danger). */
export const FILLED_PAIRS: { name: string; fg: string; bg: string }[] = [
  { name: 'כפתור ראשי', fg: '#070B14', bg: '#6EA8FF' },
  { name: 'כפתור מסוכן', fg: '#070B14', bg: '#FF6B7A' },
]

export const MIN_TEXT_CONTRAST = 4.5
