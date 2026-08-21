import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { AnimatedNumber } from '@/components/common/AnimatedNumber'
import { FrameworkMigrationLabel, MigrationPipeline } from '@/components/common/MigrationPipeline'
import { useAppStore } from '@/store/appStore'
import { pct } from '@/utils/format'
import { migrationMetrics } from '@/utils/selectors'

function Stat({ label, value, suffix }: { label: string; value: number; suffix?: string }) {
  return (
    <div className="app-card px-4 py-3">
      <div className="flex items-baseline gap-1">
        <AnimatedNumber value={value} className="text-xl font-bold tabular-nums tracking-tight text-ink" />
        {suffix && <span className="text-sm font-semibold text-sub">{suffix}</span>}
      </div>
      <p className="mt-0.5 text-xs font-medium text-sub">{label}</p>
    </div>
  )
}

/** Stats + pipeline strip shown above the migration kanban board. */
export function MigrationOverviewHeader() {
  const websites = useAppStore((s) => s.websites)
  const migrations = useAppStore((s) => s.migrations)
  const m = useMemo(() => migrationMetrics(websites, migrations), [websites, migrations])

  return (
    <div className="mb-5 space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Total Websites" value={m.totalWebsites} />
        <Stat label="Migrated" value={m.nextjs} />
        <Stat label="Remaining" value={m.react} />
        <Stat label="Migration %" value={Number(m.completionPct.toFixed(0))} suffix="%" />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="app-card p-4"
      >
        <FrameworkMigrationLabel className="mb-4" />
        <p className="mb-2 text-xs font-medium text-sub">
          {m.nextjs} of {m.totalWebsites} websites migrated ({pct(m.nextjs, m.totalWebsites, 0)})
        </p>
        <MigrationPipeline byStage={m.byStage} />
      </motion.div>
    </div>
  )
}
