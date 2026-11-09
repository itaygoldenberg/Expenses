import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router'
import { Layout } from './components/Layout'
import { HomePage } from './pages/HomePage'
import { FiltersPage } from './pages/FiltersPage'
import { AboutPage } from './pages/AboutPage'

// The reports page pulls in the chart library; load it only when the page is opened
const ReportsPage = lazy(() => import('./pages/ReportsPage').then((m) => ({ default: m.ReportsPage })))

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="filters" element={<FiltersPage />} />
        <Route
          path="reports"
          element={
            <Suspense fallback={<p role="status">טוען נתונים…</p>}>
              <ReportsPage />
            </Suspense>
          }
        />
        <Route path="about" element={<AboutPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
