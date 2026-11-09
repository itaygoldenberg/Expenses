import { Link, useNavigate } from 'react-router'
import { ChevronLeft, FileUp, LogOut, Tags, type LucideIcon } from 'lucide-react'
import { PageTitle } from './PageTitle'
import { useAuth } from '../features/auth/AuthProvider'

const rowClass = 'flex min-h-14 w-full items-center gap-3 px-4 text-base transition hover:bg-bg'

function RowContent({
  icon: Icon,
  label,
  danger,
}: {
  icon: LucideIcon
  label: string
  danger?: boolean
}) {
  return (
    <>
      <Icon className={`size-5 ${danger ? 'text-expense' : 'text-muted'}`} aria-hidden />
      <span className={`flex-1 text-start ${danger ? 'text-expense' : ''}`}>{label}</span>
      {!danger && <ChevronLeft className="size-5 text-muted" aria-hidden />}
    </>
  )
}

export function MorePage() {
  const { signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <>
      <PageTitle>עוד</PageTitle>
      <div className="divide-y divide-border overflow-hidden rounded-2xl bg-surface shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
        <Link to="/categories" className={rowClass}>
          <RowContent icon={Tags} label="קטגוריות" />
        </Link>
        <Link to="/import" className={rowClass}>
          <RowContent icon={FileUp} label="ייבוא קובץ" />
        </Link>
        <button type="button" onClick={handleSignOut} className={rowClass}>
          <RowContent icon={LogOut} label="התנתקות" danger />
        </button>
      </div>
    </>
  )
}
