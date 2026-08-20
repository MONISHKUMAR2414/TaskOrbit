import { useState } from 'react'
import { addDays, addMonths, format } from 'date-fns'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { DayView } from '@/components/Calendar/DayView'
import { WeekView } from '@/components/Calendar/WeekView'
import { MonthView } from '@/components/Calendar/MonthView'
import { TaskModal } from '@/components/Tasks/TaskModal'
import { cn } from '@/lib/utils'
import type { Task } from '@/types'

type View = 'day' | 'week' | 'month'

export default function CalendarPage() {
  const [view, setView] = useState<View>('week')
  const [date, setDate] = useState(() => new Date())
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  const navDate = (dir: 1 | -1) => {
    setDate((d) => {
      if (view === 'day') return addDays(d, dir)
      if (view === 'week') return addDays(d, dir * 7)
      return addMonths(d, dir)
    })
  }

  const goToday = () => setDate(new Date())

  const title = (() => {
    if (view === 'day') return format(date, 'EEEE, MMMM d')
    if (view === 'week') return `${format(date, 'MMM d')} – ${format(addDays(date, 6), 'MMM d, yyyy')}`
    return format(date, 'MMMM yyyy')
  })()

  const handleEdit = (task: Task) => {
    setEditingTask(task)
    setModalOpen(true)
  }

  const handleNew = (time?: string) => {
    setEditingTask(null)
    void time
    setModalOpen(true)
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-800 dark:text-white">Calendar</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{title}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="glass flex items-center gap-1 p-1">
            {(['day', 'week', 'month'] as View[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition-colors',
                  view === v ? 'bg-accent text-white shadow-glow' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'
                )}
                aria-pressed={view === v}
              >
                {v}
              </button>
            ))}
          </div>
          <div className="glass flex items-center gap-1 p-1">
            <button onClick={() => navDate(-1)} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10" aria-label="Previous">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={goToday} className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300">
              Today
            </button>
            <button onClick={() => navDate(1)} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10" aria-label="Next">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <motion.div
        key={`${view}-${date.toDateString()}`}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="glass p-4 sm:p-6"
      >
        {view === 'day' && <DayView date={date} onEdit={handleEdit} onNew={handleNew} />}
        {view === 'week' && <WeekView date={date} onEdit={handleEdit} />}
        {view === 'month' && <MonthView date={date} onEdit={handleEdit} />}
      </motion.div>

      <TaskModal
        open={modalOpen}
        task={editingTask}
        onClose={() => setModalOpen(false)}
      />
    </div>
  )
}