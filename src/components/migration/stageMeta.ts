import type { LucideIcon } from 'lucide-react'
import { CircleCheck, ClipboardList, FlaskConical, Wrench } from 'lucide-react'
import type { MigrationStage } from '@/types'
import type { BadgeTone } from '@/components/common/Badge'
import type { MetricTone } from '@/components/common/MetricCard'

/** Per-stage visual metadata shared by the board, cards, metrics and drawer. */
export interface StageMeta {
  icon: LucideIcon
  /** Column-header dot color. */
  dot: string
  /** ProgressBar tone for cards in this stage. */
  bar: 'slate' | 'amber' | 'primary' | 'emerald'
  /** Count badge tone for the column header. */
  badge: BadgeTone
  /** Summary MetricCard tone. */
  metric: MetricTone
}

export const STAGE_META: Record<MigrationStage, StageMeta> = {
  planning: { icon: ClipboardList, dot: 'bg-slate-400', bar: 'slate', badge: 'slate', metric: 'slate' },
  'in-progress': { icon: Wrench, dot: 'bg-amber-500', bar: 'amber', badge: 'amber', metric: 'amber' },
  testing: { icon: FlaskConical, dot: 'bg-primary-500', bar: 'primary', badge: 'red', metric: 'indigo' },
  completed: { icon: CircleCheck, dot: 'bg-emerald-500', bar: 'emerald', badge: 'emerald', metric: 'emerald' },
}
