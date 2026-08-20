import { differenceInCalendarDays, endOfDay, isAfter, isBefore, parseISO, startOfDay } from 'date-fns'
import type { Task } from '@/types'
import { PRIORITY_META } from './utils'

const WEIGHTS = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
} as const

const SCORE_COMPONENTS = {
  completion: 0.35,
  priority: 0.3,
  deadline: 0.2,
  duration: 0.15,
} as const

export interface DayScore {
  date: string
  total: number
  completed: number
  score: number
  completionRate: number
}

export interface ProductivityReport {
  daily: DayScore[]
  today: number
  weekly: number
  monthly: number
  currentStreak: number
  bestStreak: number
  totalTasks: number
  completedTasks: number
  completionRate: number
  overdue: number
}

function dayKey(d: Date): string {
  return startOfDay(d).toISOString()
}

function deadlineAdherence(task: Task): number {
  if (!task.completed_at) return 0
  const completed = parseISO(task.completed_at)
  if (!task.due_date) return 50
  const due = endOfDay(parseISO(task.due_date))
  if (isBefore(completed, due) || completed.getTime() === due.getTime()) return 100
  if (isAfter(completed, due) && isBefore(completed, new Date(due.getTime() + 86400000))) return 70
  return 30
}

function dayTaskScore(tasks: Task[]): number {
  if (tasks.length === 0) return 0
  const total = tasks.length
  const completed = tasks.filter((t) => t.status === 'completed')

  const completionRate = (completed.length / total) * 100

  const weightSum = tasks.reduce((sum, t) => sum + WEIGHTS[t.priority], 0)
  const completedWeightSum = completed.reduce((sum, t) => sum + WEIGHTS[t.priority], 0)
  const priorityCredit = weightSum > 0 ? (completedWeightSum / weightSum) * 100 : 0

  const deadlineCredit = completed.length
    ? completed.reduce((sum, t) => sum + deadlineAdherence(t), 0) / completed.length
    : 0

  const estSum = tasks.reduce((sum, t) => sum + (t.estimated_minutes || 0), 0)
  const completedEst = completed.reduce((sum, t) => sum + (t.estimated_minutes || 0), 0)
  const durationCredit = estSum > 0 ? (completedEst / estSum) * 100 : 0

  const score =
    completionRate * SCORE_COMPONENTS.completion +
    priorityCredit * SCORE_COMPONENTS.priority +
    deadlineCredit * SCORE_COMPONENTS.deadline +
    durationCredit * SCORE_COMPONENTS.duration

  return Math.round(score)
}

/** Group tasks by the day they belong to (due_date when present, else created day). */
export function groupTasksByDay(tasks: Task[], reference: Date, days: number): DayScore[] {
  const start = startOfDay(reference)
  const byDay = new Map<string, Task[]>()

  for (const t of tasks) {
    const key = t.due_date ? startOfDay(parseISO(t.due_date)).toISOString() : dayKey(parseISO(t.created_at))
    const arr = byDay.get(key) ?? []
    arr.push(t)
    byDay.set(key, arr)
  }

  const result: DayScore[] = []
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(start.getTime() - i * 86400000)
    const key = dayKey(date)
    const dayTasks = byDay.get(key) ?? []
    result.push({
      date: key,
      total: dayTasks.length,
      completed: dayTasks.filter((t) => t.status === 'completed').length,
      score: dayTaskScore(dayTasks),
      completionRate: dayTasks.length
        ? Math.round((dayTasks.filter((t) => t.status === 'completed').length / dayTasks.length) * 100)
        : 0,
    })
  }
  return result
}

function average(scores: DayScore[]): number {
  const withTasks = scores.filter((s) => s.total > 0)
  if (withTasks.length === 0) return 0
  return Math.round(withTasks.reduce((sum, s) => sum + s.score, 0) / withTasks.length)
}

function computeStreaks(daily: DayScore[], today: Date): { current: number; best: number } {
  const activeDays = new Set(daily.filter((d) => d.completed > 0).map((d) => d.date.slice(0, 10)))

  let current = 0
  let cursor = startOfDay(today)
  if (!activeDays.has(cursor.toISOString().slice(0, 10))) {
    cursor = new Date(cursor.getTime() - 86400000)
  }
  while (activeDays.has(cursor.toISOString().slice(0, 10))) {
    current++
    cursor = new Date(cursor.getTime() - 86400000)
  }

  let best = 0
  let run = 0
  let prevKey: string | null = null
  const sorted = [...activeDays].sort()
  for (const key of sorted) {
    if (prevKey === null) {
      run = 1
    } else {
      const gap = differenceInCalendarDays(parseISO(key), parseISO(prevKey))
      run = gap === 1 ? run + 1 : 1
    }
    prevKey = key
    best = Math.max(best, run)
  }
  return { current, best }
}

export function computeProductivity(tasks: Task[], now = new Date()): ProductivityReport {
  const daily = groupTasksByDay(tasks, now, 30)
  const week = groupTasksByDay(tasks, now, 7)
  const todayScore = daily[daily.length - 1]
  const totalTasks = tasks.length
  const completedTasks = tasks.filter((t) => t.status === 'completed').length
  const overdue = tasks.filter((t) => {
    if (!t.due_date) return false
    if (t.status === 'completed' || t.status === 'cancelled') return false
    return isBefore(parseISO(t.due_date), startOfDay(now))
  }).length
  const { current, best } = computeStreaks(daily, now)

  return {
    daily,
    today: todayScore?.score ?? 0,
    weekly: average(week),
    monthly: average(daily),
    currentStreak: current,
    bestStreak: best,
    totalTasks,
    completedTasks,
    completionRate: totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0,
    overdue,
  }
}

export function productivityColor(score: number): string {
  if (score >= 80) return '#10b981'
  if (score >= 60) return '#06b6d4'
  if (score >= 40) return '#f59e0b'
  return '#ef4444'
}

export function priorityWeight(p: keyof typeof WEIGHTS): number {
  return WEIGHTS[p]
}

export function priorityLabel(p: keyof typeof WEIGHTS): string {
  return PRIORITY_META[p].label
}