import { useEffect, useState, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import {
  Moon,
  Palette,
  Sun,
  Target,
  Trash2,
  User,
  LogOut,
  Sparkles,
  Loader2,
} from 'lucide-react'
import { useAuthContext } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useTaskContext } from '@/contexts/TaskContext'
import { useToast } from '@/hooks/useToast'
import { supabase } from '@/lib/supabase'
import { getInitials } from '@/lib/utils'
import type { TaskInput, Theme } from '@/types'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { Spinner } from '@/components/common/Spinner'

export default function SettingsPage() {
  const { profile, user, updateProfile, signOut } = useAuthContext()
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()
  const { tasks, categories, ensureCategories } = useTaskContext()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [dailyGoal, setDailyGoal] = useState(5)
  const [workStart, setWorkStart] = useState(9)
  const [workEnd, setWorkEnd] = useState(18)
  const [defaultDuration, setDefaultDuration] = useState(60)

  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPrefs, setSavingPrefs] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [seeding, setSeeding] = useState(false)

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? '')
      setEmail(profile.email ?? user?.email ?? '')
      setDailyGoal(profile.daily_goal ?? 5)
      setWorkStart(profile.work_hours_start ?? 9)
      setWorkEnd(profile.work_hours_end ?? 18)
      setDefaultDuration(profile.default_duration ?? 60)
    }
  }, [profile, user])

  const saveProfile = async (e: FormEvent) => {
    e.preventDefault()
    if (!fullName.trim()) {
      toast('Full name is required', 'error')
      return
    }
    setSavingProfile(true)
    const res = await updateProfile({ full_name: fullName.trim() })
    setSavingProfile(false)
    if (res.error) {
      toast(res.error, 'error')
      return
    }
    toast('Profile updated successfully')
  }

  const savePrefs = async () => {
    if (workStart >= workEnd) {
      toast('Work start must be before work end', 'error')
      return
    }
    setSavingPrefs(true)
    const res = await updateProfile({
      daily_goal: dailyGoal,
      work_hours_start: workStart,
      work_hours_end: workEnd,
      default_duration: defaultDuration,
    })
    setSavingPrefs(false)
    if (res.error) {
      toast(res.error, 'error')
      return
    }
    toast('Productivity preferences saved')
  }

  const changeTheme = async (t: Theme) => {
    setTheme(t)
    const res = await updateProfile({ theme: t })
    if (res.error) toast(res.error, 'error')
  }

  const seedDemoData = async () => {
    setSeeding(true)
    try {
      const cats = categories.length ? categories : await ensureCategories()
      const cat = (name: string) => cats.find((c) => c.name === name)?.id ?? null
      const today = new Date()
      const iso = (days: number) => {
        const d = new Date(today.getTime() + days * 86400000)
        return d.toISOString().slice(0, 10)
      }
      const demo: Array<Partial<TaskInput>> = [
        {
          title: 'Finish Salesforce project',
          description: 'Complete the final deliverable and submit for review.',
          category_id: cat('Learning'),
          priority: 'critical',
          status: 'in_progress',
          due_date: iso(0),
          estimated_minutes: 90,
        },
        {
          title: 'Study PostgreSQL',
          description: 'Review indexes and query optimization chapter.',
          category_id: cat('Learning'),
          priority: 'high',
          status: 'todo',
          due_date: iso(0),
          estimated_minutes: 60,
        },
        {
          title: 'Gym workout',
          description: 'Full body routine.',
          category_id: cat('Health'),
          priority: 'medium',
          status: 'todo',
          due_date: iso(0),
          estimated_minutes: 60,
        },
        {
          title: 'Team standup',
          description: 'Daily sync with the product team.',
          category_id: cat('Work'),
          priority: 'medium',
          status: 'completed',
          due_date: iso(-1),
          estimated_minutes: 30,
        },
        {
          title: 'Read 20 pages',
          description: 'Continue the current book.',
          category_id: cat('Learning'),
          priority: 'low',
          status: 'completed',
          due_date: iso(-2),
          estimated_minutes: 45,
        },
        {
          title: 'Grocery shopping',
          description: 'Weekly essentials.',
          category_id: cat('Personal'),
          priority: 'low',
          status: 'todo',
          due_date: iso(1),
          estimated_minutes: 40,
        },
      ]
      const { error } = await supabase.from('tasks').insert(demo)
      if (error) {
        toast(error.message, 'error')
      } else {
        toast('Demo tasks added — refresh to see your 3D world update')
      }
    } catch (e) {
      toast('Failed to seed demo data', 'error')
    } finally {
      setSeeding(false)
    }
  }

  const deleteAccount = async () => {
    setDeleting(true)
    // Remove user-scoped data, then the auth user.
    const userId = user?.id
    if (userId) {
      await supabase.from('tasks').delete().eq('user_id', userId)
      await supabase.from('categories').delete().eq('user_id', userId)
      await supabase.from('email_recommendations').delete().eq('user_id', userId)
      await supabase.from('profiles').delete().eq('id', userId)
    }
    const { error } = await supabase.rpc('delete_user_account')
    if (error) {
      // Fallback: some projects don't define the RPC; sign out anyway.
      await supabase.auth.signOut()
      toast('Account data cleared. Signed out.', 'info')
    } else {
      toast('Account deleted')
    }
    setDeleting(false)
    window.location.assign('/signin')
  }

  const section = (title: string, icon: React.ReactNode, children: React.ReactNode) => (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3 }}
      className="glass p-5 sm:p-6"
    >
      <div className="mb-5 flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-dim text-accent">{icon}</span>
        <h2 className="font-display text-base font-semibold text-slate-800 dark:text-slate-100">{title}</h2>
      </div>
      {children}
    </motion.section>
  )

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-800 dark:text-white">Settings</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Manage your profile, appearance, and productivity preferences.</p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Profile */}
        {section('Profile', <User className="h-4 w-4" />, (
          <form onSubmit={saveProfile} className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-cyan-500 text-xl font-bold text-white">
                {getInitials(profile)}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{profile?.full_name || 'User'}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Member since {profile ? new Date(profile.created_at).toLocaleDateString() : '—'}</p>
              </div>
            </div>
            <div>
              <label className="label" htmlFor="s-name">Full name</label>
              <input id="s-name" className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="s-email">Email</label>
              <input id="s-email" className="input" value={email} disabled aria-disabled="true" />
              <p className="mt-1 text-xs text-slate-400">Email is managed by your authentication provider.</p>
            </div>
            <button type="submit" className="btn-primary self-start" disabled={savingProfile}>
              {savingProfile ? <><Spinner size={16} className="border-white text-white" /> Saving…</> : 'Save Profile'}
            </button>
          </form>
        ))}

        {/* Appearance */}
        {section('Appearance', <Palette className="h-4 w-4" />, (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => changeTheme('dark')}
                className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-5 transition-all ${theme === 'dark' ? 'border-accent bg-accent-dim' : 'border-slate-200 hover:border-slate-300 dark:border-white/10'}`}
                aria-pressed={theme === 'dark'}
              >
                <Moon className="h-6 w-6 text-slate-700 dark:text-slate-200" />
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Dark</span>
              </button>
              <button
                onClick={() => changeTheme('light')}
                className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-5 transition-all ${theme === 'light' ? 'border-accent bg-accent-dim' : 'border-slate-200 hover:border-slate-300 dark:border-white/10'}`}
                aria-pressed={theme === 'light'}
              >
                <Sun className="h-6 w-6 text-amber-500" />
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Light</span>
              </button>
            </div>
            <p className="text-xs text-slate-400">Your theme preference is saved to your profile and synced across devices.</p>
          </div>
        ))}

        {/* Productivity */}
        {section('Productivity', <Target className="h-4 w-4" />, (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="label" htmlFor="p-goal">Daily goal (tasks)</label>
                <input id="p-goal" type="number" min={1} max={50} className="input" value={dailyGoal} onChange={(e) => setDailyGoal(parseInt(e.target.value, 10) || 5)} />
              </div>
              <div>
                <label className="label" htmlFor="p-start">Work start (hour)</label>
                <input id="p-start" type="number" min={0} max={23} className="input" value={workStart} onChange={(e) => setWorkStart(parseInt(e.target.value, 10) || 9)} />
              </div>
              <div>
                <label className="label" htmlFor="p-end">Work end (hour)</label>
                <input id="p-end" type="number" min={1} max={24} className="input" value={workEnd} onChange={(e) => setWorkEnd(parseInt(e.target.value, 10) || 18)} />
              </div>
            </div>
            <div>
              <label className="label" htmlFor="p-duration">Default task duration (minutes)</label>
              <input id="p-duration" type="number" min={5} step={5} className="input" value={defaultDuration} onChange={(e) => setDefaultDuration(parseInt(e.target.value, 10) || 60)} />
            </div>
            <button className="btn-primary self-start" onClick={savePrefs} disabled={savingPrefs}>
              {savingPrefs ? <><Spinner size={16} className="border-white text-white" /> Saving…</> : 'Save Preferences'}
            </button>
          </div>
        ))}

        {/* Demo data */}
        {section('Demo Data', <Sparkles className="h-4 w-4" />, (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              You currently have <strong className="text-slate-700 dark:text-slate-200">{tasks.length}</strong> tasks and{' '}
              <strong className="text-slate-700 dark:text-slate-200">{categories.length}</strong> categories.
            </p>
            <button className="btn-secondary self-start" onClick={seedDemoData} disabled={seeding}>
              {seeding ? <><Loader2 className="h-4 w-4 animate-spin" /> Seeding…</> : 'Add demo tasks'}
            </button>
            <p className="text-xs text-slate-400">Adds a handful of sample tasks to explore the 3D scene, charts, and reports.</p>
          </div>
        ))}

        {/* Account */}
        {section('Account', <Trash2 className="h-4 w-4" />, (
          <div className="flex flex-col gap-3">
            <button className="btn-secondary self-start" onClick={signOut}>
              <LogOut className="h-4 w-4" /> Sign out
            </button>
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
              <p className="text-sm font-semibold text-red-500">Danger zone</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Permanently deletes your account and all tasks, categories, and recommendations.
              </p>
              <button className="btn-danger mt-3" onClick={() => setDeleteOpen(true)}>
                <Trash2 className="h-4 w-4" /> Delete account
              </button>
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={deleteOpen}
        title="Delete your account?"
        description={
          <>
            This permanently removes your account and all associated data. This action cannot be undone.
          </>
        }
        confirmLabel="Delete account"
        danger
        loading={deleting}
        onConfirm={deleteAccount}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  )
}