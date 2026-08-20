import { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { BarChart3, PieChart as PieIcon, TrendingUp, Circle } from 'lucide-react'
import { useTaskContext } from '@/contexts/TaskContext'
import { PRIORITY_META, STATUS_META } from '@/lib/utils'
import { computeProductivity, productivityColor } from '@/lib/productivity'
import { format, subDays } from 'date-fns'
import type { TaskPriority, TaskStatus } from '@/types'

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: '#10b981',
  medium: '#06b6d4',
  high: '#f59e0b',
  critical: '#ef4444',
}

const STATUS_COLORS: Record<TaskStatus, string> = {
  todo: '#64748b',
  in_progress: '#06b6d4',
  completed: '#10b981',
  cancelled: '#94a3b8',
}

function ChartCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3 }}
      className="glass p-5"
    >
      <div className="mb-4 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-dim text-accent">{icon}</span>
        <h3 className="font-display text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
      </div>
      {children}
    </motion.div>
  )
}

const TOOLTIP_STYLE = {
  backgroundColor: '#171b26',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '12px',
  fontSize: '12px',
  color: '#e2e8f0',
}

export default function AnalyticsPage() {
  const { tasks, tasksLoading, categories } = useTaskContext()

  const categoryData = useMemo(() => {
    const counts = new Map<string, { name: string; color: string; value: number }>()
    for (const t of tasks) {
      const cat = categories.find((c) => c.id === t.category_id)
      const name = cat?.name ?? 'Uncategorized'
      const color = cat?.color ?? '#64748b'
      const entry = counts.get(name) ?? { name, color, value: 0 }
      entry.value++
      counts.set(name, entry)
    }
    const arr = Array.from(counts.values()).sort((a, b) => b.value - a.value)
    const total = arr.reduce((s, e) => s + e.value, 0)
    return arr.map((e) => ({ ...e, pct: total ? Math.round((e.value / total) * 100) : 0 }))
  }, [tasks, categories])

  const trendData = useMemo(() => {
    const report = computeProductivity(tasks)
    const now = new Date()
    return report.daily.slice(-14).map((d, i) => ({
      label: format(subDays(now, 13 - i), 'MMM d'),
      score: d.score,
      completed: d.completed,
    }))
  }, [tasks])

  const priorityData = useMemo(() => {
    return (['low', 'medium', 'high', 'critical'] as TaskPriority[]).map((p) => ({
      name: PRIORITY_META[p].label,
      value: tasks.filter((t) => t.priority === p).length,
      color: PRIORITY_COLORS[p],
    }))
  }, [tasks])

  const statusData = useMemo(() => {
    return (['todo', 'in_progress', 'completed', 'cancelled'] as TaskStatus[]).map((s) => ({
      name: STATUS_META[s].label,
      value: tasks.filter((t) => t.status === s).length,
      color: STATUS_COLORS[s],
    }))
  }, [tasks])

  const report = useMemo(() => computeProductivity(tasks), [tasks])

  if (tasksLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-sm text-slate-400">Loading analytics…</div>
    )
  }

  const hasData = tasks.length > 0

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-800 dark:text-white">Analytics</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Real insights from your {tasks.length} tasks · Weekly score <span style={{ color: productivityColor(report.weekly) }}>{report.weekly}/100</span>
        </p>
      </div>

      {!hasData ? (
        <div className="glass flex flex-col items-center justify-center gap-3 px-6 py-20 text-center">
          <BarChart3 className="h-10 w-10 text-accent" />
          <h3 className="font-display text-base font-semibold text-slate-800 dark:text-slate-100">
            No data to analyze yet
          </h3>
          <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">
            Create and complete tasks to see your productivity trends, category distribution, and more.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {/* Category distribution */}
            <ChartCard title="Category Distribution" icon={<PieIcon className="h-4 w-4" />}>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      animationDuration={700}
                    >
                      {categoryData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Legend formatter={(v) => <span style={{ color: '#94a3b8', fontSize: 12 }}>{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                {categoryData.map((c) => (
                  <div key={c.name} className="flex items-center justify-between rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs dark:bg-white/5">
                    <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c.color }} />
                      {c.name}
                    </span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{c.pct}%</span>
                  </div>
                ))}
              </div>
            </ChartCard>

            {/* Productivity trend */}
            <ChartCard title="Productivity Trend (14 days)" icon={<TrendingUp className="h-4 w-4" />}>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.6} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Area type="monotone" dataKey="score" name="Score" stroke="#8b5cf6" strokeWidth={2} fill="url(#scoreGrad)" animationDuration={800} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            {/* Priority breakdown */}
            <ChartCard title="Priority Breakdown" icon={<BarChart3 className="h-4 w-4" />}>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={priorityData} layout="vertical" margin={{ left: 12 }}>
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} width={70} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'rgba(139,92,246,0.08)' }} />
                    <Bar dataKey="value" name="Tasks" radius={[0, 8, 8, 0]} animationDuration={700}>
                      {priorityData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            {/* Status breakdown */}
            <ChartCard title="Status Breakdown" icon={<Circle className="h-4 w-4" />}>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      animationDuration={700}
                    >
                      {statusData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Legend formatter={(v) => <span style={{ color: '#94a3b8', fontSize: 12 }}>{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                {statusData.map((s) => (
                  <div key={s.name} className="flex items-center justify-between rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs dark:bg-white/5">
                    <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                      {s.name}
                    </span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{s.value}</span>
                  </div>
                ))}
              </div>
            </ChartCard>
          </div>
        </>
      )}
    </div>
  )
}