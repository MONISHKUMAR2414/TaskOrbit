import type { Category, EmailRecommendation, Profile, Task } from '@/types'

type GenericRelationship = {
  foreignKeyName: string
  columns: string[]
  referencedRelation: string
  referencedColumns: string[]
}

type GenericFunction = {
  Args: Record<string, unknown> | never
  Returns: unknown
}

/**
 * Minimal Supabase typed schema.
 * Kept in sync with supabase/schema.sql.
 */
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Partial<Profile>
        Update: Partial<Profile>
        Relationships: GenericRelationship[]
      }
      categories: {
        Row: Category
        Insert: Partial<Category>
        Update: Partial<Category>
        Relationships: GenericRelationship[]
      }
      tasks: {
        Row: Task
        Insert: Partial<Task>
        Update: Partial<Task>
        Relationships: GenericRelationship[]
      }
      email_recommendations: {
        Row: EmailRecommendation
        Insert: Partial<EmailRecommendation>
        Update: Partial<EmailRecommendation>
        Relationships: GenericRelationship[]
      }
    }
    Views: {
      daily_productivity: {
        Row: {
          user_id: string
          day: string
          total_tasks: number
          completed_tasks: number
          completion_percentage: number
        }
        Relationships: GenericRelationship[]
      }
    }
    Functions: Record<
      string,
      GenericFunction
    >
  }
}

export type { Category, EmailRecommendation, Profile, Task }