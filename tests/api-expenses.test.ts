import { beforeEach, describe, expect, it, vi } from 'vitest'
import { todayInJerusalem } from '../shared/dates'

// Fake tagged-template SQL function; each test sets what it returns.
const db = vi.hoisted(() => ({
  rows: [] as unknown[],
  error: null as unknown,
  configError: false,
  lastValues: null as unknown[] | null,
}))

vi.mock('../api/_lib/db.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api/_lib/db')>()
  return {
    ...actual,
    getDb: () => {
      if (db.configError) throw new Error('Missing DATABASE_URL')
      return (_strings: TemplateStringsArray, ...values: unknown[]) => {
        db.lastValues = values
        return db.error ? Promise.reject(db.error) : Promise.resolve(db.rows)
      }
    },
  }
})

const { GET, POST } = await import('../api/expenses/index')

const post = (body: unknown) =>
  POST(
    new Request('http://localhost/api/expenses', {
      method: 'POST',
      body: typeof body === 'string' ? body : JSON.stringify(body),
    }),
  )

const validBody = { category: 'מזון', description: 'סופרמרקט', amount: '249.9', expenseDate: '2026-01-15' }

beforeEach(() => {
  db.rows = []
  db.error = null
  db.configError = false
  db.lastValues = null
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('GET /api/expenses', () => {
  it('returns expenses with amounts converted from agorot', async () => {
    db.rows = [{ id: 'a', category: 'דלק', description: null, amount_agorot: 18000, expense_date: '2026-11-06' }]
    const res = await GET()
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([
      { id: 'a', category: 'דלק', description: null, amount: '180.00', expenseDate: '2026-11-06' },
    ])
  })

  it('returns an empty list when there are no expenses', async () => {
    const res = await GET()
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([])
  })

  it('returns 503 without leaking database details', async () => {
    db.error = Object.assign(new Error('password authentication failed for user app_backend'), { code: '28P01' })
    const res = await GET()
    expect(res.status).toBe(503)
    expect(JSON.stringify(await res.json())).not.toContain('app_backend')
  })

  it('returns 500 when the server is misconfigured', async () => {
    db.configError = true
    const res = await GET()
    expect(res.status).toBe(500)
    expect(JSON.stringify(await res.json())).not.toContain('DATABASE_URL')
  })
})

describe('POST /api/expenses', () => {
  it('creates a valid expense and stores agorot', async () => {
    db.rows = [{ id: 'n', category: 'מזון', description: 'סופרמרקט', amount_agorot: 24990, expense_date: '2026-01-15' }]
    const res = await post(validBody)
    expect(res.status).toBe(201)
    expect(db.lastValues).toEqual(['מזון', 'סופרמרקט', 24990, '2026-01-15', 'expense'])
    expect(await res.json()).toMatchObject({ id: 'n', amount: '249.90' })
  })

  it.each([
    ['missing category', { ...validBody, category: '' }, 'category'],
    ['unknown category', { ...validBody, category: 'חופשה' }, 'category'],
    ['"אחר" without description', { ...validBody, category: 'אחר', description: '' }, 'description'],
    ['zero amount', { ...validBody, amount: '0' }, 'amount'],
    ['negative amount', { ...validBody, amount: '-10' }, 'amount'],
    ['amount over 100,000', { ...validBody, amount: '100000.01' }, 'amount'],
    ['three decimals', { ...validBody, amount: '1.234' }, 'amount'],
    ['missing date', { ...validBody, expenseDate: '' }, 'expenseDate'],
    ['invalid date', { ...validBody, expenseDate: '2026-02-30' }, 'expenseDate'],
  ])('rejects %s with 400', async (_name, body, field) => {
    const res = await post(body)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error.code).toBe('VALIDATION_ERROR')
    expect(json.error.fields[field]).toBeTruthy()
    expect(db.lastValues).toBeNull()
  })

  it('rejects a future date (tomorrow in Jerusalem)', async () => {
    const tomorrow = new Date(`${todayInJerusalem()}T12:00:00Z`)
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
    const res = await post({ ...validBody, expenseDate: tomorrow.toISOString().slice(0, 10) })
    expect(res.status).toBe(400)
    expect(db.lastValues).toBeNull()
  })

  it('rejects malformed JSON and oversized bodies', async () => {
    expect((await post('{not json')).status).toBe(400)
    expect((await post({ ...validBody, description: 'x'.repeat(20_000) })).status).toBe(413)
  })

  it('maps database constraint errors to 400 and other errors to 503', async () => {
    db.error = Object.assign(new Error('check violation'), { code: '23514' })
    expect((await post(validBody)).status).toBe(400)
    db.error = Object.assign(new Error('connect failed'), { code: 'CONNECT_TIMEOUT' })
    expect((await post(validBody)).status).toBe(503)
  })
})

describe('POST /api/expenses — record kinds', () => {
  it('stores income without a category and returns its kind', async () => {
    db.rows = [{ id: 'i', kind: 'income', category: null, description: 'משכורת', amount_agorot: 1200000, expense_date: '2026-01-15' }]
    const res = await POST(
      new Request('http://localhost/api/expenses', {
        method: 'POST',
        body: JSON.stringify({ kind: 'income', category: 'מזון', description: 'משכורת', amount: '12000', expenseDate: '2026-01-15' }),
      }),
    )
    expect(res.status).toBe(201)
    expect(db.lastValues).toEqual([null, 'משכורת', 1200000, '2026-01-15', 'income'])
    expect(await res.json()).toMatchObject({ kind: 'income', category: null, amount: '12000.00' })
  })

  it('rejects an unknown kind with a field error', async () => {
    const res = await POST(
      new Request('http://localhost/api/expenses', {
        method: 'POST',
        body: JSON.stringify({ kind: 'gift', category: 'מזון', amount: '1', expenseDate: '2026-01-15' }),
      }),
    )
    expect(res.status).toBe(400)
    expect((await res.json()).error.fields).toHaveProperty('kind')
  })
})
