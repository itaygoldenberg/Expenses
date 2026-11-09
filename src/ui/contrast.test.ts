import { describe, expect, it } from 'vitest'
import { contrastRatio, FILLED_PAIRS, MIN_TEXT_CONTRAST, SURFACES, TEXT_COLORS } from './contrast'

describe('contrastRatio', () => {
  it('matches known WCAG values', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 1)
    expect(contrastRatio('#777777', '#FFFFFF')).toBeCloseTo(4.48, 1)
    expect(contrastRatio('#FFFFFF', '#FFFFFF')).toBe(1)
  })
})

describe('design tokens contrast (≥ 4.5:1)', () => {
  for (const text of TEXT_COLORS) {
    for (const surface of SURFACES) {
      it(`${text.name} on ${surface.name}`, () => {
        expect(contrastRatio(text.hex, surface.rgb)).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST)
      })
    }
  }
  for (const pair of FILLED_PAIRS) {
    it(pair.name, () => {
      expect(contrastRatio(pair.fg, pair.bg)).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST)
    })
  }
})
