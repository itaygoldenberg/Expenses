import { useState } from 'react'
import { Outlet } from 'react-router'
import { ExpensesProvider, useExpensesData } from '../features/expenses/ExpensesProvider'
import { AmbientBackground } from './AmbientBackground'
import { Sidebar } from './Sidebar'
import { MobileHeader } from './MobileHeader'
import { TabBar } from './TabBar'
import { MoreSheet } from './MoreSheet'
import styles from './AppShell.module.css'

/**
 * Page frame: ambient background, sidebar (tablet / desktop), header + tab bar (phone),
 * and the page itself in <main>. The shared records and the "add" sheet live here.
 */
export function AppShell() {
  return (
    <ExpensesProvider>
      <Frame />
    </ExpensesProvider>
  )
}

function Frame() {
  const { openAdd } = useExpensesData()
  const [moreOpen, setMoreOpen] = useState(false)

  return (
    <div className={styles.shell}>
      <a href="#main" className="skip-link">
        דלג לתוכן
      </a>
      <AmbientBackground />
      <Sidebar onAdd={openAdd} />
      <div className={styles.column}>
        <MobileHeader />
        <main id="main" tabIndex={-1} className={styles.main}>
          <Outlet />
        </main>
      </div>
      <TabBar onAdd={openAdd} onMore={() => setMoreOpen(true)} moreOpen={moreOpen} />
      {moreOpen && <MoreSheet onClose={() => setMoreOpen(false)} />}
    </div>
  )
}
