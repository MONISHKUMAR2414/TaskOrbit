import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { CalendarClock, Coffee, Eye, EyeOff, Moon, Send, Sparkles, Sunrise, Trash2 } from 'lucide-react'
import { useTaskContext } from '@/contexts/TaskContext'
import { useAuthContext } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/useToast'
import { supabase } from '@/lib/supabase'
import { computeProductivity } from '@/lib/productivity'
import { generateRecommendation, recommendationTypeForHour, type Recommendation } from '@/lib/recommendations'
import { timeAgo } from '@/lib/utils'
import type { EmailRecommendation, RecommendationType } from '@/types'
import { ProductivityScore } from '@/components/Analytics/ProductivityScore'
import { Spinner } from '@/components/common/Spinner'

const TYPE_META: Record<RecommendationType, { label: string; icon: typeof Sunrise; desc: string }> = {
  morning: { label: 'Morning Briefing', icon: Sunrise, desc: 'Start your day with a clear plan.' },
  midday: { label: 'Midday Check-in', icon: Coffee, desc: 'Reassess priorities mid-afternoon.' },
  evening: { label: 'Evening Summary', icon: Moon, desc: 'Reflect and plan tomorrow.' },
}

export default function RecommendationsPage() {
  const { tasks, categories, tasksLoading } = useTaskContext()
  const { user } = useAuthContext()
  const { toast } = useToast()

  const [history, setHistory] = useState<EmailRecommendation[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [generating, setGenerating] = useState<RecommendationType | null>(null)
  const [viewing, setViewing] = useState<EmailRecommendation | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const report = useMemo(() => computeProductivity(tasks), [tasks])

  useEffect(() => {
    if (!user) {
      setHistory([])
      setHistoryLoading(false)
      return
    }
    let mounted = true
    const load = async () => {
      const { data, error } = await supabase
        .from('email_recommendations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30)
      if (!mounted) return
      if (error) {
        toast(error.message, 'error')
      } else {
        setHistory((data ?? []) as EmailRecommendation[])
      }
      setHistoryLoading(false)
    }
    load()
    return () => {
      mounted = false
    }
  }, [user, toast])

  const saveRecommendation = async (rec: Recommendation) => {
    if (!user) return
    const { error } = await supabase
      .from('email_recommendations')
      .insert({ user_id: user.id, type: rec.type, subject: rec.subject, content: rec.content })
    if (error) {
      toast('Could not save recommendation: ' + error.message, 'error')
    }
  }

  const handleGenerate = async (type: RecommendationType) => {
    setGenerating(type)
    const rec = generateRecommendation(type, tasks, categories, report.weekly)
    await saveRecommendation(rec)
    setGenerating(null)
    setViewing({
      id: `tmp-${Date.now()}`,
      user_id: user?.id ?? '',
      type: rec.type,
      subject: rec.subject,
      content: rec.content,
      created_at: new Date().toISOString(),
    })
    toast(`${TYPE_META[type].label} generated`)
    if (user) {
      const { data } = await supabase
        .from('email_recommendations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30)
      if (data) setHistory((data ?? []) as EmailRecommendation[])
    }
  }

  const handleDelete = async (id: string) => {
    setDeleting(id)
    const { error } = await supabase.from('email_recommendations').delete().eq('id', id)
    setDeleting(null)
    if (error) {
      toast(error.message, 'error')
      return
    }
    setHistory((prev) => prev.filter((r) => r.id !== id))
    if (viewing?.id === id) setViewing(null)
    toast('Recommendation deleted')
  }

  const autoKind = recommendationTypeForHour(new Date().getHours())

  if (tasksLoading) {
    return <div className="flex items-center justify-center py-24"><Spinner size={28} className="text-accent" /></div>
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-800 dark:text-white">Recommendations</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Smart insights generated from your task data — no external AI required.
        </p>
      </div>

      <ProductivityScore tasks={tasks} />

      {/* Generate */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-5"
      >
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-accent" />
          <h2 className="font-display text-base font-semibold text-slate-800 dark:text-slate-100">
            Generate a recommendation
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {(Object.keys(TYPE_META) as RecommendationType[]).map((type) => {
            const meta = TYPE_META[type]
            const isAuto = type === autoKind
            return (
              <button
                key={type}
                onClick={() => handleGenerate(type)}
                disabled={generating !== null}
                className="group relative flex flex-col items-start gap-2 rounded-2xl border border-slate-200 bg-white/50 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-glow dark:border-white/10 dark:bg-white/[0.03]"
              >
                {isAuto && (
                  <span className="absolute right-3 top-3 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold text-accent">
                    Suggested
                  </span>
                )}
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-dim text-accent transition-transform group-hover:scale-110">
                  {generating === type ? <Spinner size={18} className="text-accent" /> : <meta.icon className="h-5 w-5" />}
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{meta.label}</p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{meta.desc}</p>
                </div>
              </button>
            )
          })}
        </div>
      </motion.section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* History */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass p-5"
        >
          <div className="mb-4 flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-accent" />
            <h2 className="font-display text-base font-semibold text-slate-800 dark:text-slate-100">
              Recommendation History
            </h2>
          </div>
          {historyLoading ? (
            <div className="flex justify-center py-10"><Spinner size={24} className="text-accent" /></div>
          ) : history.length === 0 ? (
            <div className="py-10 text-center">
              <Sparkles className="mx-auto mb-3 h-8 w-8 text-slate-300 dark:text-slate-600" />
              <p className="text-sm text-slate-400">No recommendations yet. Generate your first one above.</p>
            </div>
          ) : (
            <div className="flex max-h-[520px] flex-col gap-2 overflow-y-auto pr-1">
              {history.map((rec) => {
                const meta = TYPE_META[rec.type]
                const Icon = meta.icon
                return (
                  <div
                    key={rec.id}
                    className="group flex items-center gap-3 rounded-xl border border-slate-100 px-3 py-3 transition-colors hover:border-accent/30 dark:border-white/10"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-dim text-accent">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{rec.subject}</p>
                      <p className="text-xs text-slate-400">
                        {meta.label} · {timeAgo(rec.created_at)}
                      </p>
                    </div>
                    <button
                      onClick={() => setViewing(rec)}
                      className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-accent-dim hover:text-accent"
                      aria-label={`View ${rec.subject}`}
                      title="View"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(rec.id)}
                      disabled={deleting === rec.id}
                      className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-500/10 hover:text-red-500"
                      aria-label={`Delete ${rec.subject}`}
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </motion.section>

        {/* Viewer */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass flex flex-col p-5"
        >
          {viewing ? (
            <>
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {(() => {
                    const Icon = TYPE_META[viewing.type]?.icon
                    return Icon ? <Icon className="h-5 w-5 text-accent" /> : null
                  })()}
                  <h2 className="font-display text-base font-semibold text-slate-800 dark:text-slate-100">
                    {viewing.subject}
                  </h2>
                </div>
                <button onClick={() => setViewing(null)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10" aria-label="Close preview">
                  <EyeOff className="h-4 w-4" />
                </button>
              </div>
              <pre className="flex-1 whitespace-pre-wrap rounded-xl border border-slate-100 bg-slate-50/60 p-4 font-sans text-sm leading-relaxed text-slate-700 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-200">
                {viewing.content}
              </pre>
              <button
                className="btn-secondary mt-4 self-end"
                onClick={() => toast('Recommendation emailed (demo) — see Reports for exports', 'info')}
              >
                <Send className="h-4 w-4" />
                Email this
              </button>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 py-20 text-center">
              <Sparkles className="h-10 w-10 text-slate-300 dark:text-slate-600" />
              <h3 className="font-display text-base font-semibold text-slate-700 dark:text-slate-200">
                Select a recommendation
              </h3>
              <p className="max-w-xs text-sm text-slate-400">
                Generate or pick one from history to preview it here. You have {tasks.length} tasks analyzed.
              </p>
            </div>
          )}
        </motion.section>
      </div>
    </div>
  )
}