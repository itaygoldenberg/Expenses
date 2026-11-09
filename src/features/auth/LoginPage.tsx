import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { Wallet } from 'lucide-react'
import { useAuth } from './AuthProvider'
import { FullPageLoader } from '../../components/FullPageLoader'

const inputClass =
  'h-12 w-full rounded-xl border border-border bg-surface px-4 text-base outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-light'

export function LoginPage() {
  const { session, loading, signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (loading) return <FullPageLoader />
  if (session) return <Navigate to="/" replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const message = await signIn(email.trim(), password)
    setSubmitting(false)
    if (message) {
      setError(message)
    } else {
      navigate('/', { replace: true })
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-primary text-white shadow-md">
            <Wallet className="size-8" aria-hidden />
          </div>
          <h1 className="text-[32px] font-bold text-text">הוצאות</h1>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 rounded-2xl bg-surface p-6 shadow-[0_2px_12px_rgba(0,0,0,0.06)]"
        >
          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-muted">אימייל</span>
            <input
              type="email"
              dir="ltr"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`${inputClass} text-left`}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-muted">סיסמה</span>
            <input
              type="password"
              dir="ltr"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${inputClass} text-left`}
            />
          </label>

          {error && (
            <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-expense">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="h-12 w-full rounded-xl bg-primary text-base font-semibold text-white transition hover:bg-green-800 disabled:opacity-60"
          >
            {submitting ? 'מתחבר…' : 'כניסה'}
          </button>
        </form>
      </div>
    </main>
  )
}
