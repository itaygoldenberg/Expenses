/**
 * Right-to-left text for pdfmake.
 *
 * pdfmake lays text out left to right and splits it into words. Its font engine
 * (fontkit) reverses the letters of any chunk that contains Hebrew, but it does
 * not reorder words, mirror brackets, or keep numbers/English inside such a chunk
 * in the right direction (it reverses them too). Measured on real PDFs, see ADR-5.
 *
 * So this module splits a line into direction runs (simplified BiDi, RTL base):
 * - Hebrew runs: kept in logical letter order (fontkit reverses them), brackets
 *   mirrored, and spaces made non-breaking so pdfmake keeps the run as one chunk.
 * - LTR runs (numbers, dates, amounts, English): kept as they are.
 * - Runs are returned in visual order, left to right.
 */

export type Run = { text: string; rtl: boolean }

type Dir = 'R' | 'L' | 'N'

const HEBREW = /[֐-׿יִ-ﭏ]/
const LTR = /[A-Za-z0-9À-ɏ]/
const NUM_SEP = /[.,/:\-]/
const MIRROR: Record<string, string> = { '(': ')', ')': '(', '[': ']', ']': '[', '{': '}', '}': '{', '<': '>', '>': '<' }
const NBSP = ' '

function classify(chars: string[]): Dir[] {
  const dirs: Dir[] = chars.map((c) => (HEBREW.test(c) ? 'R' : LTR.test(c) ? 'L' : 'N'))
  for (let i = 0; i < chars.length; i++) {
    const c = chars[i]
    // Separators between digits belong to the number (dates, amounts, times)
    if (NUM_SEP.test(c) && /\d/.test(chars[i - 1] ?? '') && /\d/.test(chars[i + 1] ?? '')) dirs[i] = 'L'
    // ₪ next to a number (directly or after one space) reads with the number
    if (c === '₪' && [chars[i - 1], chars[i + 1], chars[i + 2]].some((n) => /\d/.test(n ?? ''))) dirs[i] = 'L'
  }
  // Neutrals take the direction of their neighbours when both agree, otherwise RTL (the base)
  for (let i = 0; i < dirs.length; i++) {
    if (dirs[i] !== 'N') continue
    let j = i
    while (j < dirs.length && dirs[j] === 'N') j++
    const before = i > 0 ? dirs[i - 1] : 'R'
    const after = j < dirs.length ? dirs[j] : 'R'
    const resolved: Dir = before === after ? before : 'R'
    for (let k = i; k < j; k++) dirs[k] = resolved
    i = j - 1
  }
  return dirs
}

/** Direction runs of one line, in visual (left-to-right) order, ready for pdfmake. */
export function toPdfRuns(line: string): Run[] {
  if (!line) return []
  const chars = [...line]
  const dirs = classify(chars)

  const runs: { dir: Dir; chars: string[] }[] = []
  chars.forEach((c, i) => {
    const last = runs[runs.length - 1]
    if (last && last.dir === dirs[i]) last.chars.push(c)
    else runs.push({ dir: dirs[i], chars: [c] })
  })

  return runs.reverse().map((r) =>
    r.dir === 'R'
      ? { rtl: true, text: r.chars.map((c) => (c === ' ' ? NBSP : (MIRROR[c] ?? c))).join('') }
      : { rtl: false, text: r.chars.join('') },
  )
}

/**
 * How the line looks on paper, left to right (what a reader sees).
 * Used by tests: Hebrew runs are shown reversed, as fontkit will draw them.
 */
export function visualText(line: string): string {
  return toPdfRuns(line)
    .map((r) => (r.rtl ? [...r.text].reverse().join('') : r.text))
    .join('')
    .replace(/ /g, ' ')
}

/**
 * Splits text into lines of at most `maxChars` at spaces, because a Hebrew run
 * is kept as one unbreakable chunk and pdfmake cannot wrap it by itself.
 */
export function wrapLines(text: string, maxChars: number): string[] {
  const lines: string[] = []
  let current = ''
  for (const word of text.split(/\s+/).filter(Boolean)) {
    if (current && current.length + 1 + word.length > maxChars) {
      lines.push(current)
      current = word
    } else {
      current = current ? `${current} ${word}` : word
    }
  }
  if (current) lines.push(current)
  return lines
}
