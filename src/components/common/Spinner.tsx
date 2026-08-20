import { cn } from '@/lib/utils'

export function Spinner({ className, size = 20 }: { className?: string; size?: number }) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn('inline-block animate-spin rounded-full border-2 border-current border-t-transparent', className)}
      style={{ width: size, height: size }}
    />
  )
}

export function FullPageLoader({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface text-slate-500 dark:text-slate-400">
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-accent/30 blur-2xl" />
        <Spinner size={36} className="relative text-accent" />
      </div>
      <p className="text-sm">{label}</p>
    </div>
  )
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center py-24" role="status" aria-label="Loading">
      <Spinner size={28} className="text-accent" />
    </div>
  )
}