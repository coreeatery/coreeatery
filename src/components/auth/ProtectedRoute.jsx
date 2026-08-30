import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../app/providers/useAuth'

export default function ProtectedRoute({ allowedRoles }) {
  const { user, profile, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Memuat...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    )
  }

  if (!profile || !profile.is_active) {
    return <Navigate to="/unauthorized" replace />
  }

  if (
    allowedRoles?.length &&
    !allowedRoles.includes(profile.role)
  ) {
    return <Navigate to="/unauthorized" replace />
  }

  return <Outlet />
}
