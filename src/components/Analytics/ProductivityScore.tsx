import { motion } from 'framer-motion'
import { CalendarCheck, CalendarDays, Flame, Moon, Sun, TrendingUp } from 'lucide-react'
import { computeProductivity, productivityColor } from '@/lib/productivity'
import type { Task } from '@/types'

export function ProductivityScore({ tasks }: { tasks: Task[] }) {
  const report = computeProductivity(tasks)
  const color = productivityColor(report.weekly)

  const metrics = [
    { label: 'Daily', value: report.today, icon: Sun },
    { label: 'Weekly', value: report.weekly, icon: CalendarDays },
    { label: 'Monthly', value: report.monthly, icon: Moon },
  ]

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      {/* Score dial */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass relative flex flex-col items-center justify-center gap-3 p-8"
      >
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Productivity Score
        </p>
        <div className="relative flex h-40 w-40 items-center justify-center">
          <svg className="h-40 w-40 -rotate-90" viewBox="0 0 160 160" aria-hidden="true">
            <circle cx="80" cy="80" r="68" fill="none" stroke="rgba(100,116,139,0.15)" strokeWidth="10" />
            <motion.circle
              cx="80"
              cy="80"
              r="68"
              fill="none"
              stroke={color}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 68}
              initial={{ strokeDashoffset: 2 * Math.PI * 68 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 68 * (1 - report.weekly / 100) }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="font-display text-4xl font-bold" style={{ color }}>
              {report.weekly}
            </span>
            <span className="text-xs text-slate-400">/ 100</span>
          </div>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {report.currentStreak} day streak · Best {report.bestStreak}
        </p>
      </motion.div>

      {/* Daily / weekly / monthly */}
      <div className="grid grid-cols-1 gap-4">
        {metrics.map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + i * 0.08 }}
            className="glass flex items-center gap-4 p-4"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-dim text-accent">
              <m.icon className="h-5 w-5" />
            </span>
            <div className="flex-1">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {m.label} Score
              </p>
              <div className="mt-1 flex items-center gap-3">
                <span className="font-display text-xl font-bold" style={{ color: productivityColor(m.value) }}>
                  {m.value}
                </span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: productivityColor(m.value) }}
                    initial={{ width: 0 }}
                    animate={{ width: `${m.value}%` }}
                    transition={{ duration: 0.8 }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Streaks + completion */}
      <div className="flex flex-col gap-4">
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="glass flex items-center gap-4 p-4"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-500">
            <Flame className="h-5 w-5" />
          </span>
          <div className="flex-1">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Current Streak</p>
            <p className="font-display text-xl font-bold text-amber-500">{report.currentStreak} days</p>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.38 }}
          className="glass flex items-center gap-4 p-4"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-500">
            <CalendarCheck className="h-5 w-5" />
          </span>
          <div className="flex-1">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Completion</p>
            <p className="font-display text-xl font-bold text-emerald-500">
              {report.completedTasks}/{report.totalTasks}
            </p>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.46 }}
          className="glass flex items-center gap-4 p-4"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/15 text-red-500">
            <TrendingUp className="h-5 w-5" />
          </span>
          <div className="flex-1">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Overdue</p>
            <p className="font-display text-xl font-bold text-red-500">{report.overdue}</p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}