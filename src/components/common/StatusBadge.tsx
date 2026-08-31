import type {
  ClientStatus,
  DeploymentStatus,
  Framework,
  MigrationStage,
  OrderingStatus,
  PriorityItemStatus,
} from '@/types'
import { Badge, type BadgeTone } from './Badge'

/**
 * Every status literal used across the app, mapped to a tone + label.
 * Statuses are always shown as dot + text so color is never the only signal.
 */
export type AnyStatus =
  | OrderingStatus
  | ClientStatus
  | MigrationStage
  | PriorityItemStatus
  | DeploymentStatus
  | Framework

const STATUS_CONFIG: Record<AnyStatus, { label: string; tone: BadgeTone }> = {
  // Shared literals resolve to one sensible config
  active: { label: 'Active', tone: 'emerald' },
  'in-progress': { label: 'In Progress', tone: 'amber' },
  'no-need': { label: 'No Need', tone: 'slate' },
  'not-started': { label: 'Not Started', tone: 'red' },
  completed: { label: 'Completed', tone: 'emerald' },
  blocked: { label: 'Blocked', tone: 'red' },
  planning: { label: 'Planning', tone: 'sky' },
  testing: { label: 'Testing', tone: 'amber' },
  review: { label: 'Review', tone: 'violet' },
  deployed: { label: 'Deployed', tone: 'emerald' },
  planned: { label: 'Planned', tone: 'sky' },
  react: { label: 'React', tone: 'sky' },
  nextjs: { label: 'Next.js', tone: 'ink' },
  html: { label: 'HTML', tone: 'slate' },
  shopify: { label: 'Shopify', tone: 'emerald' },
  wordpress: { label: 'WordPress', tone: 'violet' },
  wix: { label: 'WIX', tone: 'amber' },
  unknown: { label: 'Unknown', tone: 'slate' },
}

interface StatusBadgeProps {
  status: AnyStatus
  /** Override the derived label (e.g. 'Online Ordering Active'). */
  label?: string
  className?: string
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, tone: 'slate' as BadgeTone }
  return (
    <Badge tone={cfg.tone} dot className={className}>
      {label ?? cfg.label}
    </Badge>
  )
}
