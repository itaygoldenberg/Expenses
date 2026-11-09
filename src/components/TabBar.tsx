import { NavLink } from 'react-router'
import { MoreHorizontal, Plus } from 'lucide-react'
import { ADD_LABEL, PRIMARY_NAV, type NavItem } from './navigation'
import styles from './TabBar.module.css'

function Tab({ item }: { item: NavItem }) {
  const Icon = item.icon
  return (
    <NavLink
      to={item.to}
      end={item.to === '/'}
      viewTransition
      className={({ isActive }) => `${styles.tab} ${isActive ? styles.active : ''}`}
    >
      <Icon size={22} strokeWidth={1.8} aria-hidden="true" />
      <span>{item.label}</span>
    </NavLink>
  )
}

type Props = { onAdd: () => void; onMore: () => void; moreOpen: boolean }

/** Phone only: bottom glass tab bar — ראשי · הוצאות · ➕ · דו"חות · עוד. */
export function TabBar({ onAdd, onMore, moreOpen }: Props) {
  const [home, expenses, reports] = PRIMARY_NAV
  return (
    <nav className={`glass-1 ${styles.bar}`} aria-label="ניווט ראשי (טלפון)">
      <Tab item={home} />
      <Tab item={expenses} />
      <button type="button" className={styles.add} onClick={onAdd} aria-label={ADD_LABEL}>
        <Plus size={26} strokeWidth={2.4} aria-hidden="true" />
      </button>
      <Tab item={reports} />
      <button
        type="button"
        className={styles.tab}
        onClick={onMore}
        aria-haspopup="dialog"
        aria-expanded={moreOpen}
      >
        <MoreHorizontal size={22} strokeWidth={1.8} aria-hidden="true" />
        <span>עוד</span>
      </button>
    </nav>
  )
}
