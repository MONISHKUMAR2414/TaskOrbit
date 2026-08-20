import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  CalendarRange,
  Download,
  FileText,
  Flame,
  Loader2,
  TrendingUp,
  TriangleAlert,
} from 'lucide-react'
import { useTaskContext } from '@/contexts/TaskContext'
import { useToast } from '@/hooks/useToast'
import { computeProductivity } from '@/lib/productivity'
import { buildReportData, exportTasksCsv, exportWeeklyPdf } from '@/lib/export'
import { startOfWeek, format } from 'date-fns'
import { ProgressBar } from '@/components/common/Badges'

export default function ReportsPage() {
  const { tasks, tasksLoading, categories } = useTaskContext()
  const { toast } = useToast()
  const [exportingCsv, setExportingCsv] = useState(false)
  const [exportingPdf, setExportingPdf] = useState(false)

  const report = useMemo(() => computeProductivity(tasks), [tasks])
  const weekStart = useMemo(() => startOfWeek(new Date(), { weekStartsOn: 1 }), [])
  const weekEnd = useMemo(() => new Date(weekStart.getTime() + 6 * 86400000), [weekStart])

  const handleCsv = async () => {
    setExportingCsv(true)
    try {
      await new Promise((r) => setTimeout(r, 100))
      exportTasksCsv(tasks, categories)
      toast('CSV exported successfully')
    } catch (e) {
      toast('Failed to export CSV: ' + (e as Error).message, 'error')
    } finally {
      setExportingCsv(false)
    }
  }

  const handlePdf = async () => {
    setExportingPdf(true)
    try {
      await new Promise((r) => setTimeout(r, 100))
      const data = buildReportData(
        tasks,
        categories,
        report.weekly,
        report.currentStreak,
        report.bestStreak,
        weekStart,
        weekEnd
      )
      exportWeeklyPdf(data)
      toast('PDF report generated')
    } catch (e) {
      toast('Failed to generate PDF: ' + (e as Error).message, 'error')
    } finally {
      setExportingPdf(false)
    }
  }

  if (tasksLoading) {
    return <div className="flex items-center justify-center py-24 text-sm text-slate-400">Loading reports…</div>
  }

  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, { name: string; color: string; count: number; done: number }>()
    for (const t of tasks) {
      const cat = categories.find((c) => c.id === t.category_id)
      const name = cat?.name ?? 'Uncategorized'
      const color = cat?.color ?? '#64748b'
      const e = map.get(name) ?? { name, color, count: 0, done: 0 }
      e.count++
      if (t.status === 'completed') e.done++
      map.set(name, e)
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count)
  }, [tasks, categories])

  const priorityBreakdown = useMemo(() => {
    return (['critical', 'high', 'medium', 'low'] as const).map((p) => ({
      priority: p,
      count: tasks.filter((t) => t.priority === p).length,
    }))
  }, [tasks])

  const stats = [
    { label: 'Total Tasks', value: report.totalTasks, icon: FileText, tone: 'text-accent bg-accent-dim' },
    { label: 'Completed', value: report.completedTasks, icon: TrendingUp, tone: 'text-emerald-500 bg-emerald-500/10' },
    { label: 'Completion Rate', value: `${report.completionRate}%`, icon: CalendarRange, tone: 'text-cyan-500 bg-cyan-500/10' },
    { label: 'Overdue', value: report.overdue, icon: TriangleAlert, tone: 'text-red-500 bg-red-500/10' },
    { label: 'Current Streak', value: `${report.currentStreak}d`, icon: Flame, tone: 'text-amber-500 bg-amber-500/10' },
    { label: 'Best Streak', value: `${report.bestStreak}d`, icon: Flame, tone: 'text-violet-500 bg-violet-500/10' },
  ]

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-800 dark:text-white">Reports & Exports</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Week of {format(weekStart, 'MMM d')} – {format(weekEnd, 'MMM d, yyyy')}
        </p>
      </div>

      {/* Export actions */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <motion.button
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={handleCsv}
          disabled={tasks.length === 0 || exportingCsv}
          className="glass card-hover group flex items-center gap-4 p-5 text-left"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 transition-transform group-hover:scale-110">
            {exportingCsv ? <Loader2 className="h-6 w-6 animate-spin" /> : <Download className="h-6 w-6" />}
          </span>
          <div className="flex-1">
            <h3 className="font-display text-base font-semibold text-slate-800 dark:text-slate-100">
              Export Task History (CSV)
            </h3>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
              All {tasks.length} tasks with category, priority, status, and dates.
            </p>
          </div>
        </motion.button>

        <motion.button
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 }}
          onClick={handlePdf}
          disabled={tasks.length === 0 || exportingPdf}
          className="glass card-hover group flex items-center gap-4 p-5 text-left"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-500 transition-transform group-hover:scale-110">
            {exportingPdf ? <Loader2 className="h-6 w-6 animate-spin" /> : <FileText className="h-6 w-6" />}
          </span>
          <div className="flex-1">
            <h3 className="font-display text-base font-semibold text-slate-800 dark:text-slate-100">
              Weekly PDF Report
            </h3>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
              Professional report with breakdowns and daily performance.
            </p>
          </div>
        </motion.button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.05 }}
            className="glass p-4"
          >
            <span className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${s.tone}`}>
              <s.icon className="h-4 w-4" />
            </span>
            <p className="mt-2 font-display text-xl font-bold text-slate-800 dark:text-white">{s.value}</p>
            <p className="text-xs text-slate-400">{s.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Category breakdown preview */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass p-5"
        >
          <h3 className="mb-4 font-display text-sm font-semibold text-slate-800 dark:text-slate-100">
            Category Breakdown
          </h3>
          {categoryBreakdown.length === 0 ? (
            <p className="text-sm text-slate-400">No categories yet.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {categoryBreakdown.map((c) => (
                <div key={c.name}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c.color }} />
                      {c.name}
                    </span>
                    <span className="text-slate-400">{c.done}/{c.count}</span>
                  </div>
                  <ProgressBar value={c.count ? (c.done / c.count) * 100 : 0} color={c.color} />
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Priority breakdown preview */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="glass p-5"
        >
          <h3 className="mb-4 font-display text-sm font-semibold text-slate-800 dark:text-slate-100">
            Priority Breakdown
          </h3>
          <div className="flex flex-col gap-3">
            {priorityBreakdown.map((p) => (
              <div key={p.priority} className="flex items-center gap-3">
                <span className="w-20 text-xs font-medium text-slate-500 dark:text-slate-400">{p.priority}</span>
                <div className="h-6 flex-1 overflow-hidden rounded-lg bg-slate-100 dark:bg-white/10">
                  <motion.div
                    className="flex h-full items-center justify-end rounded-lg px-2 text-[10px] font-bold text-white"
                    style={{ backgroundColor: p.priority === 'low' ? '#10b981' : p.priority === 'medium' ? '#06b6d4' : p.priority === 'high' ? '#f59e0b' : '#ef4444' }}
                    initial={{ width: 0 }}
                    animate={{ width: `${tasks.length ? (p.count / tasks.length) * 100 : 0}%` }}
                    transition={{ duration: 0.7 }}
                  >
                    {p.count > 0 && p.count}
                  </motion.div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}