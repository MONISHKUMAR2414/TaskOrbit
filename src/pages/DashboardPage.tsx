import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  AlarmClock,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Flame,
  ListTodo,
  Plus,
  TrendingUp,
  TriangleAlert,
  Zap,
} from 'lucide-react'
import { useTaskContext } from '@/contexts/TaskContext'
import { useAuthContext } from '@/contexts/AuthContext'
import { computeProductivity, productivityColor } from '@/lib/productivity'
import { formatDueDate, dueToday, isOverdue, taskCompletionPct } from '@/lib/utils'
import { StatCard } from '@/components/Dashboard/StatCard'
import { ThreeScene } from '@/components/ThreeScene/Scene'
import { TaskCard } from '@/components/Tasks/TaskCard'
import { TaskModal } from '@/components/Tasks/TaskModal'
import { EmptyState } from '@/components/common/EmptyState'
import { PageLoader } from '@/components/common/Spinner'
import { format } from 'date-fns'
import type { Task } from '@/types'

export default function DashboardPage() {
  const { tasks, tasksLoading, getCategory } = useTaskContext()
  const { profile } = useAuthContext()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  const stats = useMemo(() => {
    const todayTasks = tasks.filter((t) => t.due_date && dueToday(t))
    const completedToday = todayTasks.filter((t) => t.status === 'completed').length
    const completionRate = todayTasks.length
      ? Math.round((completedToday / todayTasks.length) * 100)
      : 0
    const overdue = tasks.filter((t) => isOverdue(t)).length
    const dueTodayCount = tasks.filter((t) => t.due_date && dueToday(t) && t.status !== 'cancelled').length
    const highPriority = tasks.filter((t) => t.priority === 'high' && t.status !== 'completed' && t.status !== 'cancelled').length
    const report = computeProductivity(tasks)
    return {
      todayTasks,
      completedToday,
      completionRate,
      overdue,
      dueTodayCount,
      highPriority,
      report,
      totalCompletion: taskCompletionPct(tasks),
    }
  }, [tasks])

  const upcoming = useMemo(() => {
    return tasks
      .filter((t) => t.status === 'todo' || t.status === 'in_progress')
      .sort((a, b) => {
        if (!a.due_date && !b.due_date) return 0
        if (!a.due_date) return 1
        if (!b.due_date) return -1
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
      })
      .slice(0, 6)
  }, [tasks])

  const todaySorted = useMemo(() => {
    return [...stats.todayTasks].sort((a, b) => {
      if (a.status === 'completed' && b.status !== 'completed') return 1
      if (a.status !== 'completed' && b.status === 'completed') return -1
      const order = { critical: 0, high: 1, medium: 2, low: 3 }
      return order[a.priority] - order[b.priority]
    })
  }, [stats.todayTasks])

  const firstName = profile?.full_name?.split(' ')[0] || 'there'

  if (tasksLoading) return <PageLoader />

  const handleEdit = (task: Task) => {
    setEditingTask(task)
    setModalOpen(true)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-800 dark:text-white">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'},{' '}
            {firstName}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {format(new Date(), 'EEEE, MMMM d, yyyy')} · Here’s your productivity overview
          </p>
        </div>
        <button className="btn-primary" onClick={() => { setEditingTask(null); setModalOpen(true) }}>
          <Plus className="h-4 w-4" />
          New Task
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
        <StatCard label="Today's Tasks" value={stats.todayTasks.length} icon={<ListTodo className="h-5 w-5" />} tone="accent" index={0} />
        <StatCard label="Completed" value={stats.completedToday} icon={<CheckCircle2 className="h-5 w-5" />} tone="emerald" index={1} sub={`${stats.todayTasks.length ? Math.round((stats.completedToday / stats.todayTasks.length) * 100) : 0}% of today`} />
        <StatCard label="Completion Rate" value={`${stats.completionRate}%`} icon={<TrendingUp className="h-5 w-5" />} tone="cyan" index={2} />
        <StatCard label="Current Streak" value={`${stats.report.currentStreak} days`} icon={<Flame className="h-5 w-5" />} tone="amber" index={3} sub={`Best: ${stats.report.bestStreak} days`} />
        <StatCard label="Overdue" value={stats.overdue} icon={<TriangleAlert className="h-5 w-5" />} tone="red" index={4} />
        <StatCard label="Due Today" value={stats.dueTodayCount} icon={<CalendarDays className="h-5 w-5" />} tone="cyan" index={5} />
        <StatCard label="High Priority" value={stats.highPriority} icon={<Zap className="h-5 w-5" />} tone="amber" index={6} />
        <StatCard label="Productivity Score" value={stats.report.weekly} icon={<Flame className="h-5 w-5" />} tone="accent" index={7} sub="This week /100" />
      </div>

      {/* 3D Scene */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass relative overflow-hidden"
      >
        <div className="pointer-events-none absolute left-4 top-4 z-10 sm:left-6 sm:top-6">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Today's Productivity
          </p>
          <p className="font-display text-3xl font-bold sm:text-4xl" style={{ color: productivityColor(stats.report.today) }}>
            {stats.report.today}%
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {stats.completedToday} of {stats.todayTasks.length} tasks done today
          </p>
        </div>
        <div className="h-[340px] w-full sm:h-[420px]">
          <ThreeScene
            tasks={tasks}
            completionPercent={stats.totalCompletion}
            onTaskSelect={(t) => setSelectedTask(t)}
          />
        </div>
      </motion.div>

      {/* Today's tasks + upcoming */}
      <div className="grid gap-6 lg:grid-cols-2">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-slate-800 dark:text-white">Today's Tasks</h2>
            <Link to="/tasks" className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            {todaySorted.length === 0 ? (
              <EmptyState
                icon={<ListTodo className="h-6 w-6" />}
                title="Nothing scheduled for today"
                description="Enjoy the free time or plan your next task."
                action={
                  <button className="btn-secondary" onClick={() => { setEditingTask(null); setModalOpen(true) }}>
                    <Plus className="h-4 w-4" /> Add a task
                  </button>
                }
              />
            ) : (
              todaySorted.map((t) => (
                <TaskCard key={t.id} task={t} onEdit={handleEdit} compact />
              ))
            )}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-slate-800 dark:text-white">Upcoming Tasks</h2>
            <Link to="/calendar" className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline">
              Open calendar <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="glass flex flex-col divide-y divide-slate-100 dark:divide-white/5">
            {upcoming.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-400">
                No upcoming tasks. You’re all clear!
              </div>
            ) : (
              upcoming.map((t) => {
                const cat = getCategory(t.category_id)
                return (
                  <button
                    key={t.id}
                    onClick={() => handleEdit(t)}
                    className="flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-white/5"
                  >
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: cat?.color ?? '#8b5cf6' }} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-slate-700 dark:text-slate-200">{t.title}</span>
                      <span className="block text-xs text-slate-400">{cat?.name ?? 'Uncategorized'}</span>
                    </span>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${isOverdue(t) ? 'bg-red-500/10 text-red-400' : 'bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400'}`}>
                      <AlarmClock className="h-3 w-3" />
                      {formatDueDate(t.due_date)}
                    </span>
                  </button>
                )
              })
            )}
          </div>
        </motion.section>
      </div>

      {/* Selected task from 3D scene */}
      {selectedTask && (
        <TaskModal
          open={Boolean(selectedTask)}
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}

      <TaskModal open={modalOpen} task={editingTask} onClose={() => setModalOpen(false)} />
    </div>
  )
}