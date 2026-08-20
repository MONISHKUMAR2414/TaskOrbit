import { useMemo, useState } from 'react'
import { format, startOfMonth, endOfMonth, startOfWeek, addDays, isSameMonth } from 'date-fns'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useTaskContext } from '@/contexts/TaskContext'
import type { Task } from '@/types'
import { ProgressBar } from '@/components/common/Badges'
import { cn } from '@/lib/utils'

interface MonthViewProps {
  date: Date
  onEdit: (task: Task) => void
}

export function MonthView({ date, onEdit }: MonthViewProps) {
  const { tasks, getCategory } = useTaskContext()
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)

  const cells = useMemo(() => {
    const monthStart = startOfMonth(date)
    const monthEnd = endOfMonth(date)
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 })
    const totalCells = Math.ceil((monthEnd.getTime() - gridStart.getTime()) / 86400000 / 7) * 7
    return Array.from({ length: totalCells }, (_, i) => addDays(gridStart, i))
  }, [date])

  const dayData = useMemo(() => {
    const map = new Map<string, Task[]>()
    for (const t of tasks) {
      if (!t.due_date || t.status === 'cancelled') continue
      const key = new Date(t.due_date).toDateString()
      const arr = map.get(key) ?? []
      arr.push(t)
      map.set(key, arr)
    }
    return map
  }, [tasks])

  const selectedTasks = selectedDay ? dayData.get(selectedDay.toDateString()) ?? [] : []

  return (
    <div>
      <div className="mb-3 grid grid-cols-7 gap-2">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
          <div key={d} className="text-center text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {cells.map((day) => {
          const tasksOfDay = dayData.get(day.toDateString()) ?? []
          const done = tasksOfDay.filter((t) => t.status === 'completed').length
          const pct = tasksOfDay.length ? Math.round((done / tasksOfDay.length) * 100) : 0
          const isToday = day.toDateString() === new Date().toDateString()
          const inMonth = isSameMonth(day, date)
          const density = tasksOfDay.length

          return (
            <button
              key={day.toISOString()}
              onClick={() => setSelectedDay(day)}
              className={cn(
                'flex min-h-20 flex-col justify-between rounded-xl border p-2 text-left transition-all hover:scale-[1.02] sm:min-h-24',
                !inMonth && 'opacity-35',
                isToday
                  ? 'border-accent bg-accent-dim'
                  : density > 0
                    ? 'border-slate-200 hover:border-accent/40 dark:border-white/10'
                    : 'border-slate-100 dark:border-white/5'
              )}
              aria-label={`${format(day, 'MMMM d')}: ${tasksOfDay.length} tasks, ${done} completed`}
            >
              <div className="flex items-start justify-between">
                <span className={cn('text-sm font-semibold', isToday ? 'text-accent' : 'text-slate-600 dark:text-slate-300')}>
                  {format(day, 'd')}
                </span>
                {density > 0 && (
                  <span className="rounded-full bg-accent/15 px-1.5 py-0.5 text-[10px] font-bold text-accent">
                    {density}
                  </span>
                )}
              </div>
              {density > 0 && (
                <div>
                  <div className="mb-1 flex items-center justify-between text-[10px] text-slate-400">
                    <span>{done} done</span>
                    <span>{pct}%</span>
                  </div>
                  <ProgressBar value={pct} color={pct >= 70 ? '#10b981' : pct >= 40 ? '#06b6d4' : '#f59e0b'} />
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Day detail panel */}
      {selectedDay && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-5 rounded-2xl border border-slate-200 bg-white/70 p-4 backdrop-blur-md dark:border-white/10 dark:bg-[#171b26]/80"
        >
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold text-slate-800 dark:text-slate-100">
              {format(selectedDay, 'EEEE, MMMM d')}
            </h3>
            <button onClick={() => setSelectedDay(null)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10" aria-label="Close day details">
              <X className="h-4 w-4" />
            </button>
          </div>
          {selectedTasks.length === 0 ? (
            <p className="text-sm text-slate-400">No tasks on this day.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {selectedTasks.map((t) => {
                const cat = getCategory(t.category_id)
                return (
                  <button
                    key={t.id}
                    onClick={() => onEdit(t)}
                    className="flex items-center gap-3 rounded-xl border border-slate-100 px-3 py-2.5 text-left transition-colors hover:border-accent/30 hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5"
                  >
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: cat?.color ?? '#8b5cf6' }} />
                    <span className="min-w-0 flex-1">
                      <span className={cn('block truncate text-sm font-medium text-slate-700 dark:text-slate-200', t.status === 'completed' && 'line-through opacity-60')}>
                        {t.title}
                      </span>
                      {t.start_time && <span className="text-xs text-slate-400">{t.start_time}{t.end_time ? ` – ${t.end_time}` : ''}</span>}
                    </span>
                    <span className="text-[11px] font-medium" style={{ color: cat?.color }}>
                      {t.status === 'completed' ? 'Done' : t.priority}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}