import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: string | number
  icon: ReactNode
  tone?: 'accent' | 'emerald' | 'red' | 'amber' | 'cyan'
  sub?: string
  index?: number
}

const TONES: Record<string, string> = {
  accent: 'from-violet-500/20 to-violet-500/5 text-violet-500',
  emerald: 'from-emerald-500/20 to-emerald-500/5 text-emerald-500',
  red: 'from-red-500/20 to-red-500/5 text-red-500',
  amber: 'from-amber-500/20 to-amber-500/5 text-amber-500',
  cyan: 'from-cyan-500/20 to-cyan-500/5 text-cyan-500',
}

export function StatCard({ label, value, icon, tone = 'accent', sub, index = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, type: 'spring', stiffness: 300, damping: 24 }}
      className="glass card-hover p-4 sm:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {label}
          </p>
          <p className="mt-1.5 font-display text-2xl font-bold text-slate-800 sm:text-3xl dark:text-white">
            {value}
          </p>
          {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
        </div>
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br',
            TONES[tone]
          )}
        >
          {icon}
        </div>
      </div>
    </motion.div>
  )
}