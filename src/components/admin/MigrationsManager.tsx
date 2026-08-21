import { useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { ChevronDown, GitBranch } from 'lucide-react'
import type { Framework, Migration, MigrationStage, Priority } from '@/types'
import {
  FRAMEWORK_LABELS,
  MIGRATION_STAGE_LABELS,
  MIGRATION_STAGES_ORDERED,
  PRIORITY_LABELS,
  quarterOptions,
} from '@/types'
import { useAppStore } from '@/store/appStore'
import { toast } from '@/store/toastStore'
import { useSimulatedLoad } from '@/hooks/useSimulatedLoad'
import { useDebounce } from '@/hooks/useDebounce'
import { clientById, websiteById } from '@/utils/selectors'
import { Button } from '@/components/common/Button'
import { DropdownMenu, type MenuItem } from '@/components/common/DropdownMenu'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { PriorityBadge } from '@/components/common/PriorityBadge'
import { SearchInput } from '@/components/common/SearchInput'
import { SkeletonTable } from '@/components/common/Skeleton'
import { StatusBadge } from '@/components/common/StatusBadge'
import { ColumnToggleMenu, SortableHeader } from '@/components/common/table'
import { MigrationDrawer } from '@/components/migration/MigrationDrawer'
import {
  AdminDataTable,
  AdminToolbar,
  BulkBar,
  DisabledHint,
  RowActionButton,
  selectionColumn,
  usePerms,
} from './adminShared'
import { InlineSelectCell } from './inlineCells'
import { useAdminTable } from './useAdminTable'

const FRAMEWORK_VALUES = ['react', 'nextjs'] as const
const PRIORITY_VALUES = ['high', 'medium', 'low'] as const

const stageOptions = MIGRATION_STAGES_ORDERED.map((v) => ({ value: v, label: MIGRATION_STAGE_LABELS[v] }))
const stackOptions = FRAMEWORK_VALUES.map((v) => ({ value: v, label: FRAMEWORK_LABELS[v] }))
const priorityOptions = PRIORITY_VALUES.map((v) => ({ value: v, label: PRIORITY_LABELS[v] }))
const quarterChoices = quarterOptions()
const quarterOptionList = quarterChoices.map((q) => ({ value: q, label: q }))

/** Admin manager for migration records: current/target stack, status, quarter and priority. */
export function MigrationsManager() {
  const migrations = useAppStore((s) => s.migrations)
  const websites = useAppStore((s) => s.websites)
  const clients = useAppStore((s) => s.clients)
  const updateWebsite = useAppStore((s) => s.updateWebsite)
  const updateMigration = useAppStore((s) => s.updateMigration)
  const moveMigration = useAppStore((s) => s.moveMigration)
  const bulkUpdateMigrations = useAppStore((s) => s.bulkUpdateMigrations)
  const { can, denyReason } = usePerms()
  const load = useSimulatedLoad(420)

  const canEdit = can('manage-migration')

  const [search, setSearch] = useState('')
  const query = useDebounce(search, 200)
  const [stageFilter, setStageFilter] = useState<string[]>([])
  const [priorityFilter, setPriorityFilter] = useState<string[]>([])
  const [drawerId, setDrawerId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return migrations.filter((m) => {
      if (stageFilter.length > 0 && !stageFilter.includes(m.stage)) return false
      if (priorityFilter.length > 0 && !priorityFilter.includes(m.priority)) return false
      if (!q) return true
      const site = websiteById(websites, m.websiteId)
      const client = site ? clientById(clients, site.clientId) : undefined
      return [site?.name, site?.domain, client?.name].some((v) => v?.toLowerCase().includes(q))
    })
  }, [migrations, websites, clients, query, stageFilter, priorityFilter])

  const columns = useMemo<ColumnDef<Migration>[]>(
    () => [
      selectionColumn<Migration>(),
      {
        id: 'client',
        meta: { label: 'Client' },
        accessorFn: (m) => {
          const site = websiteById(websites, m.websiteId)
          return (site ? clientById(clients, site.clientId)?.name : undefined) ?? ''
        },
        header: ({ column }) => <SortableHeader column={column}>Client</SortableHeader>,
        cell: ({ row }) => {
          const site = websiteById(websites, row.original.websiteId)
          const client = site ? clientById(clients, site.clientId) : undefined
          return (
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-ink">{client?.name ?? 'Unknown client'}</p>
              <p className="truncate text-xs text-sub">{site?.domain}</p>
            </div>
          )
        },
      },
      {
        id: 'currentStack',
        meta: { label: 'Current Stack' },
        accessorFn: (m) => websiteById(websites, m.websiteId)?.framework ?? '',
        header: ({ column }) => <SortableHeader column={column}>Current Stack</SortableHeader>,
        cell: ({ row }) => {
          const site = websiteById(websites, row.original.websiteId)
          if (!site) return <span className="text-sm text-faint">—</span>
          return (
            <InlineSelectCell
              value={site.framework}
              options={stackOptions}
              ariaLabel={`Current stack for ${site.name}`}
              display={<StatusBadge status={site.framework} />}
              disabled={!canEdit}
              disabledReason={denyReason}
              onSave={(v) => updateWebsite(site.id, { framework: v as Framework })}
            />
          )
        },
      },
      {
        accessorKey: 'targetStack',
        meta: { label: 'Target Stack' },
        header: ({ column }) => <SortableHeader column={column}>Target Stack</SortableHeader>,
        cell: ({ row }) => (
          <InlineSelectCell
            value={row.original.targetStack}
            options={stackOptions}
            ariaLabel={`Target stack for migration ${row.original.id}`}
            display={<StatusBadge status={row.original.targetStack} />}
            disabled={!canEdit}
            disabledReason={denyReason}
            onSave={(v) => updateMigration(row.original.id, { targetStack: v as Framework })}
          />
        ),
      },
      {
        accessorKey: 'stage',
        meta: { label: 'Migration Status' },
        header: ({ column }) => <SortableHeader column={column}>Migration Status</SortableHeader>,
        cell: ({ row }) => (
          <InlineSelectCell
            value={row.original.stage}
            options={stageOptions}
            ariaLabel={`Migration status for migration ${row.original.id}`}
            display={<StatusBadge status={row.original.stage} />}
            disabled={!canEdit}
            disabledReason={denyReason}
            onSave={(v) => moveMigration(row.original.id, v as MigrationStage)}
          />
        ),
      },
      {
        accessorKey: 'quarter',
        meta: { label: 'Migration Quarter' },
        header: ({ column }) => <SortableHeader column={column}>Migration Quarter</SortableHeader>,
        cell: ({ row }) => (
          <InlineSelectCell
            value={row.original.quarter}
            options={quarterOptionList}
            ariaLabel={`Migration quarter for migration ${row.original.id}`}
            disabled={!canEdit}
            disabledReason={denyReason}
            onSave={(v) => updateMigration(row.original.id, { quarter: v })}
          />
        ),
      },
      {
        accessorKey: 'priority',
        meta: { label: 'Priority' },
        header: ({ column }) => <SortableHeader column={column}>Priority</SortableHeader>,
        cell: ({ row }) => (
          <InlineSelectCell
            value={row.original.priority}
            options={priorityOptions}
            ariaLabel={`Priority for migration ${row.original.id}`}
            display={<PriorityBadge priority={row.original.priority} />}
            disabled={!canEdit}
            disabledReason={denyReason}
            onSave={(v) => updateMigration(row.original.id, { priority: v as Priority })}
          />
        ),
      },
      {
        id: 'progress',
        meta: { label: 'Progress' },
        accessorFn: (m) => m.progress,
        header: ({ column }) => <SortableHeader column={column}>Progress</SortableHeader>,
        cell: ({ row }) => <span className="text-sm tabular-nums text-ink">{row.original.progress}%</span>,
      },
      {
        id: 'actions',
        size: 64,
        enableSorting: false,
        enableHiding: false,
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-0.5">
            <RowActionButton label="Open details" icon={GitBranch} onClick={() => setDrawerId(row.original.id)} />
          </div>
        ),
      },
    ],
    [websites, clients, canEdit, denyReason, updateWebsite, updateMigration, moveMigration],
  )

  const { table, selectedIds, clearSelection } = useAdminTable({
    data: filtered,
    columns,
    getRowId: (m) => m.id,
    initialSorting: [{ id: 'stage', desc: false }],
  })

  const hasFilters = search !== '' || stageFilter.length > 0 || priorityFilter.length > 0
  const clearFilters = () => {
    setSearch('')
    setStageFilter([])
    setPriorityFilter([])
  }

  const bulkStageItems: MenuItem[] = MIGRATION_STAGES_ORDERED.map((v) => ({
    key: v,
    label: MIGRATION_STAGE_LABELS[v],
    onSelect: () => {
      bulkUpdateMigrations(selectedIds, { stage: v })
      toast.success('Migrations updated', `${selectedIds.length} migrations set to ${MIGRATION_STAGE_LABELS[v]}.`)
      clearSelection()
    },
  }))
  const bulkPriorityItems: MenuItem[] = PRIORITY_VALUES.map((v) => ({
    key: v,
    label: PRIORITY_LABELS[v],
    onSelect: () => {
      bulkUpdateMigrations(selectedIds, { priority: v })
      toast.success('Migrations updated', `${selectedIds.length} migrations set to ${PRIORITY_LABELS[v]} priority.`)
      clearSelection()
    },
  }))
  const bulkQuarterItems: MenuItem[] = quarterChoices.map((q) => ({
    key: q,
    label: q,
    onSelect: () => {
      for (const id of selectedIds) updateMigration(id, { quarter: q })
      toast.success('Migrations updated', `${selectedIds.length} migrations set to ${q}.`)
      clearSelection()
    },
  }))

  if (load.loading) {
    return (
      <div className="app-card overflow-hidden">
        <SkeletonTable rows={8} cols={7} />
      </div>
    )
  }
  if (load.error) {
    return (
      <div className="app-card">
        <ErrorState onRetry={() => load.reload()} />
      </div>
    )
  }

  return (
    <div className="app-card overflow-hidden">
      <AdminToolbar>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search client or site…"
          className="w-64"
          aria-label="Search migrations"
        />
        <FilterDropdown label="Status" options={stageOptions} selected={stageFilter} onChange={setStageFilter} />
        <FilterDropdown label="Priority" options={priorityOptions} selected={priorityFilter} onChange={setPriorityFilter} />
        <div className="ml-auto flex items-center gap-2">
          <ColumnToggleMenu table={table} />
        </div>
      </AdminToolbar>

      <BulkBar count={selectedIds.length} onClear={clearSelection}>
        {canEdit ? (
          <>
            <DropdownMenu
              align="start"
              trigger={(props) => (
                <Button size="xs" variant="outline" {...props}>
                  Change Status <ChevronDown className="h-3 w-3" aria-hidden />
                </Button>
              )}
              groups={[{ items: bulkStageItems }]}
            />
            <DropdownMenu
              align="start"
              trigger={(props) => (
                <Button size="xs" variant="outline" {...props}>
                  Change Priority <ChevronDown className="h-3 w-3" aria-hidden />
                </Button>
              )}
              groups={[{ items: bulkPriorityItems }]}
            />
            <DropdownMenu
              align="start"
              trigger={(props) => (
                <Button size="xs" variant="outline" {...props}>
                  Change Quarter <ChevronDown className="h-3 w-3" aria-hidden />
                </Button>
              )}
              groups={[{ items: bulkQuarterItems }]}
            />
          </>
        ) : (
          <DisabledHint when reason={denyReason}>
            <Button size="xs" variant="outline" disabled>
              Bulk edit
            </Button>
          </DisabledHint>
        )}
      </BulkBar>

      <AdminDataTable
        table={table}
        stickyHeader
        empty={
          <EmptyState
            icon={GitBranch}
            title={hasFilters ? 'No migrations match your filters' : 'No migrations yet'}
            description={
              hasFilters
                ? 'Try adjusting the search or clearing the active filters.'
                : 'Migrations are created from the Migration board.'
            }
            actionLabel={hasFilters ? 'Clear filters' : undefined}
            onAction={hasFilters ? clearFilters : undefined}
          />
        }
      />

      <MigrationDrawer migrationId={drawerId} onClose={() => setDrawerId(null)} />
    </div>
  )
}
