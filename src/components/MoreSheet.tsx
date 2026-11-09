import { NavLink } from 'react-router'
import { ChevronLeft } from 'lucide-react'
import { Sheet } from '../ui/Modal'
import { SECONDARY_NAV } from './navigation'
import styles from './MoreSheet.module.css'

/** Phone "עוד" sheet: secondary pages (later also import, history, profile, sign out). */
export function MoreSheet({ onClose }: { onClose: () => void }) {
  return (
    <Sheet title="עוד" onClose={onClose}>
      <nav aria-label="ניווט משני">
        <ul className={styles.list}>
          {SECONDARY_NAV.map((item) => {
            const Icon = item.icon
            return (
              <li key={item.to}>
                <NavLink to={item.to} viewTransition className={styles.item} onClick={onClose}>
                  <Icon size={22} strokeWidth={1.8} aria-hidden="true" />
                  <span>{item.label}</span>
                  <ChevronLeft size={18} aria-hidden="true" className={styles.chevron} />
                </NavLink>
              </li>
            )
          })}
        </ul>
      </nav>
    </Sheet>
  )
}
