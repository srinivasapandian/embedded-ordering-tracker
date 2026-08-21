import { useMemo } from 'react'
import type { Client, Migration, MigrationStage, TeamMember, Website } from '@/types'
import { MIGRATION_STAGES_ORDERED, MIGRATION_STAGE_LABELS } from '@/types'
import { cn } from '@/utils/cn'
import { Badge } from '@/components/common/Badge'
import { MigrationCardBody } from './MigrationCard'
import { STAGE_META } from './stageMeta'

interface MigrationBoardProps {
  migrations: Migration[]
  websiteMap: Map<string, Website>
  clientMap: Map<string, Client>
  memberMap: Map<string, TeamMember>
  onOpenDetails: (id: string) => void
}

/**
 * Read-only four-column status board. Stage/priority/assignment changes
 * happen in the Admin Panel's Migration tab — this view is for visibility only.
 */
export function MigrationBoard({ migrations, websiteMap, clientMap, memberMap, onOpenDetails }: MigrationBoardProps) {
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

  return (
    <div className="grid grid-cols-4 gap-3">
      {MIGRATION_STAGES_ORDERED.map((stage) => (
        <BoardColumn
          key={stage}
          stage={stage}
          items={grouped[stage]}
          websiteMap={websiteMap}
          clientMap={clientMap}
          memberMap={memberMap}
          onOpenDetails={onOpenDetails}
        />
      ))}
    </div>
  )
}

interface BoardColumnProps {
  stage: MigrationStage
  items: Migration[]
  websiteMap: Map<string, Website>
  clientMap: Map<string, Client>
  memberMap: Map<string, TeamMember>
  onOpenDetails: (id: string) => void
}

function BoardColumn({ stage, items, websiteMap, clientMap, memberMap, onOpenDetails }: BoardColumnProps) {
  const meta = STAGE_META[stage]
  const label = MIGRATION_STAGE_LABELS[stage]
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

      <div className="flex min-h-[320px] flex-1 flex-col gap-2 p-2">
        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-line-strong/60 px-3 py-6 text-center">
            <StageIcon className="h-4 w-4 text-faint" aria-hidden />
            <p className="mt-1.5 text-xs text-faint">No migrations in {label}</p>
          </div>
        ) : (
          items.map((migration) => {
            const website = websiteMap.get(migration.websiteId)
            return (
              <button
                key={migration.id}
                type="button"
                onClick={() => onOpenDetails(migration.id)}
                aria-label={`View details for ${website?.name ?? 'this migration'}`}
                className="app-card w-full select-none p-3 text-left outline-none transition-shadow hover:shadow-pop focus-ring"
              >
                <MigrationCardBody
                  migration={migration}
                  website={website}
                  client={website ? clientMap.get(website.clientId) : undefined}
                  developer={migration.developerId ? memberMap.get(migration.developerId) : undefined}
                />
              </button>
            )
          })
        )}
      </div>
    </section>
  )
}
