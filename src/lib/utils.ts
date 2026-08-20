import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import {
  format,
  isToday,
  isTomorrow,
  isYesterday,
  startOfDay,
  parseISO,
} from 'date-fns'
import type { Category, Task, TaskPriority, TaskStatus } from '@/types'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

export const PRIORITY_META: Record<
  TaskPriority,
  { label: string; color: string; dot: string; weight: number; sortOrder: number }
> = {
  critical: {
    label: 'Critical',
    color: '#ef4444',
    dot: 'bg-red-500',
    weight: 4,
    sortOrder: 0,
  },
  high: {
    label: 'High',
    color: '#f59e0b',
    dot: 'bg-amber-500',
    weight: 3,
    sortOrder: 1,
  },
  medium: {
    label: 'Medium',
    color: '#06b6d4',
    dot: 'bg-cyan-500',
    weight: 2,
    sortOrder: 2,
  },
  low: {
    label: 'Low',
    color: '#10b981',
    dot: 'bg-emerald-500',
    weight: 1,
    sortOrder: 3,
  },
}

export const STATUS_META: Record<
  TaskStatus,
  { label: string; color: string; icon: string }
> = {
  todo: { label: 'Todo', color: '#64748b', icon: 'circle' },
  in_progress: { label: 'In Progress', color: '#06b6d4', icon: 'loader' },
  completed: { label: 'Completed', color: '#10b981', icon: 'check' },
  cancelled: { label: 'Cancelled', color: '#94a3b8', icon: 'x' },
}

export function statusOrder(status: TaskStatus): number {
  if (status === 'completed') return 0
  if (status === 'in_progress') return 1
  if (status === 'todo') return 2
  return 3
}

export function getCategoryColor(category: Category | null | undefined, fallback = '#8b5cf6'): string {
  return category?.color ?? fallback
}

export function taskCompletionPct(tasks: Task[]): number {
  if (!tasks.length) return 0
  const done = tasks.filter((t) => t.status === 'completed').length
  return Math.round((done / tasks.length) * 100)
}

export function formatDueDate(date: string | null): string {
  if (!date) return 'No due date'
  const d = parseISO(date)
  if (isToday(d)) return 'Today'
  if (isTomorrow(d)) return 'Tomorrow'
  if (isYesterday(d)) return 'Yesterday'
  return format(d, 'EEE, MMM d')
}

export function formatDueShort(date: string | null): string {
  if (!date) return '—'
  return format(parseISO(date), 'MMM d')
}

export function isOverdue(task: Task): boolean {
  if (!task.due_date) return false
  if (task.status === 'completed' || task.status === 'cancelled') return false
  return startOfDay(parseISO(task.due_date)) < startOfDay(new Date())
}

export function dueToday(task: Task): boolean {
  if (!task.due_date) return false
  return isToday(parseISO(task.due_date))
}

export function timeToMinutes(time: string | null): number | null {
  if (!time) return null
  const [h, m] = time.split(':').map((n) => parseInt(n, 10))
  if (Number.isNaN(h) || Number.isNaN(m)) return null
  return h * 60 + m
}

export function minutesToLabel(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m ? `${h}h ${m}m` : `${h}h`
}

export function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
}

export function getInitials(user: { full_name?: string; email?: string } | null): string {
  if (user?.full_name) return initials(user.full_name)
  if (user?.email) return initials(user.email.split('@')[0])
  return 'U'
}

export function escapeHtml(str: string): string {
  return str.replace(/[&<>"']/g, (c) => {
    const map: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }
    return map[c]
  })
}

export function timeAgo(iso: string): string {
  const then = parseISO(iso).getTime()
  const diff = Date.now() - then
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return format(parseISO(iso), 'MMM d')
}