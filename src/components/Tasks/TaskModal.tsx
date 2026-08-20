import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import { CalendarDays, Clock, Trash2, ListTodo } from 'lucide-react'
import { Modal } from '@/components/common/Modal'
import { useTaskContext } from '@/contexts/TaskContext'
import { useToast } from '@/hooks/useToast'
import { PRIORITY_META, STATUS_META } from '@/lib/utils'
import type { Task, TaskInput, TaskPriority, TaskStatus } from '@/types'
import { format } from 'date-fns'

interface TaskModalProps {
  open: boolean
  onClose: () => void
  task?: Task | null
}

const PRIORITY_OPTIONS = Object.keys(PRIORITY_META) as TaskPriority[]
const STATUS_OPTIONS = Object.keys(STATUS_META) as TaskStatus[]

export function TaskModal({ open, onClose, task }: TaskModalProps) {
  const { createTask, updateTask, deleteTask, categories } = useTaskContext()
  const { toast } = useToast()

  const editing = Boolean(task)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [status, setStatus] = useState<TaskStatus>('todo')
  const [dueDate, setDueDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [estimated, setEstimated] = useState(60)

  useEffect(() => {
    if (open) {
      setTitle(task?.title ?? '')
      setDescription(task?.description ?? '')
      setCategoryId(task?.category_id ?? categories[0]?.id ?? '')
      setPriority(task?.priority ?? 'medium')
      setStatus(task?.status ?? 'todo')
      setDueDate(task?.due_date ?? '')
      setStartTime(task?.start_time ?? '')
      setEndTime(task?.end_time ?? '')
      setEstimated(task?.estimated_minutes ?? 60)
      setError(null)
      setConfirmDelete(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, task, categories])

  const canSubmit = useMemo(() => title.trim().length > 0, [title])

  const validate = (): string | null => {
    if (!title.trim()) return 'Title is required.'
    if (dueDate) {
      if (startTime && endTime && startTime >= endTime) {
        return 'Start time must be before end time.'
      }
    }
    if (estimated <= 0) return 'Estimated time must be greater than 0.'
    return null
  }

  const buildInput = (): TaskInput => ({
    title: title.trim(),
    description: description.trim(),
    category_id: categoryId || null,
    priority,
    status,
    due_date: dueDate || null,
    start_time: startTime || null,
    end_time: endTime || null,
    estimated_minutes: estimated,
  })

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    const v = validate()
    if (v) {
      setError(v)
      return
    }
    setSaving(true)
    const input = buildInput()
    const res = editing
      ? await updateTask(task!.id, input)
      : await createTask(input)
    setSaving(false)
    if (res.error) {
      setError(res.error)
      toast(res.error, 'error')
      return
    }
    toast(editing ? 'Task updated successfully' : 'Task created successfully')
    onClose()
  }

  const handleDelete = async () => {
    if (!task) return
    setSaving(true)
    const res = await deleteTask(task.id)
    setSaving(false)
    if (res.error) {
      toast(res.error, 'error')
      return
    }
    toast('Task deleted')
    onClose()
  }

  const todayValue = format(new Date(), 'yyyy-MM-dd')

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Edit Task' : 'Create Task'}
      icon={<ListTodo className="h-5 w-5 text-accent" />}
      className="sm:max-w-xl"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-500"
            role="alert"
          >
            {error}
          </motion.div>
        )}

        <div>
          <label className="label" htmlFor="task-title">
            Title
          </label>
          <input
            id="task-title"
            className="input"
            placeholder="What needs to be done?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />
        </div>

        <div>
          <label className="label" htmlFor="task-description">
            Description
          </label>
          <textarea
            id="task-description"
            className="input min-h-24 resize-y"
            placeholder="Add details (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="task-category">
              Category
            </label>
            <select
              id="task-category"
              className="input"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label" htmlFor="task-priority">
              Priority
            </label>
            <select
              id="task-priority"
              className="input"
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
            >
              {PRIORITY_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_META[p].label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label" htmlFor="task-status">
              Status
            </label>
            <select
              id="task-status"
              className="input"
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {STATUS_META[s].label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label" htmlFor="task-due">
              Due Date
            </label>
            <div className="relative">
              <CalendarDays className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="task-due"
                type="date"
                className="input pl-10"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="label" htmlFor="task-start">
              Start Time
            </label>
            <div className="relative">
              <Clock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="task-start"
                type="time"
                className="input pl-10"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="label" htmlFor="task-end">
              End Time
            </label>
            <div className="relative">
              <Clock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="task-end"
                type="time"
                className="input pl-10"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="label" htmlFor="task-estimated">
              Estimated Time (minutes)
            </label>
            <div className="relative">
              <Clock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="task-estimated"
                type="number"
                min={5}
                step={5}
                className="input pl-10"
                value={estimated}
                onChange={(e) => setEstimated(Math.max(5, parseInt(e.target.value, 10) || 60))}
              />
            </div>
            <p className="mt-1 text-xs text-slate-400">
              {dueDate ? `Due ${dueDate === todayValue ? 'today' : dueDate}` : 'No due date set'}
            </p>
          </div>
        </div>

        <div className="mt-2 flex items-center justify-between gap-3">
          {editing ? (
            <button
              type="button"
              className="btn-danger"
              onClick={() => setConfirmDelete(true)}
              disabled={saving}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-3">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving || !canSubmit}>
              {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </div>
      </form>

      {confirmDelete && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass w-full max-w-sm rounded-2xl p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-label="Delete task"
          >
            <h3 className="font-display text-base font-semibold text-slate-800 dark:text-slate-100">
              Delete this task?
            </h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              “{task?.title}” will be permanently removed. This cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button className="btn-secondary" onClick={() => setConfirmDelete(false)} disabled={saving}>
                Cancel
              </button>
              <button className="btn-danger" onClick={handleDelete} disabled={saving}>
                {saving ? 'Deleting…' : 'Delete Task'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </Modal>
  )
}