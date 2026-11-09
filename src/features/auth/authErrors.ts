export const INVALID_CREDENTIALS_MESSAGE = 'אימייל או סיסמה שגויים'
export const CONNECTION_ERROR_MESSAGE = 'לא הצלחנו להתחבר — בדוק את החיבור לאינטרנט ונסה שוב'

type AuthErrorLike = { code?: string; status?: number; message?: string } | null | undefined

/** Maps a Supabase sign-in error to a Hebrew message for the login screen. */
export function loginErrorMessage(error: AuthErrorLike): string | null {
  if (!error) return null
  if (
    error.code === 'invalid_credentials' ||
    error.status === 400 ||
    /invalid login credentials/i.test(error.message ?? '')
  ) {
    return INVALID_CREDENTIALS_MESSAGE
  }
  return CONNECTION_ERROR_MESSAGE
}
