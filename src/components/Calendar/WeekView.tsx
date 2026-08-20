import { useMemo } from 'react'
import { format, startOfWeek, addDays } from 'date-fns'
import { useTaskContext } from '@/contexts/TaskContext'
import { timeToMinutes } from '@/lib/utils'
import { computeProductivity } from '@/lib/productivity'
import type { Task } from '@/types'
import { ProgressBar } from '@/components/common/Badges'

interface WeekViewProps {
  date: Date
  onEdit: (task: Task) => void
}

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8)

export function WeekView({ date, onEdit }: WeekViewProps) {
  const { tasks, getCategory } = useTaskContext()

  const days = useMemo(() => {
    const weekStart = startOfWeek(date, { weekStartsOn: 1 })
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  }, [date])

  const weekTasks = useMemo(() => {
    const map = new Map<string, Task[]>()
    for (const day of days) {
      const key = day.toDateString()
      map.set(key, [])
    }
    for (const t of tasks) {
      if (!t.due_date || t.status === 'cancelled') continue
      const d = new Date(t.due_date)
      const key = d.toDateString()
      if (map.has(key)) {
        const arr = map.get(key)!
        arr.push(t)
      }
    }
    for (const [k, arr] of map) {
      arr.sort((a, b) => (timeToMinutes(a.start_time) ?? 480) - (timeToMinutes(b.start_time) ?? 480))
      map.set(k, arr)
    }
    return map
  }, [tasks, days])

  const thisWeek = useMemo(() => {
    const start = days[0]
    const end = days[6]
    const weekTasksList = tasks.filter((t) => {
      if (!t.due_date) return false
      const d = new Date(t.due_date)
      return d >= start && d <= end
    })
    return computeProductivity(weekTasksList)
  }, [tasks, days])

  const lastWeek = useMemo(() => {
    const start = addDays(days[0], -7)
    const end = addDays(days[6], -7)
    const weekTasksList = tasks.filter((t) => {
      if (!t.due_date) return false
      const d = new Date(t.due_date)
      return d >= start && d <= end
    })
    return computeProductivity(weekTasksList)
  }, [tasks, days])

  const improvement = thisWeek.weekly - lastWeek.weekly
  const isToday = (d: Date) => d.toDateString() === new Date().toDateString()

  return (
    <div>
      {/* Week comparison */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="glass p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">This Week</p>
          <p className="mt-1 font-display text-2xl font-bold text-emerald-500">{thisWeek.weekly}%</p>
          <ProgressBar value={thisWeek.weekly} color="#10b981" className="mt-2" />
        </div>
        <div className="glass p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Last Week</p>
          <p className="mt-1 font-display text-2xl font-bold text-slate-600 dark:text-slate-300">{lastWeek.weekly}%</p>
          <ProgressBar value={lastWeek.weekly} color="#06b6d4" className="mt-2" />
        </div>
        <div className={`glass p-4 ${improvement >= 0 ? 'border-emerald-500/30' : 'border-red-500/30'}`}>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Improvement</p>
          <p className={`mt-1 font-display text-2xl font-bold ${improvement >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
            {improvement >= 0 ? '+' : ''}{improvement}%
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {thisWeek.currentStreak} day streak · best {thisWeek.bestStreak}
          </p>
        </div>
      </div>

      {/* Day headers with stats */}
      <div className="mb-2 grid grid-cols-7 gap-2">
        {days.map((day) => {
          const dayTasks = weekTasks.get(day.toDateString()) ?? []
          const done = dayTasks.filter((t) => t.status === 'completed').length
          const weight = { critical: 4, high: 3, medium: 2, low: 1 }
          const wsum = dayTasks.reduce((s, t) => s + weight[t.priority], 0)
          const wdone = dayTasks.filter((t) => t.status === 'completed').reduce((s, t) => s + weight[t.priority], 0)
          const score = dayTasks.length ? Math.round((wdone / (wsum || 1)) * 100) : 0
          return (
            <div
              key={day.toDateString()}
              className={`rounded-xl border p-2 text-center ${
                isToday(day) ? 'border-accent bg-accent-dim' : 'border-slate-200 dark:border-white/10'
              }`}
            >
              <p className={`text-[10px] font-semibold uppercase ${isToday(day) ? 'text-accent' : 'text-slate-400'}`}>
                {format(day, 'EEE')}
              </p>
              <p className={`text-sm font-bold ${isToday(day) ? 'text-accent' : 'text-slate-700 dark:text-slate-200'}`}>
                {format(day, 'd')}
              </p>
              <p className="mt-1 text-[10px] text-slate-400">{done}/{dayTasks.length} tasks</p>
              <p className="text-[10px] font-semibold text-cyan-500">{score} pts</p>
            </div>
          )
        })}
      </div>

      {/* Week grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[720px]">
          <div className="grid grid-cols-[64px_repeat(7,1fr)] gap-2">
            <div />
            {days.map((day) => (
              <div key={day.toDateString()} className="text-center">
                <span className={`text-[11px] font-semibold ${isToday(day) ? 'text-accent' : 'text-slate-400'}`}>
                  {format(day, 'MMM d')}
                </span>
              </div>
            ))}
            {HOURS.map((hour) => (
              <div key={hour} className="contents">
                <div className="pt-2 text-right text-[10px] font-medium text-slate-400">
                  {format(new Date(2026, 0, 1, hour), 'h aa')}
                </div>
                {days.map((day) => {
                  const dayTasks = weekTasks.get(day.toDateString()) ?? []
                  const atHour = dayTasks.filter((t) => {
                    const start = timeToMinutes(t.start_time)
                    const end = timeToMinutes(t.end_time)
                    if (start === null) return false
                    const hStart = hour * 60
                    const hEnd = (hour + 1) * 60
                    if (end !== null) return start < hEnd && end > hStart
                    return start >= hStart && start < hEnd
                  })
                  return (
                    <div
                      key={day.toDateString()}
                      className="min-h-12 rounded-lg border border-slate-100 p-1 dark:border-white/5"
                    >
                      {atHour.slice(0, 2).map((t) => {
                        const cat = getCategory(t.category_id)
                        return (
                          <button
                            key={t.id}
                            onClick={() => onEdit(t)}
                            className="mb-1 flex w-full items-center gap-1 rounded px-1.5 py-0.5 text-left"
                            style={{ backgroundColor: `${cat?.color ?? '#8b5cf6'}26` }}
                          >
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: cat?.color ?? '#8b5cf6' }} />
                            <span className="truncate text-[10px] font-medium text-slate-700 dark:text-slate-200">
                              {t.title}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}