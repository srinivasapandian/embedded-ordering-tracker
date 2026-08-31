import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, Clock, Globe, MinusCircle, XCircle, type LucideIcon } from 'lucide-react'
import { AnimatedNumber } from '@/components/common/AnimatedNumber'
import { DonutChart } from '@/components/common/DonutChart'
import { EmptyState } from '@/components/common/EmptyState'
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

type StatTone = 'emerald' | 'amber' | 'red' | 'slate'

const TONE_ICON_WRAP: Record<StatTone, string> = {
  emerald: 'bg-emerald-500 text-white',
  amber: 'bg-amber-500 text-white',
  red: 'bg-red-500 text-white',
  slate: 'bg-slate-400 text-white dark:bg-slate-500',
}

interface StatTileProps {
  icon: LucideIcon
  tone: StatTone
  label: string
  value: number
  total: number
}

function StatTile({ icon: Icon, tone, label, value, total }: StatTileProps) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-line bg-elev/40 px-3.5 py-3">
      <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full', TONE_ICON_WRAP[tone])}>
        <Icon className="h-[18px] w-[18px]" aria-hidden />
      </span>
      <div className="min-w-0">
        <div className="flex items-baseline gap-1.5">
          <AnimatedNumber value={value} className="text-lg font-bold tabular-nums leading-none tracking-tight text-ink" />
          <span className="text-2xs tabular-nums text-faint">{pct(value, total, 0)}</span>
        </div>
        <p className="mt-0.5 truncate text-2xs font-medium uppercase tracking-wide text-faint">{label}</p>
      </div>
    </div>
  )
}

interface Segment {
  value: number
  color: string
  label: string
}

/** Single-row stacked bar — each status renders as a proportional colored segment. */
function SegmentedBar({ segments, total }: { segments: Segment[]; total: number }) {
  return (
    <div
      className="flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full bg-elev"
      role="img"
      aria-label={segments.map((s) => `${s.label} ${pct(s.value, total, 0)}`).join(', ')}
    >
      {segments
        .filter((s) => s.value > 0)
        .map((s) => (
          <motion.div
            key={s.label}
            className="h-full first:rounded-l-full last:rounded-r-full"
            style={{ backgroundColor: s.color }}
            initial={{ width: 0 }}
            animate={{ width: `${(s.value / total) * 100}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        ))}
    </div>
  )
}

/** Primary dashboard metric — the embedded ordering rollout across all websites. */
export function EmbeddedOrderingRollout() {
  const websites = useAppStore((s) => s.websites)
  const m = useMemo(() => onboardingMetrics(websites), [websites])
  const highlight = useFlashOnChange(m.active)
  const navigate = useNavigate()

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
        className={cn('app-card overflow-hidden p-5 transition-shadow md:p-6', highlight && 'ring-2 ring-primary-400/50')}
      >
        {m.total === 0 ? (
          <EmptyState
            icon={Globe}
            title="No websites tracked yet"
            description="Add a client with a website from the Admin Panel to start tracking embedded ordering rollout."
            actionLabel="Go to Admin Panel"
            onAction={() => navigate('/admin')}
          />
        ) : (
          <>
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
              <div className="flex shrink-0 items-center gap-5">
                <DonutChart
                  data={[
                    { name: 'Completed', value: m.active, color: COMPLETED_COLOR },
                    { name: 'In Progress', value: m.inProgress, color: IN_PROGRESS_COLOR },
                    { name: 'Not Started', value: m.notStarted, color: NOT_STARTED_COLOR },
                    { name: 'NA', value: m.noNeed, color: NA_COLOR },
                  ]}
                  centerValue={pct(m.active, m.total, 0)}
                  centerLabel="Ordering live"
                  size={148}
                  thickness={16}
                />
                <div>
                  <span className="eyebrow">Completion rate</span>
                  <div className="mt-1 text-4xl font-bold tabular-nums tracking-tight text-primary-600 dark:text-primary-400">
                    {pct(m.active, m.total, 0)}
                  </div>
                  <p className="mt-1 text-sm text-sub">
                    <span className="font-semibold text-ink">{m.active}</span> of {m.total} websites live
                  </p>
                </div>
              </div>

              <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-4">
                <StatTile icon={CheckCircle2} tone="emerald" label="Completed" value={m.active} total={m.total} />
                <StatTile icon={Clock} tone="amber" label="In Progress" value={m.inProgress} total={m.total} />
                <StatTile icon={XCircle} tone="red" label="Not Started" value={m.notStarted} total={m.total} />
                <StatTile icon={MinusCircle} tone="slate" label="N/A" value={m.noNeed} total={m.total} />
              </div>
            </div>

            <div className="mt-6">
              <SegmentedBar
                total={m.total}
                segments={[
                  { value: m.active, color: COMPLETED_COLOR, label: 'Completed' },
                  { value: m.inProgress, color: IN_PROGRESS_COLOR, label: 'In Progress' },
                  { value: m.notStarted, color: NOT_STARTED_COLOR, label: 'Not Started' },
                  { value: m.noNeed, color: NA_COLOR, label: 'NA' },
                ]}
              />
            </div>
          </>
        )}
      </motion.div>
    </section>
  )
}
