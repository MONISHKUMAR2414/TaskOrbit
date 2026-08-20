export type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'cancelled'
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical'
export type Theme = 'dark' | 'light'
export type RecommendationType = 'morning' | 'midday' | 'evening'

export type Profile = {
  id: string
  full_name: string
  email: string
  avatar_url: string
  theme: Theme
  daily_goal: number
  work_hours_start: number
  work_hours_end: number
  default_duration: number
  created_at: string
  updated_at: string
}

export type Category = {
  id: string
  user_id: string
  name: string
  color: string
  icon: string
  created_at: string
}

export type Task = {
  id: string
  user_id: string
  category_id: string | null
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  due_date: string | null
  start_time: string | null
  end_time: string | null
  estimated_minutes: number
  completed_at: string | null
  created_at: string
  updated_at: string
  category?: Category | null
}

export type EmailRecommendation = {
  id: string
  user_id: string
  type: RecommendationType
  subject: string
  content: string
  created_at: string
}

export type TaskInput = Omit<Task, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'completed_at' | 'category'>
export type TaskUpdateInput = Omit<Task, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'category'>

export type SortKey = 'priority' | 'due_date' | 'created_at' | 'title'
export type SortOrder = 'asc' | 'desc'