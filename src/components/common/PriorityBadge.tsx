import { ArrowDown, ArrowUp, Minus } from 'lucide-react'
import type { Priority } from '@/types'
import { cn } from '@/utils/cn'
import { Badge, type BadgeTone } from './Badge'

const CONFIG: Record<Priority, { label: string; tone: BadgeTone; Icon: typeof ArrowUp }> = {
  high: { label: 'High', tone: 'red', Icon: ArrowUp },
  medium: { label: 'Medium', tone: 'amber', Icon: Minus },
  low: { label: 'Low', tone: 'sky', Icon: ArrowDown },
}

export function PriorityBadge({ priority, className }: { priority: Priority; className?: string }) {
  // Firestore data isn't type-checked at runtime — a doc missing/with a bad
  // `priority` value should show a neutral badge instead of crashing the page.
  const { label, tone, Icon } = CONFIG[priority] ?? { label: priority ?? '—', tone: 'slate' as const, Icon: Minus }
  return (
    // Fixed width so High/Medium/Low badges line up cleanly in a column
    // instead of each sizing to its own label length.
    <Badge tone={tone} uppercase className={cn('w-[92px] justify-center gap-1', className)}>
      <Icon className="h-3 w-3" aria-hidden />
      {label}
    </Badge>
  )
}
