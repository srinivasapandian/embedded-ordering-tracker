import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { TrendingDown, TrendingUp } from 'lucide-react'
import { cn } from '@/utils/cn'
import { AnimatedNumber } from './AnimatedNumber'
import { ProgressBar } from './ProgressBar'
import { SkeletonCard } from './Skeleton'

export type MetricTone = 'emerald' | 'amber' | 'slate' | 'red' | 'indigo' | 'sky' | 'violet'

// 'indigo' is this card's brand/primary emphasis tone (now red); 'sky' and
// 'violet' are kept as neutral so the wider palette stays restrained.
const toneConfig: Record<MetricTone, { iconWrap: string; bar: 'emerald' | 'amber' | 'slate' | 'red' | 'primary' | 'sky' | 'violet' }> = {
  emerald: { iconWrap: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400', bar: 'emerald' },
  amber: { iconWrap: 'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400', bar: 'amber' },
  slate: { iconWrap: 'bg-slate-200/70 text-slate-600 dark:bg-slate-500/15 dark:text-slate-400', bar: 'slate' },
  red: { iconWrap: 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400', bar: 'red' },
  indigo: { iconWrap: 'bg-primary-100 text-primary-600 dark:bg-primary-500/15 dark:text-primary-400', bar: 'primary' },
  sky: { iconWrap: 'bg-slate-200/70 text-slate-600 dark:bg-slate-500/15 dark:text-slate-400', bar: 'slate' },
  violet: { iconWrap: 'bg-slate-200/70 text-slate-600 dark:bg-slate-500/15 dark:text-slate-400', bar: 'slate' },
}

export interface MetricCardProps {
  title: string
  value: number
  icon: LucideIcon
  tone?: MetricTone
  /** Line under the value, e.g. 'Websites active'. */
  caption?: string
  /** Big secondary stat, e.g. '57.8%'. */
  percent?: string
  /** 0..100 — renders the progress indicator. */
  progress?: number
  /** Delta vs baseline; renders the trend chip. */
  trend?: { delta: number; label: string }
  loading?: boolean
  /** Set true briefly to flash the card when realtime data changes. */
  highlight?: boolean
  className?: string
  /** Entrance animation stagger index. */
  index?: number
  onClick?: () => void
}

export function MetricCard({
  title,
  value,
  icon: Icon,
  tone = 'indigo',
  caption,
  percent,
  progress,
  trend,
  loading = false,
  highlight = false,
  className,
  index = 0,
  onClick,
}: MetricCardProps) {
  if (loading) return <SkeletonCard className={className} />

  const cfg = toneConfig[tone]
  const up = (trend?.delta ?? 0) >= 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05, ease: 'easeOut' }}
      onClick={onClick}
      className={cn(
        'app-card group relative overflow-hidden p-4 transition-shadow',
        onClick && 'focus-ring cursor-pointer hover:shadow-pop',
        highlight && 'ring-2 ring-primary-400/60',
        className,
      )}
      {...(onClick ? { role: 'button', tabIndex: 0, onKeyDown: (e: React.KeyboardEvent) => e.key === 'Enter' && onClick() } : {})}
    >
      <div className="flex items-start justify-between gap-2">
        <span className={cn('flex h-9 w-9 items-center justify-center rounded-lg', cfg.iconWrap)}>
          <Icon className="h-[18px] w-[18px]" aria-hidden />
        </span>
        {trend && (
          <span
            className={cn(
              'flex items-center gap-1 rounded-full px-1.5 py-0.5 text-2xs font-semibold',
              up
                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                : 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400',
            )}
            title={trend.label}
          >
            {up ? <TrendingUp className="h-3 w-3" aria-hidden /> : <TrendingDown className="h-3 w-3" aria-hidden />}
            {up ? '+' : ''}
            {trend.delta}
            <span className="sr-only"> {trend.label}</span>
          </span>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <AnimatedNumber value={value} className="text-2xl font-bold tabular-nums tracking-tight text-ink" />
        {percent && <span className="text-sm font-semibold text-sub">{percent}</span>}
      </div>
      <p className="mt-0.5 text-xs font-medium text-sub">{title}</p>
      {caption && <p className="text-2xs text-faint">{caption}</p>}

      {progress !== undefined && (
        <ProgressBar value={progress} tone={cfg.bar} size="xs" className="mt-3" aria-label={`${title} progress`} />
      )}
    </motion.div>
  )
}
