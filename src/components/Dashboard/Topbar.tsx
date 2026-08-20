import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlarmClock,
  Bell,
  CheckCircle2,
  ChevronDown,
  LogOut,
  Menu,
  Moon,
  Search,
  Settings,
  Sun,
  AlertTriangle,
  CalendarDays,
} from 'lucide-react'
import { useAuthContext } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useToast } from '@/hooks/useToast'
import { useDebounce } from '@/hooks/useUi'
import { getInitials, timeAgo } from '@/lib/utils'
import type { Task } from '@/types'

interface TopbarProps {
  onMenuClick: () => void
  tasks: Task[]
  tasksLoading: boolean
}

export function Topbar({ onMenuClick, tasks }: TopbarProps) {
  const { user, profile, signOut } = useAuthContext()
  const { theme, toggleTheme } = useTheme()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [search, setSearch] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const debouncedSearch = useDebounce(search, 200)
  const searchRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)

  const notifications = useMemo(() => {
    const overdue = tasks.filter(
      (t) => t.due_date && new Date(t.due_date) < new Date() && (t.status === 'todo' || t.status === 'in_progress')
    )
    const dueToday = tasks.filter((t) => {
      if (!t.due_date) return false
      const d = new Date(t.due_date)
      const now = new Date()
      return d.toDateString() === now.toDateString() && t.status !== 'completed' && t.status !== 'cancelled'
    })
    const highPriority = tasks.filter((t) => t.priority === 'critical' && t.status === 'todo')

    const items: Array<{ id: string; icon: typeof Bell; message: string; time: string; tone: string }> = []
    overdue.slice(0, 3).forEach((t) =>
      items.push({
        id: `over-${t.id}`,
        icon: AlertTriangle,
        message: `Overdue: ${t.title}`,
        time: t.due_date ? timeAgo(new Date(t.due_date).toISOString()) : '',
        tone: 'text-red-400 bg-red-500/10',
      })
    )
    dueToday.slice(0, 3).forEach((t) =>
      items.push({
        id: `due-${t.id}`,
        icon: CalendarDays,
        message: `Due today: ${t.title}`,
        time: 'today',
        tone: 'text-amber-400 bg-amber-500/10',
      })
    )
    highPriority.slice(0, 3).forEach((t) =>
      items.push({
        id: `crit-${t.id}`,
        icon: AlarmClock,
        message: `Critical: ${t.title} is waiting`,
        time: 'now',
        tone: 'text-cyan-400 bg-cyan-500/10',
      })
    )
    if (items.length === 0) {
      items.push({
        id: 'empty',
        icon: CheckCircle2,
        message: 'You are all caught up. Nice work!',
        time: 'now',
        tone: 'text-emerald-400 bg-emerald-500/10',
      })
    }
    return items
  }, [tasks])

  const searchResults = useMemo(() => {
    if (!debouncedSearch.trim()) return []
    const q = debouncedSearch.toLowerCase()
    return tasks
      .filter((t) => {
        const cat = t.category?.name ?? ''
        return (
          t.title.toLowerCase().includes(q) ||
          (t.description ?? '').toLowerCase().includes(q) ||
          cat.toLowerCase().includes(q)
        )
      })
      .slice(0, 6)
  }, [debouncedSearch, tasks])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false)
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false)
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSignOut = async () => {
    await signOut()
    toast('Signed out', 'info')
    navigate('/signin')
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/70 px-4 backdrop-blur-md sm:px-6 dark:border-white/10 dark:bg-[#0e1118]/70">
      <button
        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden dark:text-slate-400 dark:hover:bg-white/10"
        onClick={onMenuClick}
        aria-label="Open navigation menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Search */}
      <div className="relative flex-1 max-w-xl" ref={searchRef}>
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setSearchOpen(true)
          }}
          onFocus={() => setSearchOpen(true)}
          placeholder="Search tasks, categories…"
          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 outline-none transition-colors focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/25 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:bg-white/10"
          aria-label="Search tasks"
        />
        <AnimatePresence>
          {searchOpen && searchResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-white/10 dark:bg-[#171b26]"
            >
              {searchResults.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setSearch('')
                    setSearchOpen(false)
                    navigate(`/tasks?open=${t.id}`)
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-white/5"
                >
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: t.category?.color ?? '#8b5cf6' }}
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                      {t.title}
                    </span>
                    <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
                      {t.category?.name ?? 'Uncategorized'} · {t.status.replace('_', ' ')}
                    </span>
                  </span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10"
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen((o) => !o)}
            className="relative rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10"
            aria-label="Notifications"
            aria-expanded={notifOpen}
          >
            <Bell className="h-5 w-5" />
            {notifications.some((n) => n.id !== 'empty') && (
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-[#0e1118]" />
            )}
          </button>
          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-white/10 dark:bg-[#171b26]"
              >
                <div className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-800 dark:border-white/10 dark:text-slate-100">
                  Notifications
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className="flex items-start gap-3 border-b border-slate-50 px-4 py-3 last:border-0 dark:border-white/5"
                    >
                      <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${n.tone}`}>
                        <n.icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm text-slate-700 dark:text-slate-200">{n.message}</p>
                        <p className="text-[11px] text-slate-400">{n.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen((o) => !o)}
            className="flex items-center gap-2 rounded-xl p-1.5 transition-colors hover:bg-slate-100 dark:hover:bg-white/10"
            aria-label="Profile menu"
            aria-expanded={profileOpen}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-accent to-cyan-500 text-xs font-bold text-white">
              {getInitials(profile)}
            </div>
            <ChevronDown className="hidden h-4 w-4 text-slate-400 sm:block" />
          </button>
          <AnimatePresence>
            {profileOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-white/10 dark:bg-[#171b26]"
              >
                <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-4 dark:border-white/10">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-accent to-cyan-500 text-sm font-bold text-white">
                    {getInitials(profile)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {profile?.full_name || user?.email?.split('@')[0] || 'User'}
                    </p>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">{profile?.email || user?.email}</p>
                  </div>
                </div>
                <div className="p-2">
                  <button
                    onClick={() => {
                      setProfileOpen(false)
                      navigate('/settings')
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5"
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-500 transition-colors hover:bg-red-500/10"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  )
}