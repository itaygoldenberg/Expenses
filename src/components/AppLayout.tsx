import { NavLink, Outlet, useLocation } from 'react-router'
import { Plus, Wallet } from 'lucide-react'
import { allNav, isNavActive, primaryNav, secondaryNav, type NavItem } from './navItems'

function openAddForm() {
  // TODO(milestone-2): open the transaction form
}

function SideNavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = isNavActive(item, pathname)
  const Icon = item.icon
  return (
    <NavLink
      to={item.to}
      className={`flex h-12 items-center gap-3 rounded-xl px-4 text-base transition ${
        active ? 'bg-primary-light font-semibold text-primary' : 'text-text hover:bg-bg'
      }`}
    >
      <Icon className="size-5" aria-hidden />
      {item.label}
    </NavLink>
  )
}

function TabLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = isNavActive(item, pathname)
  const Icon = item.icon
  return (
    <NavLink
      to={item.to}
      className={`flex flex-1 flex-col items-center justify-center gap-1 text-sm ${
        active ? 'font-semibold text-primary' : 'text-muted'
      }`}
    >
      <Icon className="size-6" aria-hidden />
      {item.label}
    </NavLink>
  )
}

export function AppLayout() {
  const { pathname } = useLocation()

  return (
    <div className="min-h-dvh">
      {/* Desktop: fixed side menu on the right (start side in RTL) */}
      <aside className="hidden md:fixed md:inset-y-0 md:start-0 md:flex md:w-60 md:flex-col md:gap-6 md:border-e md:border-border md:bg-surface md:p-4">
        <div className="flex items-center gap-2 px-2 pt-2">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-white">
            <Wallet className="size-5" aria-hidden />
          </div>
          <span className="text-[22px] font-semibold">הוצאות</span>
        </div>
        <button
          type="button"
          onClick={openAddForm}
          className="flex h-12 items-center justify-center gap-2 rounded-xl bg-primary font-semibold text-white transition hover:bg-green-800"
        >
          <Plus className="size-5" aria-hidden />
          הוספה
        </button>
        <nav className="flex flex-col gap-1">
          {allNav.map((item) => (
            <SideNavLink key={item.to} item={item} pathname={pathname} />
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="px-4 pt-6 pb-[calc(6rem+env(safe-area-inset-bottom))] md:ms-60 md:px-8 md:pt-8 md:pb-8">
        <div className="mx-auto w-full max-w-[960px]">
          <Outlet />
        </div>
      </main>

      {/* Mobile: fixed tab bar at the bottom */}
      <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_12px_rgba(0,0,0,0.05)] md:hidden">
        <div className="flex h-16 items-stretch">
          {primaryNav.map((item) => (
            <TabLink key={item.to} item={item} pathname={pathname} />
          ))}
          <div className="flex flex-1 items-start justify-center">
            <button
              type="button"
              onClick={openAddForm}
              aria-label="הוספה"
              className="-mt-5 flex size-14 items-center justify-center rounded-full bg-primary text-white shadow-lg ring-4 ring-surface transition active:scale-95"
            >
              <Plus className="size-7" aria-hidden />
            </button>
          </div>
          {secondaryNav.map((item) => (
            <TabLink key={item.to} item={item} pathname={pathname} />
          ))}
        </div>
      </nav>
    </div>
  )
}
