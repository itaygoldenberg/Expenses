import type { ApiError, Expense, ExpenseInput, FieldErrors } from '../../shared/types'

/** Thrown for any failed API call. `fields` is set for server-side validation errors. */
export class ApiRequestError extends Error {
  readonly fields?: FieldErrors
  readonly status: number

  constructor(message: string, status: number, fields?: FieldErrors) {
    super(message)
    this.status = status
    this.fields = fields
  }
}

const REQUEST_TIMEOUT_MS = 15_000

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(path, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init?.headers },
      // Never leave the user waiting forever on a stuck request
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
  } catch {
    // Network failure (offline, server down) or timeout
    throw new ApiRequestError('network', 0)
  }

  if (!response.ok) {
    let body: ApiError | null = null
    try {
      body = (await response.json()) as ApiError
    } catch {
      // Non-JSON error body
    }
    throw new ApiRequestError(body?.error.message ?? 'error', response.status, body?.error.fields)
  }
  return (await response.json()) as T
}

export function fetchExpenses(): Promise<Expense[]> {
  return request<Expense[]>('/api/expenses')
}

export function createExpense(input: ExpenseInput): Promise<Expense> {
  return request<Expense>('/api/expenses', { method: 'POST', body: JSON.stringify(input) })
}
