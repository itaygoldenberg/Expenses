import type { FieldErrors } from '../../shared/types.js'

export const MAX_BODY_BYTES = 10_000

export function json(data: unknown, status = 200): Response {
  return Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } })
}

export function errorResponse(
  status: number,
  code: string,
  message: string,
  fields?: FieldErrors,
): Response {
  return json({ error: fields ? { code, message, fields } : { code, message } }, status)
}

export const serverError = () =>
  errorResponse(500, 'SERVER_ERROR', 'אירעה שגיאה בשרת. נסו שוב מאוחר יותר.')

export const serviceUnavailable = () =>
  errorResponse(503, 'SERVICE_UNAVAILABLE', 'השירות אינו זמין כרגע. נסו שוב מאוחר יותר.')

export const notFound = () =>
  errorResponse(404, 'NOT_FOUND', 'ההוצאה לא נמצאה')

export const invalidId = () =>
  errorResponse(400, 'INVALID_ID', 'מזהה ההוצאה אינו תקין')

export const methodNotAllowed = () =>
  errorResponse(405, 'METHOD_NOT_ALLOWED', 'פעולה לא נתמכת')

export const noContent = () => new Response(null, { status: 204 })

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isUuid(value: string): boolean {
  return UUID_RE.test(value)
}

/** Last path segment of the request URL, e.g. /api/expenses/<id> → <id> */
export function lastPathSegment(request: Request): string {
  const parts = new URL(request.url).pathname.split('/').filter(Boolean)
  return decodeURIComponent(parts[parts.length - 1] ?? '')
}

/** Logs only an error code/name, never connection strings or query details. */
export function logError(where: string, err: unknown) {
  const code = (err as { code?: unknown })?.code
  console.error(`${where} failed:`, typeof code === 'string' ? code : err instanceof Error ? err.name : 'unknown')
}

/** Reads a JSON body with a size limit. Returns a Response on failure. */
export async function readJsonBody(request: Request): Promise<{ ok: true; body: unknown } | { ok: false; response: Response }> {
  const text = await request.text()
  if (new TextEncoder().encode(text).length > MAX_BODY_BYTES) {
    return { ok: false, response: errorResponse(413, 'PAYLOAD_TOO_LARGE', 'הבקשה גדולה מדי') }
  }
  try {
    return { ok: true, body: JSON.parse(text) }
  } catch {
    return { ok: false, response: errorResponse(400, 'INVALID_JSON', 'גוף הבקשה אינו תקין') }
  }
}
