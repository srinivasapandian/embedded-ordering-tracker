import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { MIGRATION_STAGES_ORDERED, MIGRATION_STAGE_LABELS, type MigrationStage } from '@/types'
import { cn } from '@/utils/cn'

const STAGE_COLOR: Record<MigrationStage, string> = {
  planning: 'bg-slate-400',
  'in-progress': 'bg-amber-500',
  testing: 'bg-primary-500',
  completed: 'bg-emerald-500',
}

interface MigrationPipelineProps {
  byStage: Record<MigrationStage, number>
  className?: string
}

/**
 * "Planning → In Progress → Testing → Completed" stage breakdown, shown as
 * four independent tiles. A shared segmented bar reads oddly whenever a
 * stage sits at zero — its color simply vanishes and the bar looks
 * unbalanced — so each stage gets its own count and share instead.
 */
export function MigrationPipeline({ byStage, className }: MigrationPipelineProps) {
  const total = MIGRATION_STAGES_ORDERED.reduce((sum, s) => sum + byStage[s], 0) || 1

  return (
    <div className={cn('grid grid-cols-2 gap-3 sm:grid-cols-4', className)}>
      {MIGRATION_STAGES_ORDERED.map((stage, i) => {
        const share = (byStage[stage] / total) * 100
        return (
          <div key={stage} className="rounded-lg border border-line bg-elev/40 p-3">
            <div className="flex items-center gap-2">
              <span className={cn('h-2 w-2 shrink-0 rounded-full', STAGE_COLOR[stage])} aria-hidden />
              <span className="truncate text-xs text-sub">{MIGRATION_STAGE_LABELS[stage]}</span>
            </div>
            <div className="mt-1.5 flex items-baseline gap-1.5">
              <span className="text-xl font-bold tabular-nums tracking-tight text-ink">{byStage[stage]}</span>
              <span className="text-2xs tabular-nums text-faint">{Math.round(share)}%</span>
            </div>
            <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-line/70">
              <motion.div
                className={cn('h-full rounded-full', STAGE_COLOR[stage])}
                initial={{ width: 0 }}
                animate={{ width: `${share}%` }}
                transition={{ duration: 0.5, delay: i * 0.06, ease: 'easeOut' }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

/** "React.js ───────────→ Next.js" labeled frame around a progress bar. */
export function FrameworkMigrationLabel({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2 text-xs font-semibold text-sub', className)}>
      <span className="rounded-md bg-elev px-2 py-1 text-ink">React.js</span>
      <span className="flex flex-1 items-center">
        <span className="h-px flex-1 bg-line-strong" aria-hidden />
        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-faint" aria-hidden />
      </span>
      <span className="rounded-md bg-ink px-2 py-1 text-card">Next.js</span>
    </div>
  )
}
