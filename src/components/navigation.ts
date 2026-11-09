import { BarChart3, Home, Info, ListChecks, type LucideIcon } from 'lucide-react'

export type NavItem = { to: string; label: string; icon: LucideIcon }

/**
 * Navigation items, in one place for the sidebar, the phone tab bar and the "more" sheet.
 * Later milestones add items here (dashboard, import, history, profile).
 */
export const PRIMARY_NAV: NavItem[] = [
  { to: '/', label: 'ראשי', icon: Home },
  { to: '/expenses', label: 'הוצאות', icon: ListChecks },
  { to: '/reports', label: 'דו"חות', icon: BarChart3 },
]

/** Secondary items: bottom of the sidebar, and the "עוד" sheet on phones. */
export const SECONDARY_NAV: NavItem[] = [{ to: '/about', label: 'אודות', icon: Info }]

export const ADD_LABEL = 'הוספת רישום'
