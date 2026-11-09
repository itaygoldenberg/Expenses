import { describe, expect, it } from 'vitest'
import {
  CONNECTION_ERROR_MESSAGE,
  INVALID_CREDENTIALS_MESSAGE,
  loginErrorMessage,
} from './authErrors'

describe('loginErrorMessage', () => {
  it('returns null when there is no error', () => {
    expect(loginErrorMessage(null)).toBeNull()
    expect(loginErrorMessage(undefined)).toBeNull()
  })

  it('maps invalid credentials to the wrong email/password message', () => {
    expect(loginErrorMessage({ code: 'invalid_credentials', status: 400 })).toBe(
      INVALID_CREDENTIALS_MESSAGE,
    )
    expect(loginErrorMessage({ status: 400 })).toBe(INVALID_CREDENTIALS_MESSAGE)
    expect(loginErrorMessage({ message: 'Invalid login credentials' })).toBe(
      INVALID_CREDENTIALS_MESSAGE,
    )
  })

  it('maps network and unknown errors to the connection message', () => {
    expect(loginErrorMessage({ message: 'Failed to fetch', status: 0 })).toBe(
      CONNECTION_ERROR_MESSAGE,
    )
    expect(loginErrorMessage({ status: 500, message: 'Server error' })).toBe(
      CONNECTION_ERROR_MESSAGE,
    )
  })
})
