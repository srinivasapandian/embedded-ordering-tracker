import { useCallback, useMemo, useRef, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import type { Client, Migration, MigrationStage, TeamMember, Website } from '@/types'
import { MIGRATION_STAGES_ORDERED, MIGRATION_STAGE_LABELS } from '@/types'
import { useAppStore } from '@/store/appStore'
import { toast } from '@/store/toastStore'
import { cn } from '@/utils/cn'
import { Badge } from '@/components/common/Badge'
import { MigrationCardBody, SortableMigrationCard } from './MigrationCard'
import { STAGE_META } from './stageMeta'

const COLUMN_PREFIX = 'column-'

interface MigrationBoardProps {
  migrations: Migration[]
  websiteMap: Map<string, Website>
  clientMap: Map<string, Client>
  memberMap: Map<string, TeamMember>
  batchMode: boolean
  selectedIds: ReadonlySet<string>
  onToggleSelect: (id: string) => void
  onOpenDetails: (id: string) => void
}

/** Four-column React → Next.js kanban board with drag & drop stage moves. */
export function MigrationBoard({
  migrations,
  websiteMap,
  clientMap,
  memberMap,
  batchMode,
  selectedIds,
  onToggleSelect,
  onOpenDetails,
}: MigrationBoardProps) {
  const moveMigration = useAppStore((s) => s.moveMigration)
  const [activeId, setActiveId] = useState<string | null>(null)
  const justDraggedRef = useRef(false)
  const wasDragged = useCallback(() => justDraggedRef.current, [])

  const grouped = useMemo(() => {
    const groups: Record<MigrationStage, Migration[]> = {
      planning: [],
      'in-progress': [],
      testing: [],
      completed: [],
    }
    for (const m of migrations) groups[m.stage].push(m)
    for (const stage of MIGRATION_STAGES_ORDERED) {
      groups[stage].sort((a, b) => a.order - b.order || a.id.localeCompare(b.id))
    }
    return groups
  }, [migrations])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const activeMigration = activeId ? migrations.find((m) => m.id === activeId) : undefined

  const settleDrag = () => {
    setActiveId(null)
    // Let the trailing click event (fired on pointer-up) see the flag first.
    window.setTimeout(() => {
      justDraggedRef.current = false
    }, 120)
  }

  const handleDragStart = (event: DragStartEvent) => {
    justDraggedRef.current = true
    setActiveId(String(event.active.id))
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    settleDrag()
    if (!over) return
    const migration = migrations.find((m) => m.id === active.id)
    if (!migration) return

    const overId = String(over.id)
    let targetStage: MigrationStage | undefined
    let order: number | undefined

    if (overId.startsWith(COLUMN_PREFIX)) {
      targetStage = overId.slice(COLUMN_PREFIX.length) as MigrationStage
    } else {
      const overMigration = migrations.find((m) => m.id === overId)
      if (overMigration) {
        targetStage = overMigration.stage
        // Insert just above the card the pointer released over.
        if (overMigration.id !== migration.id) order = overMigration.order - 0.5
      }
    }
    if (!targetStage) return

    if (targetStage === migration.stage) {
      // Same-column reorder — silent, no stage change side-effects fire.
      if (order !== undefined) moveMigration(migration.id, targetStage, order)
      return
    }

    // Cross-column move — the store handles progress floors, logs, framework
    // flips on completion and notifications. We only add the toast.
    moveMigration(migration.id, targetStage, order)
    const site = websiteMap.get(migration.websiteId)
    toast.success(
      'Migration status updated',
      `${site?.name ?? 'Website'} moved to ${MIGRATION_STAGE_LABELS[targetStage]}`,
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={settleDrag}
    >
      <div className="grid grid-cols-4 gap-3">
        {MIGRATION_STAGES_ORDERED.map((stage) => (
          <BoardColumn
            key={stage}
            stage={stage}
            items={grouped[stage]}
            websiteMap={websiteMap}
            clientMap={clientMap}
            memberMap={memberMap}
            batchMode={batchMode}
            selectedIds={selectedIds}
            onToggleSelect={onToggleSelect}
            onOpenDetails={onOpenDetails}
            wasDragged={wasDragged}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={{ duration: 200, easing: 'ease-out' }}>
        {activeMigration ? (
          <div className="app-card rotate-2 cursor-grabbing p-3 shadow-pop">
            <MigrationCardBody
              migration={activeMigration}
              website={websiteMap.get(activeMigration.websiteId)}
              client={clientMap.get(websiteMap.get(activeMigration.websiteId)?.clientId ?? '')}
              developer={
                activeMigration.developerId ? memberMap.get(activeMigration.developerId) : undefined
              }
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

interface BoardColumnProps {
  stage: MigrationStage
  items: Migration[]
  websiteMap: Map<string, Website>
  clientMap: Map<string, Client>
  memberMap: Map<string, TeamMember>
  batchMode: boolean
  selectedIds: ReadonlySet<string>
  onToggleSelect: (id: string) => void
  onOpenDetails: (id: string) => void
  wasDragged: () => boolean
}

function BoardColumn({
  stage,
  items,
  websiteMap,
  clientMap,
  memberMap,
  batchMode,
  selectedIds,
  onToggleSelect,
  onOpenDetails,
  wasDragged,
}: BoardColumnProps) {
  const meta = STAGE_META[stage]
  const label = MIGRATION_STAGE_LABELS[stage]
  const { setNodeRef, isOver } = useDroppable({ id: `${COLUMN_PREFIX}${stage}` })
  const StageIcon = meta.icon

  return (
    <section
      aria-label={`${label} — ${items.length} migration${items.length === 1 ? '' : 's'}`}
      className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-line bg-elev/40"
    >
      <header className="flex items-center gap-2 border-b border-line/70 px-3 py-2.5">
        <span className={cn('h-2 w-2 shrink-0 rounded-full', meta.dot)} aria-hidden />
        <h3 className="truncate text-xs font-semibold uppercase tracking-wide text-sub">{label}</h3>
        <Badge tone={meta.badge} className="ml-auto tabular-nums">
          {items.length}
        </Badge>
      </header>

      <SortableContext items={items.map((m) => m.id)} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={cn(
            'flex min-h-[320px] flex-1 flex-col gap-2 overflow-y-auto p-2 transition-colors duration-150',
            isOver && 'bg-primary-500/[0.06]',
          )}
        >
          {items.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-line-strong/60 px-3 py-6 text-center">
              <StageIcon className="h-4 w-4 text-faint" aria-hidden />
              <p className="mt-1.5 text-xs text-faint">No migrations in {label}</p>
            </div>
          ) : (
            items.map((migration) => {
              const website = websiteMap.get(migration.websiteId)
              return (
                <SortableMigrationCard
                  key={migration.id}
                  migration={migration}
                  website={website}
                  client={website ? clientMap.get(website.clientId) : undefined}
                  developer={migration.developerId ? memberMap.get(migration.developerId) : undefined}
                  batchMode={batchMode}
                  selected={selectedIds.has(migration.id)}
                  onToggleSelect={onToggleSelect}
                  onOpen={onOpenDetails}
                  wasDragged={wasDragged}
                />
              )
            })
          )}
        </div>
      </SortableContext>
    </section>
  )
}
