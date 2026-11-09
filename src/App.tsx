import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router'
import { AppShell } from './components/AppShell'
import { HomePage } from './pages/HomePage'
import { ExpensesPage } from './pages/ExpensesPage'
import { AboutPage } from './pages/AboutPage'
import { Skeleton } from './ui'

// The reports page pulls in the chart and PDF libraries; load it only when the page is opened
const ReportsPage = lazy(() => import('./pages/ReportsPage').then((m) => ({ default: m.ReportsPage })))

// Internal component gallery: only in local development (the condition removes it from the production build)
const DesignSystemPage = import.meta.env.DEV
  ? lazy(() => import('./pages/DesignSystemPage').then((m) => ({ default: m.DesignSystemPage })))
  : null

export function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<HomePage />} />
        <Route path="expenses" element={<ExpensesPage />} />
        {/* The filters page was merged into the expenses page */}
        <Route path="filters" element={<Navigate to="/expenses" replace />} />
        <Route
          path="reports"
          element={
            <Suspense fallback={<Skeleton variant="block" />}>
              <ReportsPage />
            </Suspense>
          }
        />
        <Route path="about" element={<AboutPage />} />
        {DesignSystemPage && (
          <Route
            path="design-system"
            element={
              <Suspense fallback={<Skeleton variant="block" />}>
                <DesignSystemPage />
              </Suspense>
            }
          />
        )}
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
