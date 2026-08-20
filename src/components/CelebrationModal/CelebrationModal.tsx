import { useEffect, useMemo, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CalendarCheck2, Flame, ListChecks, Trophy, X } from 'lucide-react'
import { isToday, parseISO } from 'date-fns'
import { useTaskContext } from '@/contexts/TaskContext'
import { computeProductivity } from '@/lib/productivity'
import type { Task } from '@/types'

interface CelebrationModalProps {
  task: Task | null
  onClose: () => void
}

interface CelebrationStats {
  currentStreak: number
  bestStreak: number
  completedToday: number
  totalCompleted: number
}

const CONFETTI_COLORS = ['#8b5cf6', '#06b6d4', '#f59e0b', '#10b981', '#ef4444', '#a78bfa', '#22d3ee', '#f472b6']

interface ConfettiPiece {
  id: number
  x: string
  y: string
  rotate: number
  color: string
  size: number
  duration: number
  delay: number
  round: boolean
}

function collectStats(tasks: Task[]): CelebrationStats {
  const now = new Date()
  const report = computeProductivity(tasks, now)
  const completedToday = tasks.filter(
    (t) => t.status === 'completed' && t.completed_at && isToday(parseISO(t.completed_at))
  ).length
  return {
    currentStreak: report.currentStreak,
    bestStreak: report.bestStreak,
    completedToday,
    totalCompleted: report.completedTasks,
  }
}

function motivate(streak: number): string {
  if (streak <= 1) return 'Every journey begins with a single step. What a great start!'
  if (streak < 5) return 'Momentum is building — keep the streak alive!'
  if (streak < 10) return 'You are on fire! Consistency is your superpower.'
  if (streak < 20) return 'Unstoppable! You are forging legendary habits.'
  return 'Legendary. Nothing can stand in your way now!'
}

function makeConfetti(): ConfettiPiece[] {
  return Array.from({ length: 70 }, (_, i) => ({
    id: i,
    x: `${(Math.random() - 0.5) * 90}vw`,
    y: `${30 + Math.random() * 65}vh`,
    rotate: Math.random() * 720 - 360,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    size: 6 + Math.random() * 8,
    duration: 1.1 + Math.random() * 1,
    delay: Math.random() * 0.2,
    round: i % 3 === 0,
  }))
}

const ENTRANCE_TRANSITION = { type: 'spring', stiffness: 240, damping: 16, mass: 0.9 } as const
const EXIT_TRANSITION = { duration: 0.25, ease: 'easeIn' } as const

