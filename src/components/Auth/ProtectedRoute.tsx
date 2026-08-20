import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthContext } from '@/contexts/AuthContext'
import { FullPageLoader } from '@/components/common/Spinner'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, loading } = useAuthContext()
  const location = useLocation()

  if (loading) return <FullPageLoader label="Preparing your workspace…" />
  if (!session) return <Navigate to="/signin" replace state={{ from: location }} />

  return <>{children}</>
}