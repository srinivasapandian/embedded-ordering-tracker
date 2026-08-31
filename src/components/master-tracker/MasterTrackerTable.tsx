import { useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { MoreHorizontal, Rocket, Upload, UserCheck, Users, Zap, type LucideIcon } from 'lucide-react'
import type { Client, Environment, QaSignoff } from '@/types'
import {
  CLIENT_STAGE_LABELS,
  CLIENT_STATUS_LABELS,
  ENVIRONMENT_LABELS,
  FRAMEWORK_LABELS,
  PRIORITY_LABELS,
  QA_SIGNOFF_LABELS,
} from '@/types'
import { useAppStore } from '@/store/appStore'
import { useDebounce } from '@/hooks/useDebounce'
import { useSimulatedLoad } from '@/hooks/useSimulatedLoad'
import { migrationForWebsite, primaryWebsite } from '@/utils/selectors'
import { buildClientRows } from '@/components/clients/clientRows'
import { fmtDate } from '@/utils/date'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { PriorityBadge } from '@/components/common/PriorityBadge'
import { SearchInput } from '@/components/common/SearchInput'
import { SkeletonTable } from '@/components/common/Skeleton'
import { StatRail, type StatRailItemData } from '@/components/common/StatRail'
import { StatusBadge } from '@/components/common/StatusBadge'
import { ColumnToggleMenu, SortableHeader } from '@/components/common/table'
import { DropdownMenu } from '@/components/common/DropdownMenu'
import { AdminDataTable, AdminToolbar, DisabledHint } from '@/components/admin/adminShared'
import { useAdminTable } from '@/components/admin/useAdminTable'
import { MasterTrackerDrawer } from './MasterTrackerDrawer'

const ENV_TONE: Record<Environment, 'emerald' | 'amber' | 'sky'> = { Production: 'emerald', Staging: 'amber', QA: 'sky' }
const QA_TONE: Record<QaSignoff, 'emerald' | 'amber' | 'slate'> = { 'signed-off': 'emerald', pending: 'amber', 'not-required': 'slate' }

const STATUS_VALUES = ['active', 'in-progress', 'completed', 'blocked'] as const
const PRIORITY_VALUES = ['high', 'medium', 'low'] as const
const STAGE_VALUES = ['onboarded', 'requirements', 'ordering', 'migration', 'qa', 'completed'] as const
const FRAMEWORK_VALUES = ['react', 'nextjs', 'html', 'shopify', 'wordpress', 'wix', 'unknown'] as const

const statusOptions = STATUS_VALUES.map((v) => ({ value: v, label: CLIENT_STATUS_LABELS[v] }))
const priorityOptions = PRIORITY_VALUES.map((v) => ({ value: v, label: PRIORITY_LABELS[v] }))
const stageOptions = STAGE_VALUES.map((v) => ({ value: v, label: CLIENT_STAGE_LABELS[v] }))
const technologyOptions = FRAMEWORK_VALUES.map((v) => ({ value: v, label: FRAMEWORK_LABELS[v] }))

interface KpiDef {
  icon: LucideIcon
  tone: StatRailItemData['tone']
  label: string
}

const KPI_DEFS: KpiDef[] = [
  { icon: Users, tone: 'violet', label: 'Total Clients' },
  { icon: UserCheck, tone: 'emerald', label: 'Completed' },
  { icon: Zap, tone: 'amber', label: 'In Progress' },
  { icon: Rocket, tone: 'primary', label: 'High Priority' },
  { icon: Upload, tone: 'sky', label: 'Migrating' },
]

/** Compact card used for the mobile row layout — same data as the desktop table row. */
function ClientCard({
  client,
  site,
  onView,
}: {
  client: Client
  site: ReturnType<typeof primaryWebsite>
  onView: () => void
}) {
  return (
    <button
      type="button"
      onClick={onView}
      className="focus-ring flex w-full flex-col gap-2.5 rounded-xl border border-line bg-card p-3.5 text-left transition-colors hover:bg-elev/60"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink">{client.name}</p>
          <p className="truncate text-xs text-sub">{client.location}</p>
        </div>
        <PriorityBadge priority={client.priority} className="w-auto shrink-0 px-2" />
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {site && <StatusBadge status={site.framework} />}
        {site && <StatusBadge status={site.orderingStatus} />}
        <StatusBadge status={client.status} />
      </div>
      <p className="text-2xs font-medium uppercase tracking-wide text-faint">{CLIENT_STAGE_LABELS[client.stage]}</p>
    </button>
  )
}

export function MasterTrackerTable() {
  const clients = useAppStore((s) => s.clients)
  const websites = useAppStore((s) => s.websites)
  const migrations = useAppStore((s) => s.migrations)
  const load = useSimulatedLoad(480)

  // Master Tracker is a read-only view — the same convention Client Tracker
  // uses. All records are created/edited from the Admin Panel.
  const denyReason = 'Manage clients from the Admin Panel'
  const canEdit = false
  const canCreate = false

  const [search, setSearch] = useState('')
  const query = useDebounce(search, 200)
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const [priorityFilter, setPriorityFilter] = useState<string[]>([])
  const [technologyFilter, setTechnologyFilter] = useState<string[]>([])
  const [stageFilter, setStageFilter] = useState<string[]>([])
  const [viewing, setViewing] = useState<Client | null>(null)

  const clientRows = useMemo(() => buildClientRows(clients, websites, migrations), [clients, websites, migrations])
  const viewingRow = useMemo(() => (viewing ? clientRows.find((r) => r.client.id === viewing.id) : undefined), [viewing, clientRows])

  const kpis = useMemo(() => {
    const total = clients.length
    const completed = clients.filter((c) => c.status === 'completed').length
    const inProgress = clients.filter((c) => c.status === 'in-progress').length
    const highPriority = clients.filter((c) => c.priority === 'high').length
    const migrating = clientRows.filter((r) => r.migration && r.migration.stage !== 'completed').length
    return [total, completed, inProgress, highPriority, migrating]
  }, [clients, clientRows])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return clientRows.filter((row) => {
      const { client, site } = row
      if (statusFilter.length > 0 && !statusFilter.includes(client.status)) return false
      if (priorityFilter.length > 0 && !priorityFilter.includes(client.priority)) return false
      if (stageFilter.length > 0 && !stageFilter.includes(client.stage)) return false
      if (technologyFilter.length > 0 && (!site || !technologyFilter.includes(site.framework))) return false
      if (!q) return true
      return [client.name, client.location, site?.name, site?.domain].some((v) => v?.toLowerCase().includes(q))
    })
  }, [clientRows, query, statusFilter, priorityFilter, stageFilter, technologyFilter])

  const filteredClients = useMemo(() => filtered.map((r) => r.client), [filtered])

  const columns = useMemo<ColumnDef<Client>[]>(
    () => [
      {
        accessorKey: 'name',
        meta: { label: 'Client' },
        header: ({ column }) => <SortableHeader column={column}>Client</SortableHeader>,
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-ink">{row.original.name}</p>
            <p className="truncate text-xs text-sub">{row.original.location}</p>
          </div>
        ),
      },
      {
        id: 'liveLink',
        meta: { label: 'Live Link' },
        enableSorting: false,
        accessorFn: (c) => primaryWebsite(websites, c.id)?.liveUrl ?? '',
        header: () => 'Live Link',
        cell: ({ row }) => {
          const site = primaryWebsite(websites, row.original.id)
          if (!site?.liveUrl) return <span className="text-sm text-faint">—</span>
          return (
            <a
              href={site.liveUrl}
              target="_blank"
              rel="noreferrer"
              className="truncate text-xs font-medium text-primary-600 underline-offset-2 hover:underline dark:text-primary-400"
            >
              {site.domain || site.liveUrl}
            </a>
          )
        },
      },
      {
        id: 'technology',
        meta: { label: 'Technology' },
        accessorFn: (c) => primaryWebsite(websites, c.id)?.framework ?? '',
        header: ({ column }) => <SortableHeader column={column}>Technology</SortableHeader>,
        cell: ({ row }) => {
          const site = primaryWebsite(websites, row.original.id)
          return site ? <StatusBadge status={site.framework} /> : <span className="text-sm text-faint">—</span>
        },
      },
      {
        id: 'environment',
        meta: { label: 'Environment' },
        accessorFn: (c) => primaryWebsite(websites, c.id)?.environment ?? '',
        header: ({ column }) => <SortableHeader column={column}>Environment</SortableHeader>,
        cell: ({ row }) => {
          const site = primaryWebsite(websites, row.original.id)
          if (!site) return <span className="text-sm text-faint">—</span>
          return <Badge tone={ENV_TONE[site.environment]}>{ENVIRONMENT_LABELS[site.environment]}</Badge>
        },
      },
      {
        id: 'ordering',
        meta: { label: 'Ordering' },
        accessorFn: (c) => primaryWebsite(websites, c.id)?.orderingStatus ?? '',
        header: ({ column }) => <SortableHeader column={column}>Ordering</SortableHeader>,
        cell: ({ row }) => {
          const site = primaryWebsite(websites, row.original.id)
          return site ? <StatusBadge status={site.orderingStatus} /> : <span className="text-sm text-faint">—</span>
        },
      },
      {
        id: 'stage',
        meta: { label: 'Stage' },
        accessorFn: (c) => c.stage,
        header: ({ column }) => <SortableHeader column={column}>Stage</SortableHeader>,
        cell: ({ row }) => <Badge tone="slate">{CLIENT_STAGE_LABELS[row.original.stage]}</Badge>,
      },
      {
        accessorKey: 'status',
        meta: { label: 'Status' },
        header: ({ column }) => <SortableHeader column={column}>Status</SortableHeader>,
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        accessorKey: 'priority',
        meta: { label: 'Priority' },
        header: ({ column }) => <SortableHeader column={column}>Priority</SortableHeader>,
        cell: ({ row }) => <PriorityBadge priority={row.original.priority} />,
      },
      // ---- Secondary columns: hidden by default, available from Columns menu ----
      {
        id: 'qaSignoff',
        meta: { label: 'QA Sign-off' },
        accessorFn: (c) => primaryWebsite(websites, c.id)?.qaSignoff ?? '',
        header: ({ column }) => <SortableHeader column={column}>QA Sign-off</SortableHeader>,
        cell: ({ row }) => {
          const site = primaryWebsite(websites, row.original.id)
          if (!site) return <span className="text-sm text-faint">—</span>
          return <Badge tone={QA_TONE[site.qaSignoff]}>{QA_SIGNOFF_LABELS[site.qaSignoff]}</Badge>
        },
      },
      {
        id: 'deployedDate',
        meta: { label: 'Deployed Date' },
        accessorFn: (c) => primaryWebsite(websites, c.id)?.deployedDate ?? '',
        header: ({ column }) => <SortableHeader column={column}>Deployed Date</SortableHeader>,
        cell: ({ row }) => {
          const site = primaryWebsite(websites, row.original.id)
          return <span className="whitespace-nowrap text-xs text-sub">{site?.deployedDate ? fmtDate(site.deployedDate) : '—'}</span>
        },
      },
      {
        id: 'figmaLink',
        meta: { label: 'Figma Design' },
        enableSorting: false,
        accessorFn: (c) => primaryWebsite(websites, c.id)?.figmaLink ?? '',
        header: () => 'Figma Design',
        cell: ({ row }) => {
          const site = primaryWebsite(websites, row.original.id)
          if (!site?.figmaLink) return <span className="text-sm text-faint">—</span>
          return (
            <a href={site.figmaLink} target="_blank" rel="noreferrer" className="text-xs font-medium text-primary-600 underline-offset-2 hover:underline dark:text-primary-400">
              View design
            </a>
          )
        },
      },
      {
        id: 'repo',
        meta: { label: 'Repository' },
        enableSorting: false,
        accessorFn: (c) => primaryWebsite(websites, c.id)?.repoName ?? '',
        header: () => 'Repository',
        cell: ({ row }) => {
          const site = primaryWebsite(websites, row.original.id)
          if (!site?.repoName) return <span className="text-sm text-faint">—</span>
          return (
            <div className="min-w-0 text-xs">
              <p className="truncate font-medium text-ink">{site.repoName}</p>
              <p className="truncate text-faint">
                {site.devLatestBranch || '—'} → {site.releaseBranch || '—'}
              </p>
            </div>
          )
        },
      },
      {
        id: 'migration',
        meta: { label: 'Migration' },
        accessorFn: (c) => {
          const site = primaryWebsite(websites, c.id)
          const migration = site ? migrationForWebsite(migrations, site.id) : undefined
          return migration?.stage ?? (site?.framework === 'nextjs' ? 'completed' : '')
        },
        header: ({ column }) => <SortableHeader column={column}>Migration</SortableHeader>,
        cell: ({ row }) => {
          const site = primaryWebsite(websites, row.original.id)
          const migration = site ? migrationForWebsite(migrations, site.id) : undefined
          if (migration) return <StatusBadge status={migration.stage} />
          if (site?.framework === 'nextjs') return <StatusBadge status="completed" label="Completed" />
          return <Badge tone="slate">Not Started</Badge>
        },
      },
      {
        id: 'features',
        meta: { label: 'Features' },
        enableSorting: false,
        header: () => 'Features',
        cell: ({ row }) => {
          const enabled = Object.values(row.original.capabilities).filter((v) => v === 'enabled').length
          return <span className="text-xs text-sub">{enabled} enabled</span>
        },
      },
      {
        id: 'actions',
        size: 88,
        enableSorting: false,
        enableHiding: false,
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            <Button size="xs" variant="outline" onClick={() => setViewing(row.original)}>
              View
            </Button>
            <DropdownMenu
              trigger={(props) => (
                <button
                  type="button"
                  {...props}
                  aria-label="More actions"
                  className="focus-ring flex h-7 w-7 items-center justify-center rounded-md text-sub transition-colors hover:bg-elev hover:text-ink"
                >
                  <MoreHorizontal className="h-4 w-4" aria-hidden />
                </button>
              )}
              groups={[
                {
                  items: [
                    { key: 'view', label: 'View Details', onSelect: () => setViewing(row.original) },
                    { key: 'edit', label: 'Edit Client', disabled: true, onSelect: () => {} },
                    { key: 'delete', label: 'Delete', danger: true, disabled: true, onSelect: () => {} },
                  ],
                },
              ]}
            />
          </div>
        ),
      },
    ],
    [websites, migrations],
  )

  const { table } = useAdminTable({
    data: filteredClients,
    columns,
    getRowId: (c) => c.id,
    initialSorting: [{ id: 'name', desc: false }],
    enableSelection: false,
    initialColumnVisibility: { qaSignoff: false, deployedDate: false, figmaLink: false, repo: false, migration: false, features: false },
  })

  const hasFilters = search !== '' || statusFilter.length > 0 || priorityFilter.length > 0 || stageFilter.length > 0 || technologyFilter.length > 0
  const clearFilters = () => {
    setSearch('')
    setStatusFilter([])
    setPriorityFilter([])
    setStageFilter([])
    setTechnologyFilter([])
  }

  if (load.loading) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-[74px] animate-pulse rounded-2xl bg-elev" />
          ))}
        </div>
        <div className="app-card overflow-hidden">
          <SkeletonTable rows={8} cols={9} />
        </div>
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
    <div className="space-y-5">
      {/* KPI summary */}
      <StatRail items={KPI_DEFS.map((def, i) => ({ ...def, value: kpis[i] }))} />

      {/* Toolbar */}
      <div className="app-card overflow-hidden">
        <AdminToolbar>
          <SearchInput value={search} onChange={setSearch} placeholder="Search clients…" className="w-64" aria-label="Search clients" />
          <FilterDropdown label="Status" options={statusOptions} selected={statusFilter} onChange={setStatusFilter} />
          <FilterDropdown label="Priority" options={priorityOptions} selected={priorityFilter} onChange={setPriorityFilter} />
          <FilterDropdown label="Technology" options={technologyOptions} selected={technologyFilter} onChange={setTechnologyFilter} />
          <FilterDropdown label="Stage" options={stageOptions} selected={stageFilter} onChange={setStageFilter} />
          <div className="ml-auto flex items-center gap-2">
            <ColumnToggleMenu table={table} />
            <DisabledHint when={!canCreate} reason={denyReason}>
              <Button size="sm" variant="outline" disabled={!canCreate}>
                <Upload className="h-3.5 w-3.5" aria-hidden />
                Import
              </Button>
            </DisabledHint>
            <DisabledHint when={!canCreate} reason={denyReason}>
              <Button size="sm" variant="primary" disabled={!canCreate}>
                + Add Client
              </Button>
            </DisabledHint>
          </div>
        </AdminToolbar>

        {/* Desktop / tablet table — no horizontal scroll under normal widths */}
        <div className="hidden md:block">
          <AdminDataTable
            table={table}
            empty={
              <EmptyState
                icon={Users}
                title={hasFilters ? 'No clients match your filters' : 'No clients yet'}
                description={hasFilters ? 'Try adjusting the search or clearing the active filters.' : 'Clients added from the Admin Panel will appear here.'}
                actionLabel={hasFilters ? 'Clear filters' : undefined}
                onAction={hasFilters ? clearFilters : undefined}
              />
            }
          />
        </div>

        {/* Mobile — compact client cards instead of a squeezed table */}
        <div className="space-y-2.5 p-3 md:hidden">
          {filtered.length === 0 ? (
            <EmptyState
              icon={Users}
              title={hasFilters ? 'No clients match your filters' : 'No clients yet'}
              description={hasFilters ? 'Try adjusting the search or clearing the active filters.' : 'Clients added from the Admin Panel will appear here.'}
              actionLabel={hasFilters ? 'Clear filters' : undefined}
              onAction={hasFilters ? clearFilters : undefined}
            />
          ) : (
            filtered.map((row) => (
              <ClientCard key={row.client.id} client={row.client} site={row.site} onView={() => setViewing(row.client)} />
            ))
          )}
        </div>
      </div>

      <MasterTrackerDrawer
        open={viewing !== null}
        onClose={() => setViewing(null)}
        client={viewing}
        site={viewingRow?.site}
        migration={viewingRow?.migration}
        canEdit={canEdit}
        denyReason={denyReason}
        onEdit={() => {}}
      />
    </div>
  )
}
