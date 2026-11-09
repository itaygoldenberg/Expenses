import { NavLink, Outlet } from 'react-router'
import { BarChart3, Filter, Home, Info, type LucideIcon } from 'lucide-react'
import styles from './Layout.module.css'

type NavItem = { to: string; label: string; icon: LucideIcon }

// Order as in the wireframes (right to left in RTL)
const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'בית', icon: Home },
  { to: '/filters', label: 'פילטרים', icon: Filter },
  { to: '/reports', label: 'דו"חות', icon: BarChart3 },
  { to: '/about', label: 'אודות', icon: Info },
]

function Logo() {
  return (
    <svg className={styles.logo} viewBox="0 0 24 24" aria-hidden="true">
      <defs>
        <linearGradient id="logo-gradient" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#22E1FF" />
          <stop offset="0.5" stopColor="#8B7CFF" />
          <stop offset="1" stopColor="#FF3B78" />
        </linearGradient>
      </defs>
      <rect x="3" y="13" width="4" height="8" rx="2" fill="url(#logo-gradient)" />
      <rect x="10" y="8" width="4" height="13" rx="2" fill="url(#logo-gradient)" />
      <rect x="17" y="3" width="4" height="18" rx="2" fill="url(#logo-gradient)" />
    </svg>
  )
}

export function Layout() {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <NavLink to="/" className={styles.brand}>
            <Logo />
            <span>ניהול הוצאות</span>
          </NavLink>
          {/* Desktop: top navigation */}
          <nav className={styles.topNav} aria-label="ניווט ראשי">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => `${styles.topLink} ${isActive ? styles.active : ''}`}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className={styles.main}>
        <Outlet />
      </main>

      {/* Mobile: bottom navigation */}
      <nav className={styles.bottomNav} aria-label="ניווט ראשי">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `${styles.bottomLink} ${isActive ? styles.active : ''}`}
            >
              <Icon size={22} strokeWidth={2} aria-hidden="true" />
              <span>{item.label}</span>
            </NavLink>
          )
        })}
      </nav>
    </div>
  )
}
