import { Navigate } from 'react-router-dom'
import { useAuthContext } from '@/contexts/AuthContext'
import { FullPageLoader } from '@/components/common/Spinner'
import { AuthForm, AuthLayout } from '@/components/Auth/AuthForm'

export default function SignInPage() {
  const { session, loading } = useAuthContext()

  if (loading) return <FullPageLoader label="Checking your session…" />
  if (session) return <Navigate to="/dashboard" replace />

  return (
    <AuthLayout title="Welcome back">
      <AuthForm mode="signin" />
    </AuthLayout>
  )
}