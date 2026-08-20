import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { FlaskConical } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { useTaskContext } from '@/contexts/TaskContext'
import { useTheme } from '@/contexts/ThemeContext'
import { isDemoMode } from '@/lib/supabase'
import SkyBackground from '@/components/SkyBackground'

export default function AppLayout() {
  const { tasks, tasksLoading } = useTaskContext()
  const { theme } = useTheme()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  return (
    <div className="flex h-screen overflow-hidden bg-transparent">
      {theme === 'light' && <SkyBackground />}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          onMenuClick={() => setSidebarOpen(true)}
          tasks={tasks}
          tasksLoading={tasksLoading}
        />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            {isDemoMode && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-accent/30 bg-accent-dim px-4 py-2.5 text-xs text-accent">
                <FlaskConical className="h-4 w-4 shrink-0" />
                <span>
                  Demo mode — data is stored locally in your browser. Configure{' '}
                  <code className="rounded bg-white/20 px-1 py-0.5 font-mono">VITE_SUPABASE_URL</code> and{' '}
                  <code className="rounded bg-white/20 px-1 py-0.5 font-mono">VITE_SUPABASE_ANON_KEY</code> in{' '}
                  <code className="rounded bg-white/20 px-1 py-0.5 font-mono">.env</code> to connect Supabase.
                </span>
              </div>
            )}
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <Outlet context={{ tasks, tasksLoading }} />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  )
}