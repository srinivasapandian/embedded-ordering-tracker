import { cn } from '@/utils/cn'

export type BadgeTone =
  | 'emerald'
  | 'amber'
  | 'red'
  | 'rose'
  | 'sky'
  | 'violet'
  | 'slate'
  | 'indigo'
  | 'ink'

/**
 * A small, varied accent palette (red/brand, emerald, amber, sky, violet,
 * rose) alongside neutral slate/ink — used for stat badges, chart legends
 * and categorical tags across the lighter, more colorful dashboard look.
 */
export const badgeToneClasses: Record<BadgeTone, string> = {
  emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-400/20',
  amber: 'bg-amber-50 text-amber-700 ring-amber-600/25 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-400/20',
  red: 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-400/20',
  rose: 'bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-400/20',
  sky: 'bg-sky-50 text-sky-700 ring-sky-600/20 dark:bg-sky-500/10 dark:text-sky-400 dark:ring-sky-400/20',
  violet: 'bg-violet-50 text-violet-700 ring-violet-600/20 dark:bg-violet-500/10 dark:text-violet-400 dark:ring-violet-400/20',
  slate: 'bg-slate-100 text-slate-600 ring-slate-500/20 dark:bg-slate-500/10 dark:text-slate-400 dark:ring-slate-400/20',
  indigo: 'bg-primary-50 text-primary-700 ring-primary-600/20 dark:bg-primary-500/10 dark:text-primary-400 dark:ring-primary-400/20',
  ink: 'bg-slate-900 text-white ring-slate-900/10 dark:bg-slate-100 dark:text-slate-900 dark:ring-white/20',
}

export const badgeDotClasses: Record<BadgeTone, string> = {
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
  rose: 'bg-rose-500',
  sky: 'bg-sky-500',
  violet: 'bg-violet-500',
  slate: 'bg-slate-400',
  indigo: 'bg-primary-500',
  ink: 'bg-current',
}

export interface BadgeProps {
  tone?: BadgeTone
  dot?: boolean
  uppercase?: boolean
  className?: string
  children: React.ReactNode
}

export function Badge({ tone = 'slate', dot = false, uppercase = false, className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
        uppercase && 'text-2xs font-semibold uppercase tracking-wide',
        badgeToneClasses[tone],
        className,
      )}
    >
      {dot && <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', badgeDotClasses[tone])} aria-hidden />}
      {children}
    </span>
  )
}