export function CelebrationModal({ task, onClose }: CelebrationModalProps) {
  const { tasks } = useTaskContext()
  const dialogRef = useRef<HTMLDivElement>(null)
  const stats = useMemo<CelebrationStats | null>(() => (task ? collectStats(tasks) : null), [task, tasks])
  const confetti = useMemo<ConfettiPiece[]>(() => (task ? makeConfetti() : []), [task])

  useEffect(() => {
    if (!task) return
    const dialog = dialogRef.current
    const previouslyFocused = document.activeElement as HTMLElement | null
    const getFocusable = () =>
      dialog
        ? Array.from(
            dialog.querySelectorAll<HTMLElement>(
              'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            )
          ).filter((el) => !el.hasAttribute('disabled'))
        : []
    const focusables = getFocusable()
    ;(focusables[0] ?? dialog)?.focus()

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }
      if (e.key === 'Tab') {
        const els = getFocusable()
        if (els.length === 0) return
        const first = els[0]
        const last = els[els.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      previouslyFocused?.focus?.()
    }
  }, [task, onClose])

  return (
    <AnimatePresence>
      {task && stats && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 sm:p-6">
          <motion.button
            aria-label="Close celebration"
            className="absolute inset-0 h-full w-full cursor-default bg-black/55 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
          />

          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="celebration-title"
            aria-describedby="celebration-message"
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-accent/25 bg-white/90 p-6 text-center shadow-2xl backdrop-blur-xl sm:max-w-lg sm:p-8 dark:bg-[#151a28]/90"
            initial={{ opacity: 0, y: -64, scale: 0.7 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 56, scale: 0.9, transition: EXIT_TRANSITION }}
            transition={ENTRANCE_TRANSITION}
          >
            <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-accent/25 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 -left-16 h-44 w-44 rounded-full bg-cyan-500/20 blur-3xl" />

            <button
              onClick={onClose}
              aria-label="Close celebration"
              className="absolute right-3 top-3 z-10 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/10 dark:hover:text-slate-200"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="relative mx-auto mb-5 h-20 w-20">
              <motion.span
                className="absolute inset-0 rounded-full bg-emerald-400/30"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1.8, opacity: 0 }}
                transition={{ duration: 1, delay: 0.25 }}
              />
              <motion.span
                className="absolute inset-0 rounded-full bg-accent/25"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1.4, opacity: 0 }}
                transition={{ duration: 0.9, delay: 0.4 }}
              />
              <motion.div
                className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/40"
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 14, delay: 0.15 }}
              >
                <svg viewBox="0 0 52 52" className="h-12 w-12 text-white" fill="none">
                  <motion.path
                    d="M14 27l8 8 16-16"
                    stroke="currentColor"
                    strokeWidth={6}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.5, delay: 0.35 }}
                  />
                </svg>
              </motion.div>
            </div>

            <p className="text-xs font-bold uppercase tracking-[0.22em] text-accent">Task completed</p>
            <h2
              id="celebration-title"
              className="mt-1 font-display text-2xl font-bold text-slate-900 sm:text-3xl dark:text-white"
            >
              Successfully Completed <span className="bg-gradient-to-r from-accent via-fuchsia-500 to-cyan-400 bg-clip-text text-transparent">Today!</span>
            </h2>
            <p id="celebration-message" className="mt-1.5 truncate px-2 text-sm text-slate-500 dark:text-slate-400">
              {task.title}
            </p>

            <div className="mt-6 flex items-end justify-center gap-2.5">
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 12, delay: 0.3 }}
                className="mb-1 text-orange-500 drop-shadow-[0_0_14px_rgba(249,115,22,0.55)]"
              >
                <Flame className="h-10 w-10" />
              </motion.span>
              <motion.span
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 240, damping: 12, delay: 0.35 }}
                className="font-display text-7xl font-black leading-none bg-gradient-to-br from-accent via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent"
              >
                {stats.currentStreak}
              </motion.span>
              <span className="pb-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
                {stats.currentStreak === 1 ? 'day' : 'days'} streak
              </span>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-3">
              <div className="rounded-2xl border border-slate-200/70 bg-white/70 px-2 py-3 dark:border-white/10 dark:bg-white/5">
                <CalendarCheck2 className="mx-auto h-4 w-4 text-emerald-500" />
                <p className="mt-1.5 font-display text-xl font-bold text-slate-800 dark:text-white">{stats.completedToday}</p>
                <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Today</p>
              </div>
              <div className="rounded-2xl border border-slate-200/70 bg-white/70 px-2 py-3 dark:border-white/10 dark:bg-white/5">
                <ListChecks className="mx-auto h-4 w-4 text-cyan-500" />
                <p className="mt-1.5 font-display text-xl font-bold text-slate-800 dark:text-white">{stats.totalCompleted}</p>
                <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Completed</p>
              </div>
              <div className="rounded-2xl border border-slate-200/70 bg-white/70 px-2 py-3 dark:border-white/10 dark:bg-white/5">
                <Trophy className="mx-auto h-4 w-4 text-amber-500" />
                <p className="mt-1.5 font-display text-xl font-bold text-slate-800 dark:text-white">{stats.bestStreak}</p>
                <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Best Streak</p>
              </div>
            </div>

            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.4 }}
              className="mt-5 text-sm italic text-slate-500 dark:text-slate-400"
            >
              “{motivate(stats.currentStreak)}”
            </motion.p>
          </motion.div>

          {confetti.length > 0 && (
            <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
              {confetti.map((p) => (
                <motion.span
                  key={p.id}
                  initial={{ opacity: 1, x: 0, y: 0, rotate: 0, scale: 1 }}
                  animate={{ opacity: 0, x: p.x, y: p.y, rotate: p.rotate, scale: 0.6 }}
                  transition={{ duration: p.duration, delay: p.delay, ease: 'easeIn' }}
                  className="absolute"
                  style={{
                    left: '50%',
                    top: '42%',
                    width: p.size,
                    height: p.size,
                    backgroundColor: p.color,
                    borderRadius: p.round ? '50%' : '2px',
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </AnimatePresence>
  )
}