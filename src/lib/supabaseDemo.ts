import type { Session, User } from '@supabase/supabase-js'
import type { Category, Profile, Task, TaskInput, TaskUpdateInput } from '@/types'

/**
 * Lightweight offline demo backend backed by localStorage.
 * Activated automatically when Supabase env vars are missing so the app is
 * fully usable for evaluation. Real deployments use the live Supabase client.
 */

const DEMO_USER: User = {
  id: 'demo-user-001',
  app_metadata: {},
  user_metadata: { full_name: 'Demo User' },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
} as User

const AUTH_FLAG = 'taskflow-demo-authenticated'

function setAuthed(v: boolean): void {
  localStorage.setItem(AUTH_FLAG, v ? '1' : '0')
}

function isAuthed(): boolean {
  return localStorage.getItem(AUTH_FLAG) === '1'
}

function store<T>(key: string, value: T): void {
  localStorage.setItem(`taskflow-demo-${key}`, JSON.stringify(value))
}

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(`taskflow-demo-${key}`)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function uid(): string {
  return `task-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function nowIso(): string {
  return new Date().toISOString()
}

const DB = {
  get tasks() {
    return load<(Task & { category?: Category | null })[]>('tasks', [])
  },
  set tasks(v: Task[]) {
    store('tasks', v)
  },
  get categories() {
    return load<Category[]>('categories', [])
  },
  set categories(v: Category[]) {
    store('categories', v)
  },
  get recommendations() {
    return load<{ id: string; user_id: string; type: string; subject: string; content: string; created_at: string }[]>('recommendations', [])
  },
  set recommendations(v: { id: string; user_id: string; type: string; subject: string; content: string; created_at: string }[]) {
    store('recommendations', v)
  },
  get profile(): Profile {
    const existing = load<Partial<Profile> | null>('profile', null)
    const defaults: Profile = {
      id: DEMO_USER.id,
      full_name: 'Demo User',
      email: 'demo@taskorbit.local',
      avatar_url: '',
      theme: 'dark',
      daily_goal: 5,
      work_hours_start: 9,
      work_hours_end: 18,
      default_duration: 60,
      created_at: nowIso(),
      updated_at: nowIso(),
    }
    return { ...defaults, ...existing } as Profile
  },
  set profile(v: Profile) {
    store('profile', v)
  },
  get profiles(): Profile[] {
    return [DB.profile]
  },
  set profiles(v: Profile[]) {
    DB.profile = v[0] ?? DB.profile
  },
}

function seedCategories(): Category[] {
  const existing = DB.categories
  if (existing.length === 0) {
    const cats: Category[] = [
      { id: 'cat-work', user_id: DEMO_USER.id, name: 'Work', color: '#8b5cf6', icon: 'briefcase', created_at: nowIso() },
      { id: 'cat-personal', user_id: DEMO_USER.id, name: 'Personal', color: '#06b6d4', icon: 'user', created_at: nowIso() },
      { id: 'cat-health', user_id: DEMO_USER.id, name: 'Health', color: '#10b981', icon: 'heart', created_at: nowIso() },
      { id: 'cat-learning', user_id: DEMO_USER.id, name: 'Learning', color: '#f59e0b', icon: 'book-open', created_at: nowIso() },
    ]
    DB.categories = cats
    return cats
  }
  return existing
}

function attachCategory(tasks: Task[]): Array<Task & { category: Category | null }> {
  const cats = DB.categories
  return tasks.map((t) => ({ ...t, category: cats.find((c) => c.id === t.category_id) ?? null }))
}
void attachCategory

interface DemoResult<T> {
  data: T[] | null
  error: { message: string } | null
}

interface DemoQueryBuilder<T extends { id: string }> {
  select: () => DemoQueryBuilder<T>
  insert: (rows: Partial<T> | Array<Partial<T>>) => DemoQueryBuilder<T>
  update: (patch: Partial<T>) => DemoQueryBuilder<T>
  delete: () => DemoQueryBuilder<T>
  eq: (col: string, val: unknown) => DemoQueryBuilder<T>
  order: (col: string, opts?: { ascending?: boolean }) => DemoQueryBuilder<T>
  limit: (n: number) => DemoQueryBuilder<T>
  range: (from: number, to: number) => DemoQueryBuilder<T>
  maybeSingle: () => Promise<{ data: T | null; error: { message: string } | null }>
  single: () => Promise<{ data: T | null; error: { message: string } | null }>
  then: <TR, TF>(onFul: (v: DemoResult<T>) => TR | PromiseLike<TR>, onRej?: (r: unknown) => TF | PromiseLike<TF>) => Promise<TR | TF>
  catch: <TR>(onRej: (r: unknown) => TR | PromiseLike<TR>) => Promise<TR | DemoResult<T>>
}

function makeBuilder<T extends { id: string }>(table: string): DemoQueryBuilder<T> {
  const filters: Array<(rows: T[]) => T[]> = []
  let mode: 'select' | 'update' | 'delete' | 'insert' | 'none' = 'none'
  let updatePatch: Partial<T> | null = null
  let insertRows: Array<Partial<T>> = []
  let resolved = false
  let lastResult: DemoResult<T> = { data: null, error: null }

  const allRows = (): T[] => (DB as Record<string, unknown>)[table as never] as T[]

  const applyFilters = (rows: T[]): T[] => filters.reduce((acc, f) => f(acc), rows)

  const run = (): DemoResult<T> => {
    const full = allRows()

    if (mode === 'insert') {
      const newRows = insertRows.map((r) =>
        ({ ...r, id: r.id ?? uid(), user_id: (r as { user_id?: string }).user_id ?? DEMO_USER.id, created_at: nowIso() } as unknown as T)
      )
      ;(DB as Record<string, unknown>)[table as never] = [...newRows, ...full] as never
      return { data: newRows, error: null }
    }

    if (mode === 'update' && updatePatch) {
      const matched = applyFilters(full)
      const matchedIds = new Set(matched.map((r) => r.id))
      const next = full.map((r) => (matchedIds.has(r.id) ? { ...r, ...updatePatch, updated_at: nowIso() } : r))
      ;(DB as Record<string, unknown>)[table as never] = next as never
      return { data: applyFilters(next), error: null }
    }

    if (mode === 'delete') {
      const matched = applyFilters(full)
      const matchedIds = new Set(matched.map((r) => r.id))
      const next = full.filter((r) => !matchedIds.has(r.id))
      ;(DB as Record<string, unknown>)[table as never] = next as never
      return { data: matched, error: null }
    }

    return { data: applyFilters(full), error: null }
  }

  const builder: DemoQueryBuilder<T> = {
    select: () => {
      if (mode === 'none') mode = 'select'
      return builder
    },
    insert: (rows) => {
      mode = 'insert'
      insertRows = Array.isArray(rows) ? rows : [rows]
      return builder
    },
    update: (patch) => {
      mode = 'update'
      updatePatch = patch
      return builder
    },
    delete: () => {
      mode = 'delete'
      return builder
    },
    eq: (col, val) => {
      filters.push((rows) => rows.filter((r) => r[col as keyof T] === val))
      return builder
    },
    order: (col, opts) => {
      const dir = opts?.ascending === false ? -1 : 1
      filters.push((rows) =>
        [...rows].sort((a, b) => {
          const av = a[col as keyof T] as unknown
          const bv = b[col as keyof T] as unknown
          if (av === null || av === undefined) return 1
          if (bv === null || bv === undefined) return -1
          return String(av).localeCompare(String(bv), undefined, { numeric: true }) * dir
        })
      )
      return builder
    },
    limit: (n) => {
      filters.push((rows) => rows.slice(0, n))
      return builder
    },
    range: (from, to) => {
      filters.push((rows) => rows.slice(from, to + 1))
      return builder
    },
    maybeSingle: async () => {
      if (resolved) return { data: (lastResult.data?.[0] as T) ?? null, error: null }
      const res = run()
      resolved = true
      lastResult = res
      return { data: (res.data?.[0] as T) ?? null, error: null }
    },
    single: async () => {
      if (resolved) return { data: (lastResult.data?.[0] as T) ?? null, error: null }
      const res = run()
      resolved = true
      lastResult = res
      return { data: (res.data?.[0] as T) ?? null, error: null }
    },
    then: (onFul, onRej) => {
      if (resolved) return Promise.resolve(lastResult).then(onFul, onRej)
      const res = run()
      resolved = true
      lastResult = res
      return Promise.resolve(res).then(onFul, onRej)
    },
    catch: (onRej) => {
      if (resolved) return Promise.resolve(lastResult).then((v) => v, onRej)
      const res = run()
      resolved = true
      lastResult = res
      return Promise.resolve(res).then((v) => v, onRej)
    },
  }

  return builder
}

const session: Session = {
  access_token: 'demo-token',
  refresh_token: 'demo-refresh',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  token_type: 'bearer',
  user: DEMO_USER,
} as Session

export const isDemoMode = true

export const supabase = {
  auth: {
    getSession: async () => {
      if (!isAuthed()) return { data: { session: null }, error: null }
      return { data: { session }, error: null }
    },
    onAuthStateChange: () => {
      return {
        data: {
          subscription: { unsubscribe: () => undefined },
        },
        error: null,
      }
    },
    signUp: async ({ email, options }: { email: string; password: string; options?: { data?: Record<string, string> } }) => {
      seedCategories()
      setAuthed(true)
      const fullName = options?.data?.full_name ?? ''
      DB.profile = { ...DB.profile, full_name: fullName, email, updated_at: nowIso() }
      return { data: { user: DEMO_USER, session }, error: null }
    },
    signInWithPassword: async ({ email }: { email: string }) => {
      seedCategories()
      setAuthed(true)
      DB.profile = { ...DB.profile, email, updated_at: nowIso() }
      return { data: { user: DEMO_USER, session }, error: null }
    },
    signOut: async () => {
      setAuthed(false)
      return { error: null }
    },
  },
  from: (table: 'tasks' | 'categories' | 'profiles' | 'email_recommendations') => {
    if (table === 'tasks') return makeBuilder<Task & { category?: Category | null }>('tasks') as unknown as never
    if (table === 'categories') {
      seedCategories()
      return makeBuilder<Category>('categories') as unknown as never
    }
    if (table === 'profiles') {
      return makeBuilder<Profile>('profiles') as unknown as never
    }
    return makeBuilder<{ id: string; user_id: string; type: string; subject: string; content: string; created_at: string }>('recommendations') as unknown as never
  },
  channel: () => ({
    on: () => ({ subscribe: () => ({ unsubscribe: () => undefined }) }),
  }),
  removeChannel: () => Promise.resolve(),
  rpc: async () => ({ data: null, error: null }),
} as unknown as import('@supabase/supabase-js').SupabaseClient

// Re-export the demo tables typed against the real schema for consistent TS use.
export type { Session, User, Task, TaskInput, TaskUpdateInput, Profile, Category }