import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Copy, MoreHorizontal, Pencil, Trash2, Users } from 'lucide-react'
import type { Client, Feature } from '@/types'
import { FEATURE_CATEGORY_LABELS } from '@/types'
import { useAppStore } from '@/store/appStore'
import { toast } from '@/store/toastStore'
import { fmtDate } from '@/utils/date'
import { cn } from '@/utils/cn'
import { Badge } from '@/components/common/Badge'
import { IconButton } from '@/components/common/Button'
import { Checkbox } from '@/components/common/Checkbox'
import { DropdownMenu } from '@/components/common/DropdownMenu'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Switch } from '@/components/common/Switch'
import { Tooltip } from '@/components/common/Tooltip'

const TOOLTIP_NAME_LIMIT = 8

interface FeatureCardProps {
  feature: Feature
  clients: Client[]
  /** Entrance-stagger position inside its category grid. */
  index: number
  compareMode: boolean
  selected: boolean
  onToggleSelect: (id: string) => void
  onEdit: (feature: Feature) => void
  onDuplicate: (feature: Feature) => void
  onDelete: (feature: Feature) => void
}

export function FeatureCard({
  feature,
  clients,
  index,
  compareMode,
  selected,
  onToggleSelect,
  onEdit,
  onDuplicate,
  onDelete,
}: FeatureCardProps) {
  const toggleFeature = useAppStore((s) => s.toggleFeature)

  const supportedNames = useMemo(() => {
    const byId = new Map(clients.map((c) => [c.id, c.name]))
    return feature.supportedClientIds
      .map((id) => byId.get(id))
      .filter((n): n is string => Boolean(n))
  }, [clients, feature.supportedClientIds])

  const clientCount = supportedNames.length
  const overflow = Math.max(0, clientCount - TOOLTIP_NAME_LIMIT)

  const handleToggleEnabled = (next: boolean) => {
    toggleFeature(feature.id)
    toast.success(next ? 'Feature enabled' : 'Feature disabled', feature.name)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut', delay: Math.min(index * 0.03, 0.24) }}
      onClick={compareMode ? () => onToggleSelect(feature.id) : undefined}
      className={cn(
        'app-card flex flex-col p-4 transition-shadow hover:shadow-pop',
        compareMode && 'cursor-pointer select-none',
        selected && 'ring-2 ring-primary-500',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          {compareMode && (
            <Checkbox
              checked={selected}
              onChange={() => onToggleSelect(feature.id)}
              onClick={(e) => e.stopPropagation()}
              aria-label={`Select ${feature.name} for comparison`}
            />
          )}
          <h3 className="min-w-0 truncate text-sm font-semibold text-ink" title={feature.name}>
            {feature.name}
          </h3>
        </div>
        {!compareMode && (
          <DropdownMenu
            align="end"
            groups={[
              {
                items: [
                  { key: 'edit', label: 'Edit', icon: Pencil, onSelect: () => onEdit(feature) },
                  { key: 'duplicate', label: 'Duplicate', icon: Copy, onSelect: () => onDuplicate(feature) },
                ],
              },
              {
                items: [
                  { key: 'delete', label: 'Delete', icon: Trash2, danger: true, onSelect: () => onDelete(feature) },
                ],
              },
            ]}
            trigger={(props) => (
              <IconButton
                {...props}
                size="xs"
                variant="ghost"
                className="-mr-1 -mt-0.5 shrink-0"
                aria-label={`Actions for ${feature.name}`}
              >
                <MoreHorizontal className="h-4 w-4" aria-hidden />
              </IconButton>
            )}
          />
        )}
      </div>

      <p className="mt-1.5 line-clamp-2 min-h-[2.4rem] text-xs leading-relaxed text-sub">
        {feature.description}
      </p>

      <div className="mt-auto pt-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <StatusBadge status={feature.status} />
          <Badge tone="slate">{FEATURE_CATEGORY_LABELS[feature.category]}</Badge>
          <span className="ml-auto whitespace-nowrap text-2xs text-faint">
            Updated {fmtDate(feature.updatedAt)}
          </span>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2 border-t border-line pt-3">
          <Tooltip
            disabled={clientCount === 0}
            content={
              <div className="space-y-0.5">
                {supportedNames.slice(0, TOOLTIP_NAME_LIMIT).map((name) => (
                  <div key={name}>{name}</div>
                ))}
                {overflow > 0 && <div className="text-slate-400 dark:text-slate-500">+{overflow} more</div>}
              </div>
            }
          >
            <span
              tabIndex={0}
              className="focus-ring inline-flex cursor-default items-center gap-1.5 rounded-md text-xs font-medium text-sub"
            >
              <Users className="h-3.5 w-3.5 text-faint" aria-hidden />
              {clientCount} {clientCount === 1 ? 'client' : 'clients'}
            </span>
          </Tooltip>

          <div
            className="flex items-center gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-xs font-medium text-sub">Enabled</span>
            <Switch
              size="sm"
              checked={feature.enabled}
              onChange={handleToggleEnabled}
              aria-label={`${feature.enabled ? 'Disable' : 'Enable'} ${feature.name}`}
            />
          </div>
        </div>
      </div>
    </motion.div>
  )
}
