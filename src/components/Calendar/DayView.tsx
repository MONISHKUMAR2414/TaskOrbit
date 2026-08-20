import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { ListTodo, Plus } from 'lucide-react'
import { useTaskContext } from '@/contexts/TaskContext'
import { timeToMinutes } from '@/lib/utils'
import type { Task } from '@/types'
import { EmptyState } from '@/components/common/EmptyState'

interface DayViewProps {
  date: Date
  onEdit: (task: Task) => void
  onNew: (time?: string) => void
}

const HOURS = Array.from({ length: 17 }, (_, i) => i + 6)

export function DayView({ date, onEdit, onNew }: DayViewProps) {
  const { tasks, getCategory } = useTaskContext()
  const [now, setNow] = useState(new Date())

  const dayTasks = useMemo(() => {
    return tasks
      .filter((t) => {
        if (!t.due_date) return false
        const d = new Date(t.due_date)
        return d.toDateString() === date.toDateString() && t.status !== 'cancelled'
      })
      .sort((a, b) => (timeToMinutes(a.start_time) ?? 480) - (timeToMinutes(b.start_time) ?? 480))
  }, [tasks, date])

  const isToday = date.toDateString() === new Date().toDateString()
  const done = dayTasks.filter((t) => t.status === 'completed').length

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {done} of {dayTasks.length} completed
        </p>
        <button className="btn-secondary btn-sm px-3 py-1.5 text-xs" onClick={() => onNew()}>
          <Plus className="h-3.5 w-3.5" /> Add Task
        </button>
      </div>

      <div className="relative flex flex-col gap-1">
        {HOURS.map((hour) => {
          const label = format(new Date(2026, 0, 1, hour), 'h aa')
          const tasksAtHour = dayTasks.filter((t) => {
            const start = timeToMinutes(t.start_time)
            const end = timeToMinutes(t.end_time)
            if (start === null) return false
            const hourStart = hour * 60
            const hourEnd = (hour + 1) * 60
            if (end !== null) return start < hourEnd && end > hourStart
            return start >= hourStart && start < hourEnd
          })
          const isCurrentHour = isToday && hour === now.getHours()

          return (
            <div key={hour} className="relative min-h-16 rounded-xl">
              <div
                className={`flex h-full items-center gap-3 rounded-xl border px-3 py-2 transition-colors ${
                  isCurrentHour
                    ? 'border-accent/50 bg-accent-dim'
                    : 'border-slate-200 dark:border-white/10'
                }`}
              >
                <span className={`w-12 shrink-0 text-xs font-semibold ${isCurrentHour ? 'text-accent' : 'text-slate-400'}`}>
                  {label}
                </span>
                <div className="flex flex-1 flex-col gap-1.5">
                  {tasksAtHour.map((t) => {
                    const cat = getCategory(t.category_id)
                    const completed = t.status === 'completed'
                    return (
                      <button
                        key={t.id}
                        onClick={() => onEdit(t)}
                        className={`group flex items-center gap-2 rounded-lg px-3 py-1.5 text-left transition-all hover:scale-[1.02] ${
                          completed ? 'opacity-60' : ''
                        }`}
                        style={{ backgroundColor: `${cat?.color ?? '#8b5cf6'}22` }}
                      >
                        <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: cat?.color ?? '#8b5cf6' }} />
                        <span className={`min-w-0 flex-1 truncate text-sm font-medium ${completed ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-200'}`}>
                          {t.title}
                        </span>
                        {t.start_time && t.end_time && (
                          <span className="text-[11px] text-slate-400">{t.start_time}–{t.end_time}</span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
              {isCurrentHour && (
                <div className="pointer-events-none absolute -left-1 top-0 h-full w-1 rounded-full bg-accent" />
              )}
            </div>
          )
        })}
      </div>

      {dayTasks.length === 0 && (
        <EmptyState
          icon={<ListTodo className="h-6 w-6" />}
          title="No tasks on this day"
          description="Click 'Add Task' to schedule something here."
        />
      )}

      {isToday && (
        <button
          className="mt-4 w-full rounded-xl border border-dashed border-slate-300 py-2.5 text-sm text-slate-400 transition-colors hover:border-accent hover:text-accent dark:border-white/10"
          onClick={() => setNow(new Date())}
        >
          Refresh current time ({format(now, 'h:mm aa')})
        </button>
      )}
    </div>
  )
}