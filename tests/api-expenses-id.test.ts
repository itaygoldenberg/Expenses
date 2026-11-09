import { beforeEach, describe, expect, it, vi } from 'vitest'

// Fake tagged-template SQL function; each test sets what it returns.
const db = vi.hoisted(() => ({
  rows: [] as unknown[],
  error: null as unknown,
  configError: false,
  lastValues: null as unknown[] | null,
  lastQuery: '' as string,
}))

vi.mock('../api/_lib/db.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api/_lib/db')>()
  return {
    ...actual,
    getDb: () => {
      if (db.configError) throw new Error('Missing DATABASE_URL')
      return (strings: TemplateStringsArray, ...values: unknown[]) => {
        db.lastValues = values
        db.lastQuery = strings.join('?')
        return db.error ? Promise.reject(db.error) : Promise.resolve(db.rows)
      }
    },
  }
})

const { PUT, DELETE } = await import('../api/expenses/[id]')

const ID = '05af603f-25ed-424c-9010-1f9d27293e44'
const url = (id: string) => `http://localhost/api/expenses/${id}`
const put = (id: string, body: unknown) =>
  PUT(new Request(url(id), { method: 'PUT', body: typeof body === 'string' ? body : JSON.stringify(body) }))
const del = (id: string) => DELETE(new Request(url(id), { method: 'DELETE' }))

const validBody = { category: 'דלק', description: 'תדלוק', amount: '180', expenseDate: '2026-11-06' }
const row = { id: ID, category: 'דלק', description: 'תדלוק', amount_agorot: 18000, expense_date: '2026-11-06' }

beforeEach(() => {
  db.rows = []
  db.error = null
  db.configError = false
  db.lastValues = null
  db.lastQuery = ''
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('PUT /api/expenses/:id', () => {
  it('updates an existing expense and returns it', async () => {
    db.rows = [row]
    const res = await put(ID, validBody)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      id: ID,
      category: 'דלק',
      description: 'תדלוק',
      amount: '180.00',
      expenseDate: '2026-11-06',
    })
    expect(db.lastValues).toEqual(['דלק', 'תדלוק', 18000, '2026-11-06', ID])
    expect(db.lastQuery).toContain('update public.expenses')
  })

  it('returns 404 when the expense does not exist', async () => {
    db.rows = []
    const res = await put(ID, validBody)
    expect(res.status).toBe(404)
    expect((await res.json()).error.code).toBe('NOT_FOUND')
  })

  it('rejects an invalid id without touching the database', async () => {
    const res = await put('not-a-uuid', validBody)
    expect(res.status).toBe(400)
    expect((await res.json()).error.code).toBe('INVALID_ID')
    expect(db.lastValues).toBeNull()
  })

  it.each([
    ['"אחר" without description', { ...validBody, category: 'אחר', description: ' ' }, 'description'],
    ['zero amount', { ...validBody, amount: '0' }, 'amount'],
    ['amount over 100,000', { ...validBody, amount: '100000.01' }, 'amount'],
    ['three decimals', { ...validBody, amount: '1.234' }, 'amount'],
    ['future date', { ...validBody, expenseDate: '2999-01-01' }, 'expenseDate'],
    ['missing category', { ...validBody, category: '' }, 'category'],
  ])('rejects %s with 400 and does not save', async (_name, body, field) => {
    const res = await put(ID, body)
    expect(res.status).toBe(400)
    expect((await res.json()).error.fields[field]).toBeTruthy()
    expect(db.lastValues).toBeNull()
  })

  it('maps database failures without leaking details', async () => {
    db.error = Object.assign(new Error('secret internals'), { code: '08006' })
    const res = await put(ID, validBody)
    expect(res.status).toBe(503)
    expect(JSON.stringify(await res.json())).not.toContain('internals')
  })
})

describe('DELETE /api/expenses/:id', () => {
  it('deletes an existing expense with 204', async () => {
    db.rows = [{ id: ID }]
    const res = await del(ID)
    expect(res.status).toBe(204)
    expect(await res.text()).toBe('')
    expect(db.lastValues).toEqual([ID])
    expect(db.lastQuery).toContain('delete from public.expenses')
  })

  it('returns 404 when the expense does not exist', async () => {
    db.rows = []
    expect((await del(ID)).status).toBe(404)
  })

  it('rejects an invalid id', async () => {
    expect((await del('123')).status).toBe(400)
    expect(db.lastValues).toBeNull()
  })

  it('returns 503 on database failure and 500 on missing config', async () => {
    db.error = Object.assign(new Error('down'), { code: 'CONNECT_TIMEOUT' })
    expect((await del(ID)).status).toBe(503)
    db.error = null
    db.configError = true
    expect((await del(ID)).status).toBe(500)
  })
})
