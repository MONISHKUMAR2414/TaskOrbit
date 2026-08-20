import { format, isToday, parseISO, startOfDay } from 'date-fns'
import type { Category, Task } from '@/types'
import { PRIORITY_META, isOverdue, minutesToLabel, timeToMinutes } from './utils'

export interface Recommendation {
  type: 'morning' | 'midday' | 'evening'
  subject: string
  content: string
}

const PRIORITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 } as const

function sortByPriority(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])
}

function formatTaskLine(task: Task, categoryMap: Map<string, Category>): string {
  const cat = task.category_id ? categoryMap.get(task.category_id) : undefined
  const catLabel = cat ? ` [${cat.name}]` : ''
  const dur = task.estimated_minutes ? ` — ${minutesToLabel(task.estimated_minutes)}` : ''
  return `${task.title}${dur} — ${PRIORITY_META[task.priority].label}${catLabel}`
}

function topLines(tasks: Task[], categoryMap: Map<string, Category>, max = 4): string {
  if (tasks.length === 0) return 'No priorities for now.'
  return sortByPriority(tasks)
    .slice(0, max)
    .map((t, i) => `${i + 1}. ${formatTaskLine(t, categoryMap)}`)
    .join('\n')
}

/** Morning briefing — run for today. */
export function generateMorning(tasks: Task[], categories: Category[], _hour = 8): Recommendation {
  const today = tasks.filter(
    (t) =>
      t.due_date &&
      isToday(parseISO(t.due_date)) &&
      (t.status === 'todo' || t.status === 'in_progress')
  )
  const categoryMap = new Map(categories.map((c) => [c.id, c]))
  const criticalCount = today.filter((t) => t.priority === 'critical').length
  const highCount = today.filter((t) => t.priority === 'high').length

  const subject = `Morning Briefing — ${format(new Date(), 'EEEE, MMM d')}`
  const lines = [
    `Good morning! It's ${format(new Date(), 'h:mm a')}.`,
    '',
    `You have ${today.length} task${today.length === 1 ? '' : 's'} scheduled today.`,
    ...(criticalCount > 0
      ? [`${criticalCount} critical and ${highCount} high priority.`]
      : highCount > 0
        ? [`${highCount} high priority task${highCount === 1 ? '' : 's'}.`]
        : ['A light day — perfect for deep work.']),
    '',
    'Top priorities:',
    '',
    topLines(today, categoryMap),
    '',
    'Start with the highest priority and work your way down. You have this.',
  ]
  return { type: 'morning', subject, content: lines.join('\n') }
}

/** Midday check-in — overdue + remaining high priority. */
export function generateMidday(tasks: Task[], categories: Category[], _hour = 13): Recommendation {
  const categoryMap = new Map(categories.map((c) => [c.id, c]))
  const overdue = tasks.filter((t) => isOverdue(t))
  const remainingToday = tasks.filter(
    (t) =>
      t.due_date &&
      isToday(parseISO(t.due_date)) &&
      (t.status === 'todo' || t.status === 'in_progress')
  )
  const highRemaining = remainingToday.filter(
    (t) => t.priority === 'critical' || t.priority === 'high'
  )
  const doneToday = tasks.filter(
    (t) => t.due_date && isToday(parseISO(t.due_date)) && t.status === 'completed'
  )

  const subject = `Midday Check-in — ${format(new Date(), 'MMM d')}`
  const lines = [
    "It's mid-afternoon. Let's check your progress.",
    '',
    overdue.length > 0
      ? `⚠ You have ${overdue.length} overdue task${overdue.length === 1 ? '' : 's'} that need attention.`
      : '✅ No overdue tasks. Great work staying on track.',
    highRemaining.length > 0
      ? `${highRemaining.length} high-priority task${highRemaining.length === 1 ? '' : 's'} still ahead of you.`
      : 'No critical tasks remaining for today.',
    `You've completed ${doneToday.length} task${doneToday.length === 1 ? '' : 's'} so far today.`,
    '',
    highRemaining.length > 0
      ? 'Recommended next:'
      : overdue.length > 0
        ? 'Recommended next (overdue):'
        : 'Everything looks good for today.',
    '',
    topLines(highRemaining.length > 0 ? highRemaining : overdue, categoryMap, 3),
    '',
    'Stay focused — finish the big rocks first.',
  ]
  return { type: 'midday', subject, content: lines.join('\n') }
}

/** Evening summary — what got done, what remains, tomorrow. */
export function generateEvening(tasks: Task[], categories: Category[], productivityScore = 0): Recommendation {
  const categoryMap = new Map(categories.map((c) => [c.id, c]))
  const today = tasks.filter((t) => t.due_date && isToday(parseISO(t.due_date)))
  const done = today.filter((t) => t.status === 'completed')
  const remaining = today.filter((t) => t.status === 'todo' || t.status === 'in_progress')
  const tomorrow = tasks.filter((t) => {
    if (!t.due_date) return false
    const d = parseISO(t.due_date)
    const tomorrowStart = startOfDay(new Date(Date.now() + 86400000))
    return d.getTime() === tomorrowStart.getTime() && t.status !== 'completed'
  })

  const subject = `Evening Summary — ${format(new Date(), 'MMM d')}`
  const lines = [
    `Day done. Here's how it went:`,
    '',
    done.length > 0
      ? `✅ Completed ${done.length} of ${today.length} scheduled task${today.length === 1 ? '' : 's'}.`
      : 'No tasks were completed today.',
    remaining.length > 0
      ? `📋 ${remaining.length} task${remaining.length === 1 ? '' : 's'} rolled over to tomorrow.`
      : '🎉 All tasks for today are wrapped up.',
    `Productivity score: ${productivityScore}/100`,
    '',
    tomorrow.length > 0
      ? 'Tomorrow’s priorities:'
      : 'Nothing scheduled for tomorrow yet — plan ahead to stay ahead.',
    '',
    tomorrow.length > 0 ? topLines(tomorrow, categoryMap, 4) : 'Consider scheduling tomorrow’s top 3 goals.',
    '',
    'Rest well — tomorrow is another productive day.',
  ]
  return { type: 'evening', subject, content: lines.join('\n') }
}

export function generateRecommendation(
  kind: 'morning' | 'midday' | 'evening',
  tasks: Task[],
  categories: Category[],
  productivityScore = 0
): Recommendation {
  if (kind === 'morning') return generateMorning(tasks, categories)
  if (kind === 'midday') return generateMidday(tasks, categories)
  return generateEvening(tasks, categories, productivityScore)
}

export interface AvailableWindow {
  now: Date
  todayMinutesLeft: number
}

export function availableWindow(_workStart: number, workEnd: number, now = new Date()): AvailableWindow {
  const currentMin = timeToMinutes(`${now.getHours()}:${now.getMinutes()}`) ?? now.getHours() * 60
  const endMin = workEnd * 60
  const todayMinutesLeft = Math.max(0, endMin - currentMin)
  return { now, todayMinutesLeft }
}

export function recommendationTypeForHour(hour: number): 'morning' | 'midday' | 'evening' {
  if (hour < 12) return 'morning'
  if (hour < 17) return 'midday'
  return 'evening'
}