import { Navigate, Outlet } from 'react-router'
import { useAuth } from './AuthProvider'
import { FullPageLoader } from '../../components/FullPageLoader'

/** Renders child routes only for a signed-in user; otherwise redirects to /login. */
export function RequireAuth() {
  const { session, loading } = useAuth()
  if (loading) return <FullPageLoader />
  if (!session) return <Navigate to="/login" replace />
  return <Outlet />
}
