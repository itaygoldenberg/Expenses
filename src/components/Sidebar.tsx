import { NavLink } from 'react-router'
import { Plus } from 'lucide-react'
import { Tooltip } from '../ui/Tooltip'
import { Logo } from './Logo'
import { ADD_LABEL, PRIMARY_NAV, SECONDARY_NAV, type NavItem } from './navigation'
import styles from './Sidebar.module.css'

function SideLink({ item }: { item: NavItem }) {
  const Icon = item.icon
  return (
    <Tooltip content={item.label} placement="start">
      <NavLink
        to={item.to}
        end={item.to === '/'}
        viewTransition
        className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}
      >
        <Icon size={22} strokeWidth={1.8} aria-hidden="true" />
        <span className={styles.text}>{item.label}</span>
      </NavLink>
    </Tooltip>
  )
}

/** Tablet: 76px icon rail with tooltips. Desktop: 260px sidebar with labels. Hidden on phones. */
export function Sidebar({ onAdd }: { onAdd: () => void }) {
  return (
    <aside className={`glass-1 ${styles.sidebar}`}>
      <NavLink to="/" className={styles.brand} viewTransition aria-label="ניהול הוצאות — דף הבית">
        <Logo size={30} />
        <span className={styles.text}>ניהול הוצאות</span>
      </NavLink>

      <Tooltip content={ADD_LABEL} placement="start">
        <button type="button" className={styles.add} onClick={onAdd}>
          <Plus size={22} strokeWidth={2.2} aria-hidden="true" />
          <span className={styles.text}>הוספה</span>
        </button>
      </Tooltip>

      <nav aria-label="ניווט ראשי" className={styles.nav}>
        {PRIMARY_NAV.map((item) => (
          <SideLink key={item.to} item={item} />
        ))}
      </nav>

      <nav aria-label="ניווט משני" className={`${styles.nav} ${styles.bottom}`}>
        {SECONDARY_NAV.map((item) => (
          <SideLink key={item.to} item={item} />
        ))}
      </nav>
    </aside>
  )
}
