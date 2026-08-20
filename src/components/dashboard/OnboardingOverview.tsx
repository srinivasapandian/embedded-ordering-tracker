import { useMemo } from 'react'
import type { LucideIcon } from 'lucide-react'
import { CircleAlert, CircleMinus, ClipboardList, Earth, ShoppingCart } from 'lucide-react'
import { MetricCard, type MetricTone } from '@/components/common/MetricCard'
import { useAppStore } from '@/store/appStore'
import { pct, pctNumber } from '@/utils/format'
import { onboardingMetrics } from '@/utils/selectors'
import { useFlashOnChange } from './useFlashOnChange'

interface CardSpec {
  title: string
  value: number
  icon: LucideIcon
  tone: MetricTone
  caption?: string
  percent?: string
  progress?: number
  trend?: { delta: number; label: string }
}

/** MetricCard that flashes briefly whenever its value changes. */
function FlashMetricCard({ spec, index }: { spec: CardSpec; index: number }) {
  const highlight = useFlashOnChange(spec.value)
  return (
    <MetricCard
      title={spec.title}
      value={spec.value}
      icon={spec.icon}
      tone={spec.tone}
      caption={spec.caption}
      percent={spec.percent}
      progress={spec.progress}
      trend={spec.trend}
      highlight={highlight}
      index={index}
    />
  )
}

/** "Client Onboarding Overview" — five ordering-status metric cards. */
export function OnboardingOverview() {
  const websites = useAppStore((s) => s.websites)
  const baseline = useAppStore((s) => s.baseline)
  const m = useMemo(() => onboardingMetrics(websites), [websites])

  const cards: CardSpec[] = [
    {
      title: 'Total Websites',
      value: m.total,
      icon: Earth,
      tone: 'indigo',
      caption: 'Across all clients',
      // trend: { delta: m.total - baseline.totalWebsites, label: 'vs last week' },
    },
    {
      title: 'Online Ordering Active',
      value: m.active,
      icon: ShoppingCart,
      tone: 'emerald',
      caption: 'Websites active',
      percent: pct(m.active, m.total),
      progress: pctNumber(m.active, m.total),
      // trend: { delta: m.active - baseline.orderingActive, label: 'vs last week' },
    },
    {
      title: 'Ordering In Progress',
      value: m.inProgress,
      icon: ClipboardList,
      tone: 'amber',
      caption: 'Setup underway',
      percent: pct(m.inProgress, m.total),
      progress: pctNumber(m.inProgress, m.total),
    },
    {
      title: 'No Need',
      value: m.noNeed,
      icon: CircleMinus,
      tone: 'slate',
      caption: 'Ordering not required',
      percent: pct(m.noNeed, m.total),
    },
    {
      title: 'Not Started',
      value: m.notStarted,
      icon: CircleAlert,
      tone: 'red',
      caption: 'Awaiting kickoff',
      percent: pct(m.notStarted, m.total),
      progress: pctNumber(m.notStarted, m.total),
    },
  ]

  return (
    <section aria-labelledby="onboarding-overview-heading">
      <h2 id="onboarding-overview-heading" className="mb-2.5 text-sm font-semibold text-ink">
        Client Onboarding Overview
      </h2>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
        {cards.map((spec, i) => (
          <FlashMetricCard key={spec.title} spec={spec} index={i} />
        ))}
      </div>
    </section>
  )
}
