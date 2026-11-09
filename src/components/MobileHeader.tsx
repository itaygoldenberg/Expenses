import { NavLink } from 'react-router'
import { Logo } from './Logo'
import styles from './MobileHeader.module.css'

/** Phone only: thin glass header with the app name. */
export function MobileHeader() {
  return (
    <header className={`glass-1 ${styles.header}`}>
      <NavLink to="/" className={styles.brand} viewTransition>
        <Logo size={26} />
        <span>ניהול הוצאות</span>
      </NavLink>
    </header>
  )
}
