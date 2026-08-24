import { useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { GitBranch } from 'lucide-react'
import type { Migration } from '@/types'
import { FRAMEWORK_LABELS, MIGRATION_STAGE_LABELS, MIGRATION_STAGES_ORDERED, PRIORITY_LABELS } from '@/types'
import { useAppStore } from '@/store/appStore'
import { useSimulatedLoad } from '@/hooks/useSimulatedLoad'
import { useDebounce } from '@/hooks/useDebounce'
import { clientById, websiteById } from '@/utils/selectors'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { PriorityBadge } from '@/components/common/PriorityBadge'
import { SearchInput } from '@/components/common/SearchInput'
import { SkeletonTable } from '@/components/common/Skeleton'
import { StatusBadge } from '@/components/common/StatusBadge'
import { ColumnToggleMenu, SortableHeader } from '@/components/common/table'
import { MigrationDrawer } from '@/components/migration/MigrationDrawer'
import { AdminDataTable, AdminToolbar, RowActionButton } from './adminShared'
import { useAdminTable } from './useAdminTable'

const PRIORITY_VALUES = ['high', 'medium', 'low'] as const

const stageOptions = MIGRATION_STAGES_ORDERED.map((v) => ({ value: v, label: MIGRATION_STAGE_LABELS[v] }))
const priorityOptions = PRIORITY_VALUES.map((v) => ({ value: v, label: PRIORITY_LABELS[v] }))

/** Read-only mirror of migration records — every field here is edited from the Client Tracker's onboarding form. */
export function MigrationsManager() {
  const migrations = useAppStore((s) => s.migrations)
  const websites = useAppStore((s) => s.websites)
  const clients = useAppStore((s) => s.clients)
  const load = useSimulatedLoad(420)

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
          return site ? <StatusBadge status={site.framework} /> : <span className="text-sm text-faint">—</span>
        },
      },
      {
        accessorKey: 'targetStack',
        meta: { label: 'Target Stack' },
        header: ({ column }) => <SortableHeader column={column}>Target Stack</SortableHeader>,
        cell: ({ row }) => <StatusBadge status={row.original.targetStack} label={FRAMEWORK_LABELS[row.original.targetStack]} />,
      },
      {
        accessorKey: 'stage',
        meta: { label: 'Migration Status' },
        header: ({ column }) => <SortableHeader column={column}>Migration Status</SortableHeader>,
        cell: ({ row }) => <StatusBadge status={row.original.stage} />,
      },
      {
        accessorKey: 'quarter',
        meta: { label: 'Migration Quarter' },
        header: ({ column }) => <SortableHeader column={column}>Migration Quarter</SortableHeader>,
        cell: ({ row }) => <span className="text-sm text-sub">{row.original.quarter || '—'}</span>,
      },
      {
        accessorKey: 'priority',
        meta: { label: 'Priority' },
        header: ({ column }) => <SortableHeader column={column}>Priority</SortableHeader>,
        cell: ({ row }) => <PriorityBadge priority={row.original.priority} />,
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
            <RowActionButton label="View details" icon={GitBranch} onClick={() => setDrawerId(row.original.id)} />
          </div>
        ),
      },
    ],
    [websites, clients],
  )

  const { table } = useAdminTable({
    data: filtered,
    columns,
    getRowId: (m) => m.id,
    initialSorting: [{ id: 'stage', desc: false }],
    enableSelection: false,
  })

  const hasFilters = search !== '' || stageFilter.length > 0 || priorityFilter.length > 0
  const clearFilters = () => {
    setSearch('')
    setStageFilter([])
    setPriorityFilter([])
  }

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
                : 'Migrations are created from the Client Tracker onboarding form.'
            }
            actionLabel={hasFilters ? 'Clear filters' : undefined}
            onAction={hasFilters ? clearFilters : undefined}
          />
        }
      />

      <MigrationDrawer migrationId={drawerId} onClose={() => setDrawerId(null)} readOnly />
    </div>
  )
}
