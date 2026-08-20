import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Category } from '@/types'

export function useCategories(userId: string | undefined) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) {
      setCategories([])
      setLoading(false)
      return
    }

    let mounted = true
    setLoading(true)

    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('created_at', { ascending: true })
      if (!mounted) return
      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }
      setCategories((data ?? []) as Category[])
      setError(null)
      setLoading(false)
    }

    fetchCategories()

    const channel = supabase
      .channel('categories-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'categories', filter: `user_id=eq.${userId}` },
        () => {
          fetchCategories()
        }
      )
      .subscribe()

    return () => {
      mounted = false
      supabase.removeChannel(channel)
    }
  }, [userId])

  const ensureCategories = useCallback(async (): Promise<Category[]> => {
    if (!userId) return []
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('created_at', { ascending: true })
    if (error) return []
    if (data && data.length === 0) {
      const defaults: Array<Partial<Category>> = [
        { user_id: userId, name: 'Work', color: '#8b5cf6', icon: 'briefcase' },
        { user_id: userId, name: 'Personal', color: '#06b6d4', icon: 'user' },
        { user_id: userId, name: 'Health', color: '#10b981', icon: 'heart' },
        { user_id: userId, name: 'Learning', color: '#f59e0b', icon: 'book-open' },
      ]
      const ins = await supabase.from('categories').insert(defaults).select('*')
      if (!ins.error && ins.data) {
        setCategories(ins.data as Category[])
        return ins.data as Category[]
      }
    }
    setCategories((data ?? []) as Category[])
    return (data ?? []) as Category[]
  }, [userId])

  const createCategory = useCallback(
    async (name: string, color: string, icon: string): Promise<{ category: Category | null; error: string | null }> => {
      if (!userId) return { category: null, error: 'Not authenticated' }
      const { data, error } = await supabase
        .from('categories')
        .insert({ user_id: userId, name, color, icon })
        .select('*')
        .single()
      if (error) return { category: null, error: error.message }
      setCategories((prev) => [...prev, data as Category])
      return { category: data as Category, error: null }
    },
    [userId]
  )

  const value = useMemo(
    () => ({ categories, loading, error, ensureCategories, createCategory }),
    [categories, loading, error, ensureCategories, createCategory]
  )

  return value
}