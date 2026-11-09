import { getDb, isConstraintViolation } from '../_lib/db.js'
import { errorResponse, json, readJsonBody, serverError, serviceUnavailable } from '../_lib/http.js'
import { rowToExpense, type ExpenseRow } from '../_lib/expenseRow.js'
import { validateExpenseInput } from '../../shared/expenseSchema.js'
import { todayInJerusalem } from '../../shared/dates.js'

function logError(where: string, err: unknown) {
  // Log only the error code/name, never connection strings or query details
  const code = (err as { code?: unknown })?.code
  console.error(`${where} failed:`, typeof code === 'string' ? code : err instanceof Error ? err.name : 'unknown')
}

// GET /api/expenses — all expenses, newest first
export async function GET(): Promise<Response> {
  let sql
  try {
    sql = getDb()
  } catch (err) {
    logError('GET /api/expenses (config)', err)
    return serverError()
  }
  try {
    const rows = await sql<ExpenseRow[]>`
      select id, category, description, amount_agorot, to_char(expense_date, 'YYYY-MM-DD') as expense_date
      from public.expenses
      order by expenses.expense_date desc, expenses.created_at desc
    `
    return json(rows.map(rowToExpense))
  } catch (err) {
    logError('GET /api/expenses', err)
    return serviceUnavailable()
  }
}

// POST /api/expenses — validate on the server, then insert
export async function POST(request: Request): Promise<Response> {
  const body = await readJsonBody(request)
  if (!body.ok) return body.response

  const result = validateExpenseInput(body.body, todayInJerusalem())
  if (!result.ok) {
    return errorResponse(400, 'VALIDATION_ERROR', 'נתוני ההוצאה אינם תקינים', result.errors)
  }

  let sql
  try {
    sql = getDb()
  } catch (err) {
    logError('POST /api/expenses (config)', err)
    return serverError()
  }
  const v = result.value
  try {
    const [row] = await sql<ExpenseRow[]>`
      insert into public.expenses (category, description, amount_agorot, expense_date)
      values (${v.category}, ${v.description}, ${v.amountAgorot}, ${v.expenseDate})
      returning id, category, description, amount_agorot, to_char(expense_date, 'YYYY-MM-DD') as expense_date
    `
    return json(rowToExpense(row), 201)
  } catch (err) {
    logError('POST /api/expenses', err)
    if (isConstraintViolation(err)) {
      return errorResponse(400, 'VALIDATION_ERROR', 'נתוני ההוצאה אינם תקינים')
    }
    return serviceUnavailable()
  }
}
