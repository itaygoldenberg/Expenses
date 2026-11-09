import { describe, expect, it } from 'vitest'
import { formatAgorot, formatAgorotWithSeparators, parseShekelsToAgorot } from './money'
import { formatDisplayDate, isValidIsoDate, todayInJerusalem } from './dates'
import { MESSAGES, validateExpenseInput } from './expenseSchema'
import { CATEGORIES } from './categories'

describe('parseShekelsToAgorot', () => {
  it.each([
    ['0.1', 10],
    ['49.9', 4990],
    ['49.90', 4990],
    ['249.9', 24990],
    ['0.01', 1],
    ['100000', 10_000_000],
    ['100000.00', 10_000_000],
    ['1,250.50', 125050],
    [12.5, 1250],
  ])('parses %s → %i agorot', (input, expected) => {
    expect(parseShekelsToAgorot(input)).toEqual({ ok: true, agorot: expected })
  })

  it.each([
    ['', 'required'],
    ['  ', 'required'],
    ['abc', 'invalid'],
    ['1.2.3', 'invalid'],
    ['1e3', 'invalid'],
    ['1.234', 'tooManyDecimals'],
    ['-5', 'notPositive'],
    ['0', 'notPositive'],
    ['0.00', 'notPositive'],
    ['100000.01', 'tooLarge'],
    ['9999999', 'tooLarge'],
  ])('rejects %s (%s)', (input, error) => {
    expect(parseShekelsToAgorot(input)).toEqual({ ok: false, error })
  })
})

describe('formatting', () => {
  it('formats agorot as shekels with two decimals', () => {
    expect(formatAgorot(4990)).toBe('49.90')
    expect(formatAgorot(1)).toBe('0.01')
    expect(formatAgorot(10_000_000)).toBe('100000.00')
    expect(formatAgorotWithSeparators(10_000_000)).toBe('100,000.00')
    expect(formatAgorotWithSeparators(124990)).toBe('1,249.90')
  })

  it('formats dates as DD/MM/YYYY', () => {
    expect(formatDisplayDate('2026-11-09')).toBe('09/11/2026')
  })
})

describe('dates', () => {
  it('validates real calendar dates only', () => {
    expect(isValidIsoDate('2026-11-09')).toBe(true)
    expect(isValidIsoDate('2024-02-29')).toBe(true)
    expect(isValidIsoDate('2026-02-29')).toBe(false)
    expect(isValidIsoDate('2026-13-01')).toBe(false)
    expect(isValidIsoDate('09/11/2026')).toBe(false)
    expect(isValidIsoDate('')).toBe(false)
  })

  it('computes today in Jerusalem, not UTC', () => {
    // 22:30 UTC on Nov 9 is already Nov 10 in Jerusalem (UTC+2)
    expect(todayInJerusalem(new Date('2026-11-09T22:30:00Z'))).toBe('2026-11-10')
    expect(todayInJerusalem(new Date('2026-11-09T12:00:00Z'))).toBe('2026-11-09')
  })
})

describe('validateExpenseInput', () => {
  const today = '2026-11-09'
  const valid = { category: 'מזון', description: '', amount: '249.90', expenseDate: today }

  it('accepts every category from the fixed list', () => {
    for (const category of CATEGORIES) {
      const result = validateExpenseInput(
        { ...valid, category, description: category === 'אחר' ? 'משהו' : '' },
        today,
      )
      expect(result.ok).toBe(true)
    }
  })

  it('normalizes a valid expense', () => {
    expect(validateExpenseInput({ ...valid, description: '  סופרמרקט ' }, today)).toEqual({
      ok: true,
      value: { kind: 'expense', category: 'מזון', description: 'סופרמרקט', amountAgorot: 24990, expenseDate: today },
    })
    const empty = validateExpenseInput(valid, today)
    expect(empty.ok && empty.value.description).toBeNull()
  })

  it('requires category, amount and date', () => {
    const result = validateExpenseInput({}, today)
    expect(result).toEqual({
      ok: false,
      errors: { category: MESSAGES.categoryRequired, amount: 'יש להזין סכום', expenseDate: MESSAGES.dateInvalid },
    })
  })

  it('rejects an unknown category', () => {
    const result = validateExpenseInput({ ...valid, category: 'חופשה' }, today)
    expect(result.ok).toBe(false)
  })

  it('requires a description for "אחר"', () => {
    const result = validateExpenseInput({ ...valid, category: 'אחר', description: '   ' }, today)
    expect(result).toEqual({ ok: false, errors: { description: MESSAGES.descriptionRequiredForOther } })
  })

  it('rejects invalid amounts', () => {
    for (const amount of ['0', '-1', '100000.01', '1.234', 'abc']) {
      const result = validateExpenseInput({ ...valid, amount }, today)
      expect(result.ok).toBe(false)
    }
  })

  it('rejects future and invalid dates but accepts today and the past', () => {
    expect(validateExpenseInput({ ...valid, expenseDate: '2026-11-10' }, today)).toEqual({
      ok: false,
      errors: { expenseDate: MESSAGES.dateInFuture },
    })
    expect(validateExpenseInput({ ...valid, expenseDate: '2026-02-30' }, today).ok).toBe(false)
    expect(validateExpenseInput({ ...valid, expenseDate: '2020-01-01' }, today).ok).toBe(true)
  })

  it('rejects bodies with wrong types', () => {
    expect(validateExpenseInput({ ...valid, category: 5 }, today).ok).toBe(false)
    expect(validateExpenseInput('not an object', today).ok).toBe(false)
  })
})

describe('record kinds', () => {
  const today = '2026-11-10'
  const base = { category: 'מזון', description: '', amount: '100', expenseDate: '2026-11-01' }

  it('defaults a missing kind to expense', () => {
    const r = validateExpenseInput(base, today)
    expect(r.ok && r.value.kind).toBe('expense')
  })

  it('accepts refund with a category', () => {
    const r = validateExpenseInput({ ...base, kind: 'refund' }, today)
    expect(r).toMatchObject({ ok: true, value: { kind: 'refund', category: 'מזון' } })
  })

  it('stores income without a category, even if one was sent', () => {
    const r = validateExpenseInput({ ...base, kind: 'income', category: 'מזון' }, today)
    expect(r).toMatchObject({ ok: true, value: { kind: 'income', category: null } })
    const none = validateExpenseInput({ ...base, kind: 'income', category: '' }, today)
    expect(none).toMatchObject({ ok: true, value: { kind: 'income', category: null } })
  })

  it('requires a category for expense and refund', () => {
    for (const kind of ['expense', 'refund']) {
      const r = validateExpenseInput({ ...base, kind, category: '' }, today)
      expect(r).toMatchObject({ ok: false, errors: { category: MESSAGES.categoryRequired } })
    }
  })

  it('rejects an unknown kind', () => {
    const r = validateExpenseInput({ ...base, kind: 'gift' }, today)
    expect(r).toMatchObject({ ok: false, errors: { kind: MESSAGES.kindInvalid } })
  })
})
