import { createContext, useContext, useMemo, type ReactNode } from 'react'
import type { Category, Task, TaskInput, TaskUpdateInput } from '@/types'
import { useTasks } from '@/hooks/useTasks'
import { useCategories } from '@/hooks/useCategories'
import { useAuthContext } from '@/contexts/AuthContext'

interface TaskContextValue {
  tasks: Task[]
  categories: Category[]
  tasksLoading: boolean
  categoriesLoading: boolean
  error: string | null
  createTask: (input: TaskInput) => Promise<{ task: Task | null; error: string | null }>
  updateTask: (id: string, patch: Partial<TaskUpdateInput>) => Promise<{ task: Task | null; error: string | null }>
  deleteTask: (id: string) => Promise<{ error: string | null }>
  completeTask: (id: string) => Promise<{ task: Task | null; error: string | null }>
  toggleInProgress: (id: string) => Promise<{ task: Task | null; error: string | null }>
  createCategory: (name: string, color: string, icon: string) => Promise<{ category: Category | null; error: string | null }>
  ensureCategories: () => Promise<Category[]>
  getCategory: (id: string | null) => Category | null
}

const TaskContext = createContext<TaskContextValue | null>(null)

export function TaskProvider({ children }: { children: ReactNode }) {
  const { user } = useAuthContext()
  const userId = user?.id
  const tasksState = useTasks(userId)
  const categoriesState = useCategories(userId)

  const value = useMemo<TaskContextValue>(
    () => ({
      tasks: tasksState.tasks,
      tasksLoading: tasksState.loading,
      error: tasksState.error,
      createTask: tasksState.createTask,
      updateTask: tasksState.updateTask,
      deleteTask: tasksState.deleteTask,
      completeTask: tasksState.completeTask,
      toggleInProgress: tasksState.toggleInProgress,
      categories: categoriesState.categories,
      categoriesLoading: categoriesState.loading,
      createCategory: categoriesState.createCategory,
      ensureCategories: categoriesState.ensureCategories,
      getCategory: (id: string | null) =>
        id ? categoriesState.categories.find((c) => c.id === id) ?? null : null,
    }),
    [tasksState, categoriesState]
  )

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>
}

export function useTaskContext(): TaskContextValue {
  const ctx = useContext(TaskContext)
  if (!ctx) throw new Error('useTaskContext must be used within TaskProvider')
  return ctx
}