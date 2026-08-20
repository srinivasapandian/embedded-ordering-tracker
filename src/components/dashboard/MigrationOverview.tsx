import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { TrendingDown, TrendingUp } from 'lucide-react'
import { AnimatedNumber } from '@/components/common/AnimatedNumber'
import { DonutChart } from '@/components/common/DonutChart'
import { ProgressBar } from '@/components/common/ProgressBar'
import { useAppStore } from '@/store/appStore'
import { MIGRATION_STAGES_ORDERED, MIGRATION_STAGE_LABELS, type MigrationStage } from '@/types'
import { cn } from '@/utils/cn'
import { migrationMetrics } from '@/utils/selectors'

const NEXTJS_COLOR = '#6366f1'
const REACT_COLOR = '#38bdf8'

/** Dot colors matching the shared StatusBadge tones for migration stages. */
const STAGE_DOTS: Record<MigrationStage, string> = {
  planning: 'bg-sky-500',
  'in-progress': 'bg-amber-500',
  testing: 'bg-amber-500',
  completed: 'bg-emerald-500',
}

function StatBlock({
  label,
  value,
  valueClassName,
}: {
  label: string
  value: number
  valueClassName?: string
}) {
  return (
    <div className="rounded-lg border border-line bg-elev/40 p-3">
      <AnimatedNumber
        value={value}
        className={cn('block text-xl font-bold tabular-nums tracking-tight text-ink', valueClassName)}
      />
      <p className="mt-0.5 text-xs font-medium leading-snug text-sub">{label}</p>
    </div>
  )
}

/** "Migration Status Overview" — donut, live stats and per-stage counts. */
export function MigrationOverview() {
  const websites = useAppStore((s) => s.websites)
  const migrations = useAppStore((s) => s.migrations)
  const baseline = useAppStore((s) => s.baseline)
  const m = useMemo(() => migrationMetrics(websites, migrations), [websites, migrations])

  const delta = m.nextjs - baseline.nextjs
  const trendingUp = delta >= 0

  return (
    <section aria-labelledby="migration-overview-heading">
      <h2 id="migration-overview-heading" className="mb-2.5 text-sm font-semibold text-ink">
        Migration Status Overview
      </h2>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1, ease: 'easeOut' }}
        className="app-card p-4"
      >
        <div className="gap-6 xl:grid xl:grid-cols-3">
          {/* Donut + legend */}
          <div className="flex flex-col items-center justify-center gap-3 py-1">
            <DonutChart
              data={[
                { name: 'Next.js', value: m.nextjs, color: NEXTJS_COLOR },
                { name: 'React', value: m.react, color: REACT_COLOR },
              ]}
              centerValue={`${m.completionPct.toFixed(1)}%`}
              centerLabel="Migrated to Next.js"
              size={172}
            />
            <div className="flex items-center gap-5">
              <span className="flex items-center gap-1.5 text-xs">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: NEXTJS_COLOR }} aria-hidden />
                <AnimatedNumber value={m.nextjs} className="font-semibold tabular-nums text-ink" />
                <span className="text-sub">Next.js</span>
              </span>
              <span className="flex items-center gap-1.5 text-xs">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: REACT_COLOR }} aria-hidden />
                <AnimatedNumber value={m.react} className="font-semibold tabular-nums text-ink" />
                <span className="text-sub">React</span>
              </span>
            </div>
          </div>

          {/* Stats + completion */}
          <div className="mt-5 flex flex-col justify-center gap-4 xl:col-span-2 xl:mt-0">
            <div className="grid grid-cols-3 gap-3">
              <StatBlock label="Total Websites" value={m.totalWebsites} />
              <StatBlock
                label="Successfully Migrated to Next.js"
                value={m.nextjs}
                valueClassName="text-emerald-600 dark:text-emerald-400"
              />
              <StatBlock
                label="Still Running on React"
                value={m.react}
                valueClassName="text-sky-600 dark:text-sky-400"
              />
            </div>
            <div>
              <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-medium text-sub">Migration completion</span>
                {/* <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-2xs font-semibold',
                    trendingUp
                      ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                      : 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400',
                  )}
                >
                  {trendingUp ? (
                    <TrendingUp className="h-3 w-3" aria-hidden />
                  ) : (
                    <TrendingDown className="h-3 w-3" aria-hidden />
                  )}
                  {trendingUp ? '+' : ''}
                  {delta} vs last week
                </span> */}
              </div>
              <ProgressBar
                value={m.completionPct}
                tone="primary"
                size="md"
                showLabel
                aria-label="Websites migrated to Next.js"
              />
            </div>
          </div>
        </div>

        {/* Per-stage strip — derives live from the migrations board */}
        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-line pt-3">
          {MIGRATION_STAGES_ORDERED.map((stage) => (
            <span key={stage} className="flex items-center gap-2">
              <span className={cn('h-2 w-2 shrink-0 rounded-full', STAGE_DOTS[stage])} aria-hidden />
              <span className="text-xs text-sub">{MIGRATION_STAGE_LABELS[stage]}</span>
              <AnimatedNumber
                value={m.byStage[stage]}
                className="text-sm font-semibold tabular-nums text-ink"
              />
            </span>
          ))}
          <span className="ml-auto text-2xs text-faint">
            {m.totalMigrations} migration{m.totalMigrations === 1 ? '' : 's'} tracked
          </span>
        </div>
      </motion.div>
    </section>
  )
}
