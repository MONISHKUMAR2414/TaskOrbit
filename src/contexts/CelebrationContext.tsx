import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import type { Task } from '@/types'
import { CelebrationModal } from '@/components/CelebrationModal/CelebrationModal'

interface CelebrationContextValue {
  celebrate: (task: Task) => void
}

const CelebrationContext = createContext<CelebrationContextValue | null>(null)

export function CelebrationProvider({ children }: { children: ReactNode }) {
  const [task, setTask] = useState<Task | null>(null)

  const celebrate = useCallback((t: Task) => setTask(t), [])
  const close = useCallback(() => setTask(null), [])

  const value = useMemo<CelebrationContextValue>(() => ({ celebrate }), [celebrate])

  return (
    <CelebrationContext.Provider value={value}>
      {children}
      <CelebrationModal task={task} onClose={close} />
    </CelebrationContext.Provider>
  )
}

export function useCelebration(): CelebrationContextValue {
  const ctx = useContext(CelebrationContext)
  if (!ctx) throw new Error('useCelebration must be used within CelebrationProvider')
  return ctx
}