import type { LucideIcon } from 'lucide-react'
import { Circle } from 'lucide-react'
import { cn } from '@/utils/cn'

export interface TimelineEntry {
  id: string
  /** Precomputed label, e.g. 'Today', 'Yesterday', 'Aug 18'. */
  dateLabel: string
  title: string
  description?: string
  icon?: LucideIcon
  tone?: 'default' | 'success' | 'warning'
}

const toneDot: Record<NonNullable<TimelineEntry['tone']>, string> = {
  default: 'border-primary-400 bg-primary-100 text-primary-600 dark:bg-primary-500/20',
  success: 'border-emerald-400 bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20',
  warning: 'border-amber-400 bg-amber-100 text-amber-600 dark:bg-amber-500/20',
}

/** Vertical activity timeline (client history, migration logs…). */
export function Timeline({ entries, className }: { entries: TimelineEntry[]; className?: string }) {
  return (
    <ol className={cn('relative space-y-0', className)}>
      {entries.map((entry, i) => {
        const Icon = entry.icon ?? Circle
        const last = i === entries.length - 1
        return (
          <li key={entry.id} className="relative flex gap-3 pb-5 last:pb-0">
            {!last && <span aria-hidden className="absolute left-[11px] top-6 h-full w-px bg-line" />}
            <span
              className={cn(
                'relative z-10 mt-0.5 flex h-[23px] w-[23px] shrink-0 items-center justify-center rounded-full border-2',
                toneDot[entry.tone ?? 'default'],
              )}
            >
              <Icon className="h-2.5 w-2.5" aria-hidden />
            </span>
            <div className="min-w-0 pt-0.5">
              <p className="text-2xs font-semibold uppercase tracking-wide text-faint">{entry.dateLabel}</p>
              <p className="mt-0.5 text-sm font-medium text-ink">{entry.title}</p>
              {entry.description && <p className="mt-0.5 text-xs leading-relaxed text-sub">{entry.description}</p>}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
