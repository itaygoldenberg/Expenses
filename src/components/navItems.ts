import { List, Menu, PieChart, Repeat, type LucideIcon } from 'lucide-react'

export type NavItem = {
  to: string
  label: string
  icon: LucideIcon
  /** Extra paths that should mark this tab as active (screens reached through it). */
  alsoActiveFor?: string[]
}

// Order is right-to-left as displayed (RTL). The "add" button sits between the two groups.
export const primaryNav: NavItem[] = [
  { to: '/', label: 'סיכום', icon: PieChart },
  { to: '/transactions', label: 'רישומים', icon: List },
]

export const secondaryNav: NavItem[] = [
  { to: '/recurring', label: 'קבועות', icon: Repeat },
  { to: '/more', label: 'עוד', icon: Menu, alsoActiveFor: ['/categories', '/import'] },
]

export const allNav: NavItem[] = [...primaryNav, ...secondaryNav]

export function isNavActive(item: NavItem, pathname: string): boolean {
  if (item.to === '/') return pathname === '/'
  const paths = [item.to, ...(item.alsoActiveFor ?? [])]
  return paths.some((p) => pathname === p || pathname.startsWith(p + '/'))
}
