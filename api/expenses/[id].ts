import { getDb, isConstraintViolation } from '../_lib/db.js'
import {
  errorResponse,
  invalidId,
  isUuid,
  json,
  lastPathSegment,
  logError,
  noContent,
  notFound,
  readJsonBody,
  serverError,
  serviceUnavailable,
} from '../_lib/http.js'
import { rowToExpense, type ExpenseRow } from '../_lib/expenseRow.js'
import { validateExpenseInput } from '../../shared/expenseSchema.js'
import { todayInJerusalem } from '../../shared/dates.js'

// PUT /api/expenses/:id — replace the editable fields of an existing expense
export async function PUT(request: Request): Promise<Response> {
  const id = lastPathSegment(request)
  if (!isUuid(id)) return invalidId()

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
    logError('PUT /api/expenses/:id (config)', err)
    return serverError()
  }
  const v = result.value
  try {
    const rows = await sql<ExpenseRow[]>`
      update public.expenses
      set category = ${v.category},
          description = ${v.description},
          amount_agorot = ${v.amountAgorot},
          expense_date = ${v.expenseDate},
          kind = ${v.kind}
      where id = ${id}
      returning id, kind, category, description, amount_agorot, to_char(expense_date, 'YYYY-MM-DD') as expense_date
    `
    if (rows.length === 0) return notFound()
    return json(rowToExpense(rows[0]))
  } catch (err) {
    logError('PUT /api/expenses/:id', err)
    if (isConstraintViolation(err)) {
      return errorResponse(400, 'VALIDATION_ERROR', 'נתוני ההוצאה אינם תקינים')
    }
    return serviceUnavailable()
  }
}

// DELETE /api/expenses/:id
export async function DELETE(request: Request): Promise<Response> {
  const id = lastPathSegment(request)
  if (!isUuid(id)) return invalidId()

  let sql
  try {
    sql = getDb()
  } catch (err) {
    logError('DELETE /api/expenses/:id (config)', err)
    return serverError()
  }
  try {
    const rows = await sql<{ id: string }[]>`
      delete from public.expenses where id = ${id} returning id
    `
    if (rows.length === 0) return notFound()
    return noContent()
  } catch (err) {
    logError('DELETE /api/expenses/:id', err)
    return serviceUnavailable()
  }
}
