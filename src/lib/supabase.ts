import { createClient } from '@supabase/supabase-js'
import type { Database } from './database'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const isDemoMode = !url || !anonKey

import { supabase as demoSupabase } from './supabaseDemo'

export const supabase: import('@supabase/supabase-js').SupabaseClient<Database> = url && anonKey
  ? createClient<Database>(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : (demoSupabase as import('@supabase/supabase-js').SupabaseClient<Database>)