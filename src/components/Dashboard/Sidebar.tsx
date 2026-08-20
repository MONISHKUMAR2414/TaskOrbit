import { NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  BarChart3,
  Boxes,
  CalendarDays,
  FileText,
  HelpCircle,
  LayoutDashboard,
  ListTodo,
  LogOut,
  Settings,
  Sparkles,
  X,
} from 'lucide-react'
import { useAuthContext } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/useToast'
import { cn } from '@/lib/utils'

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/tasks', label: 'Tasks', icon: ListTodo },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/recommendations', label: 'Recommendations', icon: Sparkles },
  { to: '/reports', label: 'Reports', icon: FileText },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const { signOut, profile } = useAuthContext()
  const { toast } = useToast()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    toast('Signed out', 'info')
    navigate('/signin')
  }

  const content = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-cyan-500 shadow-glow">
          <Boxes className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1">
          <span className="font-display text-base font-bold text-slate-800 dark:text-white">
            Task<span className="text-accent">Orbit</span>
          </span>
        </div>
        <button
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 lg:hidden dark:hover:bg-white/10"
          onClick={onClose}
          aria-label="Close sidebar"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2" aria-label="Main navigation">
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-accent-dim text-accent'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-200'
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  className={cn('h-[18px] w-[18px] transition-transform', !isActive && 'group-hover:scale-110')}
                />
                {label}
                {isActive && (
                  <motion.span layoutId="sidebar-dot" className="ml-auto h-1.5 w-1.5 rounded-full bg-accent" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="space-y-1 border-t border-slate-200 px-3 py-3 dark:border-white/10">
        <NavLink
          to="/settings"
          onClick={onClose}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-200"
        >
          <Settings className="h-[18px] w-[18px]" />
          Settings
        </NavLink>
        <a
          href="#help"
          onClick={(e) => {
            e.preventDefault()
            navigate('/settings')
            toast('Visit Settings for help and account options', 'info')
          }}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-200"
        >
          <HelpCircle className="h-[18px] w-[18px]" />
          Help
        </a>
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-500 transition-colors hover:bg-red-500/10"
        >
          <LogOut className="h-[18px] w-[18px]" />
          Logout
        </button>
        {profile && (
          <div className="mt-3 flex items-center gap-3 rounded-xl bg-slate-100/70 px-3 py-2.5 dark:bg-white/5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent to-cyan-500 text-xs font-bold text-white">
              {(profile.full_name?.[0] ?? profile.email?.[0] ?? 'U').toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-slate-700 dark:text-slate-200">
                {profile.full_name || 'User'}
              </p>
              <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">{profile.email}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop */}
      <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white/60 backdrop-blur-md lg:block dark:border-white/10 dark:bg-[#0e1118]/70">
        {content}
      </aside>

      {/* Mobile */}
      {open && (
        <motion.div
          className="fixed inset-0 z-40 lg:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/50" onClick={onClose} />
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'spring', stiffness: 350, damping: 32 }}
            className="absolute left-0 top-0 h-full w-64 border-r border-slate-200 bg-white dark:border-white/10 dark:bg-[#0e1118]"
          >
            {content}
          </motion.aside>
        </motion.div>
      )}
    </>
  )
}