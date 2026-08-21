import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { AnimatedNumber } from '@/components/common/AnimatedNumber'
import { DonutChart } from '@/components/common/DonutChart'
import { ProgressBar } from '@/components/common/ProgressBar'
import { SectionHeader } from '@/components/common/SectionHeader'
import { useAppStore } from '@/store/appStore'
import { pct } from '@/utils/format'
import { onboardingMetrics } from '@/utils/selectors'
import { cn } from '@/utils/cn'
import { useFlashOnChange } from './useFlashOnChange'

const COMPLETED_COLOR = '#10b981' // emerald-500
const IN_PROGRESS_COLOR = '#f59e0b' // amber-500
const NOT_STARTED_COLOR = '#ef4444' // red-500
const NA_COLOR = '#94a3b8' // slate-400

interface LegendRowProps {
  label: string
  value: number
  total: number
  color: string
}

function LegendRow({ label, value, total, color }: LegendRowProps) {
  return (
    <div className="flex items-center gap-3 py-2">
      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} aria-hidden />
      <span className="flex-1 text-sm text-sub">{label}</span>
      <AnimatedNumber value={value} className="text-sm font-bold tabular-nums text-ink" />
      <span className="w-11 shrink-0 text-right text-2xs tabular-nums text-faint">{pct(value, total, 0)}</span>
    </div>
  )
}

/** Primary dashboard metric — the embedded ordering rollout across all websites. */
export function EmbeddedOrderingRollout() {
  const websites = useAppStore((s) => s.websites)
  const m = useMemo(() => onboardingMetrics(websites), [websites])
  const highlight = useFlashOnChange(m.active)

  return (
    <section aria-labelledby="embedded-ordering-heading">
      <SectionHeader
        title="Embedded Ordering Rollout"
        description="Primary rollout metric — online ordering status across the website portfolio"
      />
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={cn('app-card overflow-hidden transition-shadow', highlight && 'ring-2 ring-primary-400/50')}
      >
        <div className="lg:grid lg:grid-cols-[auto_1fr]">
          {/* Breakdown — donut + legend */}
          <div className="flex flex-col items-center gap-5 p-5 sm:flex-row sm:items-center sm:gap-8 lg:flex-col lg:items-start lg:border-r lg:border-line">
            <DonutChart
              data={[
                { name: 'Completed', value: m.active, color: COMPLETED_COLOR },
                { name: 'In Progress', value: m.inProgress, color: IN_PROGRESS_COLOR },
                { name: 'Not Started', value: m.notStarted, color: NOT_STARTED_COLOR },
                { name: 'NA', value: m.noNeed, color: NA_COLOR },
              ]}
              centerValue={String(m.active)}
              centerLabel="Completed"
              size={176}
            />
            <div className="w-full max-w-[240px] divide-y divide-line/70 lg:max-w-none">
              <LegendRow label="Completed" value={m.active} total={m.total} color={COMPLETED_COLOR} />
              <LegendRow label="In Progress" value={m.inProgress} total={m.total} color={IN_PROGRESS_COLOR} />
              <LegendRow label="Not Started" value={m.notStarted} total={m.total} color={NOT_STARTED_COLOR} />
              <LegendRow label="NA" value={m.noNeed} total={m.total} color={NA_COLOR} />
            </div>
          </div>

          {/* Headline — completion rate */}
          <div className="flex flex-col justify-center p-5">
            <span className="eyebrow">Completion rate</span>

            <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="text-5xl font-bold tabular-nums tracking-tight text-primary-600 dark:text-primary-400">
                {pct(m.active, m.total, 0)}
              </span>
              <span className="text-sm text-sub">
                <span className="font-semibold text-ink">{m.active}</span> of {m.total} websites have ordering live
              </span>
            </div>

            <ProgressBar
              value={m.total ? (m.active / m.total) * 100 : 0}
              tone="primary"
              size="md"
              className="mt-4"
              aria-label="Embedded ordering completion across all websites"
            />

            <div className="mt-5 flex items-center justify-between border-t border-line pt-4 text-xs text-sub">
              <span>
                <span className="font-semibold text-ink">{m.inProgress}</span> in progress
              </span>
              <span>
                <span className="font-semibold text-ink">{m.notStarted}</span> not started yet
              </span>
              <span>
                <span className="font-semibold text-ink">{m.noNeed}</span> not applicable
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
