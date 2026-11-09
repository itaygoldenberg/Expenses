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
