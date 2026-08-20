import { Navigate } from 'react-router-dom'
import { useAuthContext } from '@/contexts/AuthContext'
import { FullPageLoader } from '@/components/common/Spinner'
import { AuthForm, AuthLayout } from '@/components/Auth/AuthForm'

export default function SignUpPage() {
  const { session, loading } = useAuthContext()

  if (loading) return <FullPageLoader label="Checking your session…" />
  if (session) return <Navigate to="/dashboard" replace />

  return (
    <AuthLayout title="Create your account" subtitle="Start visualizing your productivity in 3D.">
      <AuthForm mode="signup" />
    </AuthLayout>
  )
}