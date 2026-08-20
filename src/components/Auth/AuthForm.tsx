import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Boxes, Eye, EyeOff, Lock, Mail, User } from 'lucide-react'
import { useAuthContext } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/useToast'
import { Spinner } from '@/components/common/Spinner'
import VantaNetBackground from '@/components/VantaNetBackground'

interface AuthFormProps {
  mode: 'signin' | 'signup'
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
}
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
}

export function AuthForm({ mode }: AuthFormProps) {
  const { signIn, signUp } = useAuthContext()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isSignup = mode === 'signup'

  const validate = (): string | null => {
    if (!email.trim()) return 'Email is required.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Please enter a valid email address.'
    if (password.length < 6) return 'Password must be at least 6 characters.'
    if (isSignup) {
      if (!fullName.trim()) return 'Full name is required.'
      if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter.'
      if (!/[0-9]/.test(password)) return 'Password must contain at least one number.'
      if (password !== confirm) return 'Passwords do not match.'
    }
    return null
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }
    setLoading(true)
    const res = isSignup
      ? await signUp(email.trim(), password, fullName.trim())
      : await signIn(email.trim(), password)
    setLoading(false)
    if (res.error) {
      setError(res.error)
      toast(res.error, 'error')
      return
    }
    toast(isSignup ? 'Account created successfully' : 'Signed in successfully')
    navigate('/dashboard')
  }

  return (
    <motion.form
      variants={container}
      initial="hidden"
      animate="show"
      onSubmit={handleSubmit}
      className="flex flex-col gap-4"
      noValidate
    >
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500"
          role="alert"
        >
          {error}
        </motion.div>
      )}

      {isSignup && (
        <motion.div variants={item}>
          <label className="label" htmlFor="full-name">
            Full name
          </label>
          <div className="relative">
            <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="full-name"
              type="text"
              className="input pl-10"
              placeholder="Ada Lovelace"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              autoComplete="name"
            />
          </div>
        </motion.div>
      )}

      <motion.div variants={item}>
        <label className="label" htmlFor="email">
          Email
        </label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            id="email"
            type="email"
            className="input pl-10"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>
      </motion.div>

      <motion.div variants={item}>
        <label className="label" htmlFor="password">
          Password
        </label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            className="input pl-10 pr-10"
            placeholder={isSignup ? 'At least 6 characters' : 'Your password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={isSignup ? 'new-password' : 'current-password'}
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-200"
            onClick={() => setShowPassword((s) => !s)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </motion.div>

      {isSignup && (
        <motion.div variants={item}>
          <label className="label" htmlFor="confirm">
            Confirm password
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="confirm"
              type={showPassword ? 'text' : 'password'}
              className="input pl-10"
              placeholder="Repeat your password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
            />
          </div>
        </motion.div>
      )}

      <motion.button variants={item} type="submit" className="btn-primary mt-2 w-full py-3" disabled={loading}>
        {loading ? (
          <>
            <Spinner size={16} className="border-white text-white" />
            {isSignup ? 'Creating account…' : 'Signing in…'}
          </>
        ) : (
          <>
            {isSignup ? 'Create account' : 'Sign in'}
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </motion.button>

      <motion.p variants={item} className="mt-2 text-center text-sm text-slate-500 dark:text-slate-400">
        {isSignup ? (
          <>
            Already have an account?{' '}
            <Link to="/signin" className="font-medium text-accent hover:underline">
              Sign in
            </Link>
          </>
        ) : (
          <>
            New to TaskOrbit?{' '}
            <Link to="/signup" className="font-medium text-accent hover:underline">
              Create an account
            </Link>
          </>
        )}
      </motion.p>
    </motion.form>
  )
}

export function AuthLayout({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="auth-theme relative flex min-h-screen items-center justify-center overflow-hidden bg-transparent p-4">
      <VantaNetBackground videoSrc="/videos/signup.mp4" poster="/videos/signup-poster.jpg" />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        <div className="mb-6 flex items-center justify-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-cyan-500 shadow-glow">
            <Boxes className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-slate-800 dark:text-white">
              Task<span className="text-accent">Orbit</span>
            </h1>
          </div>
        </div>

        <div className="glass p-6 shadow-2xl sm:p-8">
          <h2 className="font-display mb-6 text-xl font-semibold text-slate-800 dark:text-white">{title}</h2>
          {subtitle && <p className="-mt-4 mb-6 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
          {children}
        </div>
      </motion.div>
    </div>
  )
}