import { useMemo } from 'react'
import { CheckCircle2, Clock, Globe, Rocket, ShieldCheck } from 'lucide-react'
import { KPICard } from '@/components/common/KPICard'
import { useAppStore } from '@/store/appStore'
import { migrationMetrics, onboardingMetrics } from '@/utils/selectors'

/** Top-of-dashboard compact KPI strip — five at-a-glance numbers. */
export function KpiStrip() {
  const websites = useAppStore((s) => s.websites)
  const migrations = useAppStore((s) => s.migrations)

  const ordering = useMemo(() => onboardingMetrics(websites), [websites])
  const migration = useMemo(() => migrationMetrics(websites, migrations), [websites, migrations])
  const qaReady = useMemo(() => websites.filter((w) => w.qaSignoff === 'signed-off').length, [websites])

  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
      <KPICard label="Total Websites" value={ordering.total} icon={Globe} tone="ink" index={0} />
      <KPICard label="Ordering Completed" value={ordering.active} icon={CheckCircle2} tone="emerald" index={1} />
      <KPICard label="Ordering In Progress" value={ordering.inProgress} icon={Clock} tone="amber" index={2} />
      <KPICard label="Migrated to Next.js" value={migration.nextjs} icon={Rocket} tone="primary" index={3} />
      <KPICard label="QA / Ready" value={qaReady} icon={ShieldCheck} tone="ink" index={4} />
    </div>
  )
}
