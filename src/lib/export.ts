import { format, parseISO } from 'date-fns'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { Category, Task } from '@/types'
import { PRIORITY_META, getCategoryColor, escapeHtml } from './utils'

function categoryName(task: Task, categories: Category[]): string {
  const cat = categories.find((c) => c.id === task.category_id)
  return cat?.name ?? '—'
}

function dateLabel(date: string | null): string {
  return date ? format(parseISO(date), 'yyyy-MM-dd') : ''
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`
  return value
}

function downloadFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function exportTasksCsv(tasks: Task[], categories: Category[]): void {
  const header = [
    'Title',
    'Description',
    'Category',
    'Priority',
    'Status',
    'Due Date',
    'Estimated (min)',
    'Created',
    'Completed',
  ]
  const rows = tasks.map((t) => [
    csvEscape(t.title),
    csvEscape(t.description ?? ''),
    csvEscape(categoryName(t, categories)),
    t.priority,
    t.status,
    dateLabel(t.due_date),
    String(t.estimated_minutes ?? 0),
    dateLabel(t.created_at),
    t.completed_at ? dateLabel(t.completed_at) : '',
  ])
  const csv = [header, ...rows].map((r) => r.join(',')).join('\r\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  downloadFile(blob, `taskorbit-tasks-${format(new Date(), 'yyyy-MM-dd')}.csv`)
}

export interface ReportData {
  tasks: Task[]
  categories: Category[]
  totalTasks: number
  completedTasks: number
  completionRate: number
  productivityScore: number
  overdue: number
  currentStreak: number
  bestStreak: number
  weekStart: Date
  weekEnd: Date
  daily: Array<{ label: string; total: number; completed: number; rate: number; score: number }>
}

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

export function exportWeeklyPdf(data: ReportData): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()

  // Header band
  doc.setFillColor(11, 13, 18)
  doc.rect(0, 0, pageWidth, 42, 'F')
  doc.setTextColor(139, 92, 246)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('TaskOrbit', 14, 18)
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(13)
  doc.text('Weekly Productivity Report', 14, 28)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(148, 163, 184)
  doc.text(
    `${format(data.weekStart, 'MMM d, yyyy')} — ${format(data.weekEnd, 'MMM d, yyyy')}`,
    14,
    34
  )

  // Summary stats
  doc.setTextColor(30, 41, 59)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('Summary', 14, 54)

  const stats: Array<[string, string]> = [
    ['Total Tasks', String(data.totalTasks)],
    ['Completed', String(data.completedTasks)],
    ['Completion Rate', `${data.completionRate}%`],
    ['Productivity Score', `${data.productivityScore}/100`],
    ['Overdue', String(data.overdue)],
    ['Current Streak', `${data.currentStreak} day${data.currentStreak === 1 ? '' : 's'}`],
    ['Best Streak', `${data.bestStreak} day${data.bestStreak === 1 ? '' : 's'}`],
  ]
  const cardW = (pageWidth - 28 - 12) / 4
  stats.forEach(([label, value], i) => {
    const col = i % 4
    const row = Math.floor(i / 4)
    const x = 14 + col * (cardW + 4)
    const y = 60 + row * 20
    doc.setFillColor(245, 247, 250)
    doc.roundedRect(x, y, cardW, 16, 2, 2, 'F')
    doc.setTextColor(100, 116, 139)
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'normal')
    doc.text(label.toUpperCase(), x + 3, y + 5)
    doc.setTextColor(30, 41, 59)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text(value, x + 3, y + 12)
  })

  // Category breakdown
  let y = 104
  const catMap = new Map<string, { name: string; color: string; count: number; done: number }>()
  for (const t of data.tasks) {
    const cat = data.categories.find((c) => c.id === t.category_id)
    const name = cat?.name ?? 'Uncategorized'
    const color = cat?.color ?? '#64748b'
    const entry = catMap.get(name) ?? { name, color, count: 0, done: 0 }
    entry.count++
    if (t.status === 'completed') entry.done++
    catMap.set(name, entry)
  }
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 41, 59)
  doc.text('Category Breakdown', 14, y)
  y += 6
  catMap.forEach((entry) => {
    const pct = entry.count ? Math.round((entry.done / entry.count) * 100) : 0
    doc.setFillColor(...hexToRgb(entry.color))
    doc.roundedRect(14, y, 6, 6, 1, 1, 'F')
    doc.setTextColor(71, 85, 105)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(`${entry.name}`, 24, y + 4.5)
    doc.text(
      `${entry.done}/${entry.count} completed (${pct}%)`,
      pageWidth - 14,
      y + 4.5,
      { align: 'right' }
    )
    y += 8
  })

  // Priority breakdown
  y += 4
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 41, 59)
  doc.text('Priority Breakdown', 14, y)
  y += 6
  ;(['critical', 'high', 'medium', 'low'] as const).forEach((p) => {
    const count = data.tasks.filter((t) => t.priority === p).length
    doc.setFillColor(...hexToRgb(PRIORITY_META[p].color))
    doc.roundedRect(14, y, 6, 6, 1, 1, 'F')
    doc.setTextColor(71, 85, 105)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(`${PRIORITY_META[p].label}`, 24, y + 4.5)
    doc.text(`${count} task${count === 1 ? '' : 's'}`, pageWidth - 14, y + 4.5, { align: 'right' })
    y += 8
  })

  // Daily performance table
  y += 6
  autoTable(doc, {
    startY: y,
    head: [['Day', 'Tasks', 'Completed', 'Completion %', 'Score /100']],
    body: data.daily.map((d) => [
      d.label,
      String(d.total),
      String(d.completed),
      `${d.rate}%`,
      String(d.score),
    ]),
    theme: 'grid',
    headStyles: { fillColor: [139, 92, 246], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 2.5 },
  })

  // Footer
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(148, 163, 184)
    doc.text(
      `Generated ${format(new Date(), 'yyyy-MM-dd HH:mm')} — TaskFlow 3D`,
      14,
      doc.internal.pageSize.getHeight() - 8
    )
  }

  doc.save(`taskorbit-weekly-report-${format(data.weekStart, 'yyyy-MM-dd')}.pdf`)
}

export function buildReportData(
  tasks: Task[],
  categories: Category[],
  productivityScore: number,
  currentStreak: number,
  bestStreak: number,
  weekStart: Date,
  weekEnd: Date
): ReportData {
  const totalTasks = tasks.length
  const completedTasks = tasks.filter((t) => t.status === 'completed').length
  const completionRate = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0
  const overdue = tasks.filter((t) => {
    if (!t.due_date) return false
    if (t.status === 'completed' || t.status === 'cancelled') return false
    return parseISO(t.due_date) < new Date()
  }).length

  const dayLabels = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart.getTime() + i * 86400000)
    return { label: format(d, 'EEE MMM d'), day: d }
  })
  const daily = dayLabels.map(({ label, day }) => {
    const dayTasks = tasks.filter((t) => {
      if (!t.due_date) return false
      const due = parseISO(t.due_date)
      return (
        due.getFullYear() === day.getFullYear() &&
        due.getMonth() === day.getMonth() &&
        due.getDate() === day.getDate()
      )
    })
    const done = dayTasks.filter((t) => t.status === 'completed').length
    const weight = { critical: 4, high: 3, medium: 2, low: 1 }
    const wsum = dayTasks.reduce((s, t) => s + weight[t.priority], 0)
    const wdone = dayTasks.filter((t) => t.status === 'completed').reduce((s, t) => s + weight[t.priority], 0)
    const score = dayTasks.length ? Math.round((wdone / (wsum || 1)) * 100) : 0
    return {
      label,
      total: dayTasks.length,
      completed: done,
      rate: dayTasks.length ? Math.round((done / dayTasks.length) * 100) : 0,
      score,
    }
  })

  return {
    tasks,
    categories,
    totalTasks,
    completedTasks,
    completionRate,
    productivityScore,
    overdue,
    currentStreak,
    bestStreak,
    weekStart,
    weekEnd,
    daily,
  }
}

export { escapeHtml as _escapeHtml, getCategoryColor as _getCategoryColor, hexToRgba as _hexToRgba }

export const colorWithAlpha = hexToRgba