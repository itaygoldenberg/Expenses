import { describe, expect, it } from 'vitest'
import { allNav, isNavActive } from './navItems'

const byPath = (to: string) => allNav.find((i) => i.to === to)!

describe('isNavActive', () => {
  it('marks summary active only on the home path', () => {
    expect(isNavActive(byPath('/'), '/')).toBe(true)
    expect(isNavActive(byPath('/'), '/transactions')).toBe(false)
  })

  it('marks "more" active for screens reached through it', () => {
    expect(isNavActive(byPath('/more'), '/more')).toBe(true)
    expect(isNavActive(byPath('/more'), '/categories')).toBe(true)
    expect(isNavActive(byPath('/more'), '/import')).toBe(true)
    expect(isNavActive(byPath('/more'), '/recurring')).toBe(false)
  })
})
