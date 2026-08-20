import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Task, TaskInput, TaskUpdateInput } from '@/types'

export function useTasks(userId: string | undefined) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) {
      setTasks([])
      setLoading(false)
      return
    }

    let mounted = true
    setLoading(true)

    const fetchTasks = async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*, category:categories(*)')
        .order('created_at', { ascending: false })
      if (!mounted) return
      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }
      setTasks((data ?? []) as Task[])
      setError(null)
      setLoading(false)
    }

    fetchTasks()

    const channel = supabase
      .channel('tasks-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks', filter: `user_id=eq.${userId}` },
        () => {
          fetchTasks()
        }
      )
      .subscribe()

    return () => {
      mounted = false
      supabase.removeChannel(channel)
    }
  }, [userId])

  const createTask = useCallback(
    async (input: TaskInput): Promise<{ task: Task | null; error: string | null }> => {
      if (!userId) return { task: null, error: 'Not authenticated' }
      const { data, error } = await supabase
        .from('tasks')
        .insert({ ...input, user_id: userId })
        .select('*, category:categories(*)')
        .single()
      if (error) return { task: null, error: error.message }
      setTasks((prev) => [data as Task, ...prev])
      return { task: data as Task, error: null }
    },
    [userId]
  )

  const updateTask = useCallback(
    async (
      id: string,
      patch: Partial<TaskUpdateInput>
    ): Promise<{ task: Task | null; error: string | null }> => {
      const { data, error } = await supabase
        .from('tasks')
        .update(patch)
        .eq('id', id)
        .select('*, category:categories(*)')
        .single()
      if (error) return { task: null, error: error.message }
      const updated = data as Task
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)))
      return { task: updated, error: null }
    },
    []
  )

  const deleteTask = useCallback(
    async (id: string): Promise<{ error: string | null }> => {
      const { error } = await supabase.from('tasks').delete().eq('id', id)
      if (!error) setTasks((prev) => prev.filter((t) => t.id !== id))
      return { error: error?.message ?? null }
    },
    []
  )

  const completeTask = useCallback(
    async (id: string): Promise<{ task: Task | null; error: string | null }> => {
      const target = tasks.find((t) => t.id === id)
      const wasCompleted = target?.status === 'completed'
      const patch: Partial<TaskUpdateInput> = {
        status: wasCompleted ? 'todo' : 'completed',
        completed_at: wasCompleted ? null : new Date().toISOString(),
      }
      return updateTask(id, patch)
    },
    [tasks, updateTask]
  )

  const toggleInProgress = useCallback(
    async (id: string): Promise<{ task: Task | null; error: string | null }> => {
      const target = tasks.find((t) => t.id === id)
      const patch: Partial<TaskInput> = {
        status: target?.status === 'in_progress' ? 'todo' : 'in_progress',
      }
      return updateTask(id, patch)
    },
    [tasks, updateTask]
  )

  const value = useMemo(
    () => ({
      tasks,
      loading,
      error,
      createTask,
      updateTask,
      deleteTask,
      completeTask,
      toggleInProgress,
    }),
    [tasks, loading, error, createTask, updateTask, deleteTask, completeTask, toggleInProgress]
  )

  return value
}