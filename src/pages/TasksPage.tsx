import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Filter, Plus, Search, SlidersHorizontal, X } from 'lucide-react'
import { useTaskContext } from '@/contexts/TaskContext'
import { useDebounce } from '@/hooks/useUi'
import { TaskCard } from '@/components/Tasks/TaskCard'
import { TaskModal } from '@/components/Tasks/TaskModal'
import { EmptyState } from '@/components/common/EmptyState'
import { PageLoader } from '@/components/common/Spinner'
import { PRIORITY_META, STATUS_META, statusOrder } from '@/lib/utils'
import type { SortKey, SortOrder, Task, TaskPriority, TaskStatus } from '@/types'
import { cn } from '@/lib/utils'

const PRIORITY_FILTERS = ['all', ...Object.keys(PRIORITY_META)] as Array<TaskPriority | 'all'>
const STATUS_FILTERS = ['all', ...Object.keys(STATUS_META)] as Array<TaskStatus | 'all'>

export default function TasksPage() {
  const { tasks, tasksLoading, categories } = useTaskContext()
  const [searchParams, setSearchParams] = useSearchParams()

  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all')
  const [dueFilter, setDueFilter] = useState<'all' | 'today' | 'upcoming' | 'overdue' | 'none'>('all')
  const [sortKey, setSortKey] = useState<SortKey>('due_date')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
  const [showFilters, setShowFilters] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  const debouncedSearch = useDebounce(search, 250)

  useEffect(() => {
    const openId = searchParams.get('open')
    if (openId) {
      const found = tasks.find((t) => t.id === openId)
      if (found) {
        setEditingTask(found)
        setModalOpen(true)
        setSearchParams({}, { replace: true })
      }
    }
  }, [searchParams, tasks, setSearchParams])

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase()
    let result = tasks.filter((t) => {
      if (q) {
        const cat = t.category?.name ?? ''
        if (
          !t.title.toLowerCase().includes(q) &&
          !(t.description ?? '').toLowerCase().includes(q) &&
          !cat.toLowerCase().includes(q)
        ) {
          return false
        }
      }
      if (categoryFilter !== 'all' && t.category_id !== categoryFilter) return false
      if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false
      if (statusFilter !== 'all' && t.status !== statusFilter) return false
      if (dueFilter === 'today' && (!t.due_date || new Date(t.due_date).toDateString() !== new Date().toDateString())) return false
      if (dueFilter === 'upcoming' && (!t.due_date || new Date(t.due_date) < new Date())) return false
      if (dueFilter === 'overdue') {
        if (!t.due_date || new Date(t.due_date) >= new Date()) return false
        if (t.status === 'completed' || t.status === 'cancelled') return false
      }
      if (dueFilter === 'none' && t.due_date) return false
      return true
    })

    result = [...result].sort((a, b) => {
      let cmp = 0
      if (sortKey === 'priority') {
        cmp = PRIORITY_META[a.priority].sortOrder - PRIORITY_META[b.priority].sortOrder
      } else if (sortKey === 'due_date') {
        if (!a.due_date && !b.due_date) cmp = 0
        else if (!a.due_date) cmp = 1
        else if (!b.due_date) cmp = -1
        else cmp = new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
      } else if (sortKey === 'created_at') {
        cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      } else {
        cmp = a.title.localeCompare(b.title)
      }
      if (sortOrder === 'desc') cmp = -cmp
      if (cmp === 0) cmp = statusOrder(a.status) - statusOrder(b.status)
      return cmp
    })

    return result
  }, [tasks, debouncedSearch, categoryFilter, priorityFilter, statusFilter, dueFilter, sortKey, sortOrder])

  const hasActiveFilters =
    search !== '' ||
    categoryFilter !== 'all' ||
    priorityFilter !== 'all' ||
    statusFilter !== 'all' ||
    dueFilter !== 'all'

  const resetFilters = () => {
    setSearch('')
    setCategoryFilter('all')
    setPriorityFilter('all')
    setStatusFilter('all')
    setDueFilter('all')
    setSortKey('due_date')
    setSortOrder('asc')
  }

  if (tasksLoading) return <PageLoader />

  const handleEdit = (task: Task) => {
    setEditingTask(task)
    setModalOpen(true)
  }

  const handleNew = () => {
    setEditingTask(null)
    setModalOpen(true)
  }

  const activeCount = [
    search,
    categoryFilter,
    priorityFilter,
    statusFilter,
    dueFilter,
  ].filter((f) => f && f !== 'all').length

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-800 dark:text-white">Tasks</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {filtered.length} of {tasks.length} tasks
          </p>
        </div>
        <button className="btn-primary" onClick={handleNew}>
          <Plus className="h-4 w-4" /> New Task
        </button>
      </div>

      {/* Search + filters */}
      <div className="glass p-3 sm:p-4">
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              className="input pl-10"
              placeholder="Search by title, description, category…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search tasks"
            />
          </div>
          <button
            className={cn('btn-secondary shrink-0', showFilters && 'border-accent text-accent')}
            onClick={() => setShowFilters((s) => !s)}
            aria-expanded={showFilters}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {activeCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white">
                {activeCount}
              </span>
            )}
          </button>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <div>
                  <label className="label" htmlFor="f-cat">Category</label>
                  <select id="f-cat" className="input" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                    <option value="all">All categories</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label" htmlFor="f-priority">Priority</label>
                  <select id="f-priority" className="input" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value as TaskPriority | 'all')}>
                    {PRIORITY_FILTERS.map((p) => (
                      <option key={p} value={p}>{p === 'all' ? 'All priorities' : PRIORITY_META[p].label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label" htmlFor="f-status">Status</label>
                  <select id="f-status" className="input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as TaskStatus | 'all')}>
                    {STATUS_FILTERS.map((s) => (
                      <option key={s} value={s}>{s === 'all' ? 'All statuses' : STATUS_META[s].label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label" htmlFor="f-due">Due Date</label>
                  <select id="f-due" className="input" value={dueFilter} onChange={(e) => setDueFilter(e.target.value as typeof dueFilter)}>
                    <option value="all">Any due date</option>
                    <option value="today">Due today</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="overdue">Overdue</option>
                    <option value="none">No due date</option>
                  </select>
                </div>
                <div>
                  <label className="label" htmlFor="f-sort">Sort By</label>
                  <div className="flex gap-2">
                    <select id="f-sort" className="input" value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)}>
                      <option value="due_date">Deadline</option>
                      <option value="priority">Priority</option>
                      <option value="created_at">Created date</option>
                      <option value="title">Title</option>
                    </select>
                    <button
                      className="btn-secondary shrink-0 px-3"
                      onClick={() => setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'))}
                      title={`Sort ${sortOrder === 'asc' ? 'ascending' : 'descending'}`}
                    >
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </button>
                  </div>
                </div>
              </div>
              {hasActiveFilters && (
                <button className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline" onClick={resetFilters}>
                  <X className="h-3.5 w-3.5" /> Clear all filters
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Task list */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Filter className="h-6 w-6" />}
          title={hasActiveFilters ? 'No tasks match your filters' : 'No tasks yet'}
          description={
            hasActiveFilters
              ? 'Try adjusting your search or clearing filters.'
              : 'Create your first task to start building your 3D productivity world.'
          }
          action={
            <button className="btn-primary" onClick={handleNew}>
              <Plus className="h-4 w-4" /> Create Task
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((t) => (
              <TaskCard key={t.id} task={t} onEdit={handleEdit} />
            ))}
          </AnimatePresence>
        </div>
      )}

      <TaskModal open={modalOpen} task={editingTask} onClose={() => setModalOpen(false)} />
    </div>
  )
}