import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  AlarmClock,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Circle,
  Loader2,
  Pencil,
  Trash2,
} from 'lucide-react'
import { useTaskContext } from '@/contexts/TaskContext'
import { useCelebration } from '@/contexts/CelebrationContext'
import { useToast } from '@/hooks/useToast'
import {
  PRIORITY_META,
  formatDueDate,
  isOverdue,
  minutesToLabel,
} from '@/lib/utils'
import type { Task } from '@/types'
import { PriorityBadge, StatusBadge, CategoryChip } from '@/components/common/Badges'

interface TaskCardProps {
  task: Task
  onEdit: (task: Task) => void
  compact?: boolean
}

export function TaskCard({ task, onEdit, compact }: TaskCardProps) {
  const { completeTask, deleteTask, toggleInProgress, getCategory } = useTaskContext()
  const { celebrate } = useCelebration()
  const { toast } = useToast()
  const [busy, setBusy] = useState(false)

  const category = getCategory(task.category_id)
  const completed = task.status === 'completed'
  const overdue = isOverdue(task)

  const handleComplete = async () => {
    if (busy) return
    setBusy(true)
    const res = await completeTask(task.id)
    setBusy(false)
    if (res.error) {
      toast(res.error, 'error')
      return
    }
    if (res.task?.status === 'completed') {
      celebrate(res.task)
      toast('Task completed — nice work!')
    } else {
      toast('Task reopened')
    }
  }

  const handleToggleProgress = async () => {
    if (busy) return
    setBusy(true)
    const res = await toggleInProgress(task.id)
    setBusy(false)
    if (res.error) {
      toast(res.error, 'error')
      return
    }
    toast(res.task?.status === 'in_progress' ? 'Task started' : 'Task paused', 'info')
  }

  const handleDelete = async () => {
    if (busy) return
    setBusy(true)
    const res = await deleteTask(task.id)
    setBusy(false)
    if (res.error) {
      toast(res.error, 'error')
      return
    }
    toast('Task deleted')
  }

  const accent = category?.color ?? PRIORITY_META[task.priority].color ?? '#8b5cf6'

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      className={`group relative overflow-hidden rounded-2xl border bg-white/70 p-4 shadow-card backdrop-blur-md transition-all hover:-translate-y-0.5 dark:bg-[#171b26]/80 ${
          completed
            ? 'border-emerald-500/25 opacity-75'
            : overdue
              ? 'border-red-500/30'
              : 'border-slate-200 dark:border-white/10'
        }`}
      >
        <span
          className="absolute left-0 top-0 h-full w-1"
          style={{ backgroundColor: accent, opacity: completed ? 0.4 : 0.9 }}
        />

        <div className="flex items-start gap-3">
          <button
            onClick={handleComplete}
            disabled={busy}
            aria-label={completed ? 'Reopen task' : 'Mark task as complete'}
            className="mt-0.5 shrink-0 rounded-full p-0.5 transition-transform hover:scale-110"
            title={completed ? 'Reopen' : 'Complete'}
          >
            {completed ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            ) : (
              <Circle
                className={`h-5 w-5 ${overdue ? 'text-red-400' : 'text-slate-300 dark:text-slate-600'} hover:text-accent`}
              />
            )}
          </button>

          <div className="min-w-0 flex-1">
            <h3
              className={`truncate text-sm font-semibold ${
                completed
                  ? 'text-slate-400 line-through dark:text-slate-500'
                  : 'text-slate-800 dark:text-slate-100'
              }`}
            >
              {task.title}
            </h3>
            {task.description && !compact && (
              <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
                {task.description}
              </p>
            )}

            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              {category && <CategoryChip name={category.name} color={category.color} />}
              <PriorityBadge priority={task.priority} />
              {!compact && <StatusBadge status={task.status} />}
              {task.due_date && (
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                    overdue
                      ? 'bg-red-500/10 text-red-400'
                      : 'bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400'
                  }`}
                >
                  <CalendarDays className="h-3 w-3" />
                  {formatDueDate(task.due_date)}
                </span>
              )}
              {task.estimated_minutes > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500 dark:bg-white/5 dark:text-slate-400">
                  <AlarmClock className="h-3 w-3" />
                  {minutesToLabel(task.estimated_minutes)}
                </span>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 max-sm:opacity-100">
            <button
              onClick={handleToggleProgress}
              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-cyan-500 dark:hover:bg-white/10"
              aria-label={
                task.status === 'in_progress' ? 'Mark as todo' : 'Mark as in progress'
              }
              title={task.status === 'in_progress' ? 'Pause task' : 'Start task'}
            >
              {task.status === 'in_progress' ? (
                <Loader2 className="h-4 w-4 animate-spin text-cyan-500" />
              ) : (
                <Loader2 className="h-4 w-4" />
              )}
            </button>
            <button
              onClick={() => onEdit(task)}
              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-accent dark:hover:bg-white/10"
              aria-label={`Edit task: ${task.title}`}
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={handleDelete}
              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-500/10 hover:text-red-500"
              aria-label={`Delete task: ${task.title}`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </motion.article>
  )
}

export function TaskListRow({ task, onEdit }: TaskCardProps) {
  const { completeTask } = useTaskContext()
  const { celebrate } = useCelebration()
  const { toast } = useToast()
  const category = task.category_id ? null : null
  void category

  const handleComplete = async () => {
    const res = await completeTask(task.id)
    if (res.error) {
      toast(res.error, 'error')
      return
    }
    if (res.task?.status === 'completed') {
      celebrate(res.task)
      toast('Task completed')
    } else {
      toast('Task reopened')
    }
  }

  return (
    <div className="flex w-full items-center justify-between gap-3 py-2">
      <button
        onClick={handleComplete}
        aria-label={task.status === 'completed' ? 'Reopen task' : 'Complete task'}
        className="shrink-0"
      >
        {task.status === 'completed' ? (
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
        ) : (
          <Circle className="h-5 w-5 text-slate-400 hover:text-accent" />
        )}
      </button>
      <button
        onClick={() => onEdit(task)}
        className="flex min-w-0 flex-1 items-center justify-between gap-2 text-left"
      >
        <span
          className={`truncate text-sm ${
            task.status === 'completed'
              ? 'text-slate-400 line-through dark:text-slate-500'
              : 'text-slate-700 dark:text-slate-200'
          }`}
        >
          {task.title}
        </span>
        <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
      </button>
    </div>
  )
}