import { useEffect, useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Calendar, Maximize2 } from 'lucide-react'
import type { Client, Migration, TeamMember, Website } from '@/types'
import { useAppStore } from '@/store/appStore'
import { cn } from '@/utils/cn'
import { fmtDate, isOverdue, timeAgo } from '@/utils/date'
import { Checkbox } from '@/components/common/Checkbox'
import { PriorityBadge } from '@/components/common/PriorityBadge'
import { ProgressBar } from '@/components/common/ProgressBar'
import { UserAvatar } from '@/components/common/UserAvatar'
import { STAGE_META } from './stageMeta'

export interface MigrationCardData {
  migration: Migration
  website: Website | undefined
  client: Client | undefined
  developer: TeamMember | undefined
}

interface MigrationCardBodyProps extends MigrationCardData {
  batchMode?: boolean
  selected?: boolean
  onToggleSelect?: (id: string) => void
  onOpen?: (id: string) => void
}

/** Pure card content — reused by the sortable card and the DragOverlay copy. */
export function MigrationCardBody({
  migration,
  website,
  client,
  developer,
  batchMode = false,
  selected = false,
  onToggleSelect,
  onOpen,
}: MigrationCardBodyProps) {
  const meta = STAGE_META[migration.stage]
  const overdue = isOverdue(migration.dueDate) && migration.stage !== 'completed'
  const siteName = website?.name ?? 'Unknown website'

  return (
    <>
      <div className="flex items-start gap-2">
        {batchMode && (
          <Checkbox
            checked={selected}
            onChange={() => onToggleSelect?.(migration.id)}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            aria-label={`Select ${siteName}`}
            className="mt-0.5"
          />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold leading-tight text-ink">{siteName}</p>
          <p className="truncate text-2xs text-faint">{website?.domain ?? '—'}</p>
        </div>
        {!batchMode && onOpen && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onOpen(migration.id)
            }}
            onKeyDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            aria-label={`Open details for ${siteName}`}
            className="focus-ring -mr-1 -mt-1 shrink-0 rounded-md p-1 text-faint opacity-0 transition-opacity hover:bg-elev hover:text-ink focus-visible:opacity-100 group-hover:opacity-100"
          >
            <Maximize2 className="h-3.5 w-3.5" aria-hidden />
          </button>
        )}
      </div>

      <p className="mt-1 truncate text-xs text-sub">{client?.name ?? 'Unknown client'}</p>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <UserAvatar member={developer ?? null} size="xs" tooltip />
        <PriorityBadge priority={migration.priority} />
        <span
          className={cn(
            'inline-flex items-center gap-1 whitespace-nowrap rounded-md bg-elev px-1.5 py-0.5 text-2xs font-medium text-sub',
            overdue && 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400',
          )}
        >
          <Calendar className="h-3 w-3 shrink-0" aria-hidden />
          {fmtDate(migration.dueDate)}
          {overdue && <span className="sr-only">, overdue</span>}
        </span>
      </div>

      <ProgressBar
        value={migration.progress}
        tone={meta.bar}
        size="xs"
        showLabel
        className="mt-2.5"
        aria-label={`${siteName} migration progress`}
      />

      <p className="mt-1.5 text-2xs text-faint">Updated {timeAgo(migration.updatedAt)}</p>
    </>
  )
}

interface SortableMigrationCardProps extends MigrationCardData {
  batchMode: boolean
  selected: boolean
  onToggleSelect: (id: string) => void
  onOpen: (id: string) => void
  /** Consulted on click so a finished drag never opens the drawer. */
  wasDragged: () => boolean
}

/** Draggable kanban card with realtime flash + batch selection support. */
export function SortableMigrationCard({
  migration,
  website,
  client,
  developer,
  batchMode,
  selected,
  onToggleSelect,
  onOpen,
  wasDragged,
}: SortableMigrationCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: migration.id,
    disabled: batchMode,
  })

  const lastRealtimeEvent = useAppStore((s) => s.lastRealtimeEvent)
  const [flash, setFlash] = useState(false)

  useEffect(() => {
    if (!lastRealtimeEvent || lastRealtimeEvent.migrationId !== migration.id) return
    // Ignore stale events (e.g. re-mounting the board after navigation).
    if (Date.now() - lastRealtimeEvent.at > 3000) return
    setFlash(true)
    const t = setTimeout(() => setFlash(false), 1500)
    return () => clearTimeout(t)
  }, [lastRealtimeEvent, migration.id])

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const handleClick = () => {
    if (wasDragged()) return
    if (batchMode) onToggleSelect(migration.id)
    else onOpen(migration.id)
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...(batchMode ? {} : listeners)}
      {...(batchMode ? { role: 'button', tabIndex: 0 } : {})}
      onClick={handleClick}
      onKeyDown={
        batchMode
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onToggleSelect(migration.id)
              }
            }
          : undefined
      }
      aria-label={`${website?.name ?? 'Website'} migration card`}
      className={cn(
        'group app-card select-none p-3 outline-none transition-all duration-200 focus-ring',
        batchMode ? 'cursor-pointer' : 'cursor-grab hover:shadow-pop hover:-translate-y-0.5 hover:border-primary-500/30 active:cursor-grabbing',
        selected && 'border-primary-400/70 ring-1 ring-primary-400/60',
        isDragging && 'opacity-40 rotate-1 shadow-lg',
        flash && 'ring-2 ring-primary-400',
      )}
    >
      <MigrationCardBody
        migration={migration}
        website={website}
        client={client}
        developer={developer}
        batchMode={batchMode}
        selected={selected}
        onToggleSelect={onToggleSelect}
        onOpen={onOpen}
      />
    </div>
  )
}
