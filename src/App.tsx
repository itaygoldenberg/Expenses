import { Navigate, Route, Routes } from 'react-router'
import { Layout } from './components/Layout'
import { HomePage } from './pages/HomePage'

// Placeholder pages — their content is built in Milestones 3–5.
const FiltersPage = () => <h1>סינון הוצאות</h1>
const ReportsPage = () => <h1>דו"חות וניתוח הוצאות</h1>
const AboutPage = () => <h1>אודות המערכת</h1>

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="filters" element={<FiltersPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="about" element={<AboutPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
