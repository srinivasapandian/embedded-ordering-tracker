import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { AnimatedNumber } from '@/components/common/AnimatedNumber'
import { DonutChart } from '@/components/common/DonutChart'
import { FrameworkMigrationLabel, MigrationPipeline } from '@/components/common/MigrationPipeline'
import { ProgressBar } from '@/components/common/ProgressBar'
import { SectionHeader } from '@/components/common/SectionHeader'
import { useAppStore } from '@/store/appStore'
import { cn } from '@/utils/cn'
import { migrationMetrics } from '@/utils/selectors'

const NEXTJS_COLOR = '#dc2626' // brand red — the target/migrated state
const REACT_COLOR = '#94a3b8' // neutral slate — legacy/remaining

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
  const m = useMemo(() => migrationMetrics(websites, migrations), [websites, migrations])

  return (
    <section aria-label="React to Next.js migration overview">
      <SectionHeader title="React → Next.js Migration" description={`${m.nextjs} migrated · ${m.react} remaining`} />
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
                valueClassName="text-slate-500 dark:text-slate-400"
              />
            </div>
            <div>
              <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-medium text-sub">Migration completion</span>
              </div>
              <ProgressBar
                value={m.completionPct}
                tone="primary"
                size="md"
                showLabel
                aria-label="Websites migrated to Next.js"
              />
            </div>
            <FrameworkMigrationLabel />
          </div>
        </div>

        {/* Migration stage pipeline — derives live from the migrations board */}
        <div className="mt-4 border-t border-line pt-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-sub">Migration stages</span>
            <span className="text-2xs text-faint">
              {m.totalMigrations} migration{m.totalMigrations === 1 ? '' : 's'} tracked
            </span>
          </div>
          <MigrationPipeline byStage={m.byStage} />
        </div>
      </motion.div>
    </section>
  )
}
