import { useMemo } from 'react'
import { CheckCircle2, Clock, Globe, Rocket, ShieldCheck } from 'lucide-react'
import { StatRail, type StatRailItemData } from '@/components/common/StatRail'
import { useAppStore } from '@/store/appStore'
import { migrationMetrics, onboardingMetrics } from '@/utils/selectors'

/** Top-of-dashboard stat strip — five at-a-glance numbers. */
export function KpiStrip() {
  const websites = useAppStore((s) => s.websites)
  const migrations = useAppStore((s) => s.migrations)

  const ordering = useMemo(() => onboardingMetrics(websites), [websites])
  const migration = useMemo(() => migrationMetrics(websites, migrations), [websites, migrations])
  const qaReady = useMemo(() => websites.filter((w) => w.qaSignoff === 'signed-off').length, [websites])

  const items: StatRailItemData[] = [
    { icon: Globe, tone: 'violet', label: 'Total Websites', value: ordering.total },
    { icon: CheckCircle2, tone: 'emerald', label: 'Ordering Completed', value: ordering.active },
    { icon: Clock, tone: 'amber', label: 'Ordering In Progress', value: ordering.inProgress },
    { icon: Rocket, tone: 'primary', label: 'Migrated to Next.js', value: migration.nextjs },
    { icon: ShieldCheck, tone: 'sky', label: 'QA / Ready', value: qaReady },
  ]

  return <StatRail items={items} />
}
