import { Navigate, Route, Routes } from 'react-router'
import { RequireAuth } from './features/auth/RequireAuth'
import { LoginPage } from './features/auth/LoginPage'
import { AppLayout } from './components/AppLayout'
import { MorePage } from './components/MorePage'
import { PageTitle } from './components/PageTitle'

// Placeholder screens — their content is built in later milestones.
const SummaryPage = () => <PageTitle>סיכום</PageTitle>
const TransactionsPage = () => <PageTitle>רישומים</PageTitle>
const RecurringPage = () => <PageTitle>הוצאות קבועות</PageTitle>
const CategoriesPage = () => <PageTitle>קטגוריות</PageTitle>
const ImportPage = () => <PageTitle>ייבוא קובץ</PageTitle>

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route index element={<SummaryPage />} />
          <Route path="transactions" element={<TransactionsPage />} />
          <Route path="recurring" element={<RecurringPage />} />
          <Route path="more" element={<MorePage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="import" element={<ImportPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
