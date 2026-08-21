import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { TrendingDown, TrendingUp } from 'lucide-react'
import { cn } from '@/utils/cn'
import { AnimatedNumber } from './AnimatedNumber'

export type KpiTone = 'ink' | 'emerald' | 'amber' | 'primary'

const toneAccent: Record<KpiTone, string> = {
  ink: 'text-ink',
  emerald: 'text-emerald-600 dark:text-emerald-400',
  amber: 'text-amber-600 dark:text-amber-400',
  primary: 'text-primary-600 dark:text-primary-400',
}

const toneIconWrap: Record<KpiTone, string> = {
  ink: 'bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-300',
  emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400',
  amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400',
  primary: 'bg-primary-50 text-primary-600 dark:bg-primary-500/15 dark:text-primary-400',
}

export interface KPICardProps {
  label: string
  value: number
  icon: LucideIcon
  tone?: KpiTone
  suffix?: string
  delta?: number
  index?: number
  className?: string
}

/** Compact KPI tile for a dense top-of-dashboard strip — deliberately small. */
export function KPICard({ label, value, icon: Icon, tone = 'ink', suffix, delta, index = 0, className }: KPICardProps) {
  const up = (delta ?? 0) >= 0
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04, ease: 'easeOut' }}
      className={cn('app-card flex items-center gap-3 px-3.5 py-3', className)}
    >
      <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-md', toneIconWrap[tone])}>
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <div className="min-w-0">
        <div className="flex items-baseline gap-1.5">
          <AnimatedNumber
            value={value}
            className={cn('text-lg font-bold leading-none tabular-nums tracking-tight', toneAccent[tone])}
          />
          {suffix && <span className="text-xs font-semibold text-sub">{suffix}</span>}
          {delta !== undefined && (
            <span
              className={cn(
                'inline-flex items-center gap-0.5 text-2xs font-semibold',
                up ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400',
              )}
            >
              {up ? <TrendingUp className="h-2.5 w-2.5" aria-hidden /> : <TrendingDown className="h-2.5 w-2.5" aria-hidden />}
              {Math.abs(delta)}
            </span>
          )}
        </div>
        <p className="mt-0.5 truncate text-2xs font-medium uppercase tracking-wide text-faint">{label}</p>
      </div>
    </motion.div>
  )
}
