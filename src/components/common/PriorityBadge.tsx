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
  const { label, tone, Icon } = CONFIG[priority]
  return (
    <Badge tone={tone} uppercase className={cn('gap-1', className)}>
      <Icon className="h-3 w-3" aria-hidden />
      {label}
    </Badge>
  )
}
