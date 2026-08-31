import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { ColumnDef } from '@tanstack/react-table'
import { ChevronDown, Eye, Pencil, Plus, Trash2, Upload, Users } from 'lucide-react'
import type { CapabilityState, Client, ClientStatus, Environment, OrderingStatus, Priority, QaSignoff } from '@/types'
import {
  CAPABILITY_LABELS,
  CAPABILITY_STATE_LABELS,
  CAPABILITY_STATES_ORDERED,
  CLIENT_STAGE_LABELS,
  CLIENT_STATUS_LABELS,
  ENVIRONMENT_LABELS,
  ENVIRONMENTS_ORDERED,
  FRAMEWORK_LABELS,
  MIGRATION_STAGE_LABELS,
  ORDERING_STATUS_LABELS,
  PRIORITY_LABELS,
  QA_SIGNOFF_LABELS,
  QA_SIGNOFF_ORDERED,
  quarterOptions,
} from '@/types'
import { useAppStore } from '@/store/appStore'
import { toast } from '@/store/toastStore'
import { useSimulatedLoad } from '@/hooks/useSimulatedLoad'
import { useDebounce } from '@/hooks/useDebounce'
import { migrationForWebsite, primaryWebsite } from '@/utils/selectors'
import { fmtDate } from '@/utils/date'
import { cn } from '@/utils/cn'
import { Badge, badgeDotClasses } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { Drawer } from '@/components/common/Drawer'
import { DropdownMenu, type MenuItem } from '@/components/common/DropdownMenu'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { FormField } from '@/components/common/FormField'
import { Input, Textarea } from '@/components/common/Input'
import { PriorityBadge } from '@/components/common/PriorityBadge'
import { SearchInput } from '@/components/common/SearchInput'
import { Select } from '@/components/common/Select'
import { SkeletonTable } from '@/components/common/Skeleton'
import { StatusBadge } from '@/components/common/StatusBadge'
import { ColumnToggleMenu, SortableHeader } from '@/components/common/table'
import { Tooltip } from '@/components/common/Tooltip'
import { ClientExpansionPanel } from '@/components/clients/ClientExpansionPanel'
import { buildClientRows } from '@/components/clients/clientRows'
import { ImportClientsModal } from './ImportClientsModal'
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

const ENV_TONE = { Production: 'emerald', Staging: 'amber', QA: 'sky' } as const
const QA_TONE = { 'signed-off': 'emerald', pending: 'amber', 'not-required': 'slate' } as const
const CAPABILITY_TONE: Record<CapabilityState, 'emerald' | 'amber' | 'slate'> = {
  enabled: 'emerald',
  'in-progress': 'amber',
  unavailable: 'slate',
}
const STAGE_TONE = {
  onboarded: 'slate',
  requirements: 'sky',
  ordering: 'amber',
  migration: 'violet',
  qa: 'indigo',
  completed: 'emerald',
} as const

const STATUS_VALUES = ['active', 'in-progress', 'completed', 'blocked'] as const
const STAGE_VALUES = ['onboarded', 'requirements', 'ordering', 'migration', 'qa', 'completed'] as const
const PRIORITY_VALUES = ['high', 'medium', 'low'] as const
const ORDERING_VALUES = ['active', 'in-progress', 'no-need', 'not-started'] as const
const FRAMEWORK_VALUES = ['react', 'nextjs', 'html', 'shopify', 'wordpress', 'wix', 'unknown'] as const
/** Migration "Target stack" only ever moves within the React → Next.js pipeline. */
const MIGRATION_TARGET_VALUES = ['react', 'nextjs'] as const

const DOMAIN_RE = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i

const statusOptions = STATUS_VALUES.map((v) => ({ value: v, label: CLIENT_STATUS_LABELS[v] }))
const priorityOptions = PRIORITY_VALUES.map((v) => ({ value: v, label: PRIORITY_LABELS[v] }))
const orderingOptions = ORDERING_VALUES.map((v) => ({ value: v, label: ORDERING_STATUS_LABELS[v] }))
const environmentOptions = ENVIRONMENTS_ORDERED.map((v) => ({ value: v, label: ENVIRONMENT_LABELS[v] }))
const qaSignoffOptions = QA_SIGNOFF_ORDERED.map((v) => ({ value: v, label: QA_SIGNOFF_LABELS[v] }))

/* ------------------------------------------------------------------ */
/* Clients manager                                                     */
/* ------------------------------------------------------------------ */

export function ClientsManager({
  initialSearch = '',
  readOnly = false,
}: {
  initialSearch?: string
  /** View-only mode for the standalone Client Tracker page — editing only happens from the Admin Panel. */
  readOnly?: boolean
}) {
  const clients = useAppStore((s) => s.clients)
  const websites = useAppStore((s) => s.websites)
  const migrations = useAppStore((s) => s.migrations)
  const members = useAppStore((s) => s.teamMembers)
  const updateClient = useAppStore((s) => s.updateClient)
  const updateWebsite = useAppStore((s) => s.updateWebsite)
  const deleteClients = useAppStore((s) => s.deleteClients)
  const bulkUpdateClients = useAppStore((s) => s.bulkUpdateClients)
  const { can, denyReason: permsDenyReason } = usePerms()
  const load = useSimulatedLoad(480)

  const denyReason = readOnly ? 'Manage clients from the Admin Panel' : permsDenyReason
  const canCreate = !readOnly && can('create-client')
  const canEdit = !readOnly && can('edit-client')
  const canDelete = !readOnly && can('delete-client')

  const [search, setSearch] = useState(initialSearch)
  const query = useDebounce(search, 200)
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const [priorityFilter, setPriorityFilter] = useState<string[]>([])
  const [adding, setAdding] = useState(false)
  const [importing, setImporting] = useState(false)
  const [editing, setEditing] = useState<Client | null>(null)
  const [viewing, setViewing] = useState<Client | null>(null)
  const [deleting, setDeleting] = useState<Client | null>(null)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)

  const clientRows = useMemo(
    () => buildClientRows(clients, websites, migrations),
    [clients, websites, migrations],
  )
  const viewingRow = useMemo(
    () => (viewing ? clientRows.find((r) => r.client.id === viewing.id) : undefined),
    [viewing, clientRows],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return clients.filter((c) => {
      if (statusFilter.length > 0 && !statusFilter.includes(c.status)) return false
      if (priorityFilter.length > 0 && !priorityFilter.includes(c.priority)) return false
      if (!q) return true
      const site = primaryWebsite(websites, c.id)
      return [c.name, c.location, site?.name, site?.domain].some((v) => v?.toLowerCase().includes(q))
    })
  }, [clients, websites, query, statusFilter, priorityFilter])

  const columns = useMemo<ColumnDef<Client>[]>(
    () => [
      ...(readOnly ? [] : [selectionColumn<Client>()]),
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
              className="text-xs font-medium text-primary-600 underline-offset-2 hover:underline dark:text-primary-400"
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
          return (
            <InlineSelectCell
              value={site.environment}
              options={environmentOptions}
              ariaLabel={`Environment for ${row.original.name}`}
              display={<Badge tone={ENV_TONE[site.environment]}>{ENVIRONMENT_LABELS[site.environment]}</Badge>}
              disabled={!canEdit}
              disabledReason={denyReason}
              onSave={(v) => updateWebsite(site.id, { environment: v as Environment })}
            />
          )
        },
      },
      {
        id: 'ordering',
        meta: { label: 'Embedded Ordering' },
        accessorFn: (c) => primaryWebsite(websites, c.id)?.orderingStatus ?? '',
        header: ({ column }) => <SortableHeader column={column}>Embedded Ordering</SortableHeader>,
        cell: ({ row }) => {
          const site = primaryWebsite(websites, row.original.id)
          if (!site) return <span className="text-sm text-faint">—</span>
          return (
            <InlineSelectCell
              value={site.orderingStatus}
              options={orderingOptions}
              ariaLabel={`Embedded ordering status for ${row.original.name}`}
              display={<StatusBadge status={site.orderingStatus} />}
              disabled={!canEdit}
              disabledReason={denyReason}
              onSave={(v) => updateWebsite(site.id, { orderingStatus: v as OrderingStatus })}
            />
          )
        },
      },
      {
        id: 'qa',
        meta: { label: 'QA Sign-off' },
        accessorFn: (c) => primaryWebsite(websites, c.id)?.qaSignoff ?? '',
        header: ({ column }) => <SortableHeader column={column}>QA Sign-off</SortableHeader>,
        cell: ({ row }) => {
          const site = primaryWebsite(websites, row.original.id)
          if (!site) return <span className="text-sm text-faint">—</span>
          return (
            <InlineSelectCell
              value={site.qaSignoff}
              options={qaSignoffOptions}
              ariaLabel={`QA sign-off for ${row.original.name}`}
              display={<Badge tone={QA_TONE[site.qaSignoff]}>{QA_SIGNOFF_LABELS[site.qaSignoff]}</Badge>}
              disabled={!canEdit}
              disabledReason={denyReason}
              onSave={(v) => updateWebsite(site.id, { qaSignoff: v as QaSignoff })}
            />
          )
        },
      },
      {
        id: 'deployedDate',
        meta: { label: 'Deployed Date' },
        accessorFn: (c) => primaryWebsite(websites, c.id)?.deployedDate ?? '',
        header: ({ column }) => <SortableHeader column={column}>Deployed Date</SortableHeader>,
        cell: ({ row }) => {
          const site = primaryWebsite(websites, row.original.id)
          return (
            <span className="whitespace-nowrap text-xs text-sub">
              {site?.deployedDate ? fmtDate(site.deployedDate) : '—'}
            </span>
          )
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
            <a
              href={site.figmaLink}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-medium text-primary-600 underline-offset-2 hover:underline dark:text-primary-400"
            >
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
        id: 'stage',
        meta: { label: 'Stage' },
        accessorFn: (c) => c.stage,
        header: ({ column }) => <SortableHeader column={column}>Stage</SortableHeader>,
        cell: ({ row }) => <Badge tone={STAGE_TONE[row.original.stage]}>{CLIENT_STAGE_LABELS[row.original.stage]}</Badge>,
      },
      {
        accessorKey: 'status',
        meta: { label: 'Status' },
        header: ({ column }) => <SortableHeader column={column}>Status</SortableHeader>,
        cell: ({ row }) => (
          <InlineSelectCell
            value={row.original.status}
            options={statusOptions}
            ariaLabel={`Status for ${row.original.name}`}
            display={<StatusBadge status={row.original.status} />}
            disabled={!canEdit}
            disabledReason={denyReason}
            onSave={(v) => updateClient(row.original.id, { status: v as ClientStatus })}
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
            ariaLabel={`Priority for ${row.original.name}`}
            display={<PriorityBadge priority={row.original.priority} />}
            disabled={!canEdit}
            disabledReason={denyReason}
            onSave={(v) => updateClient(row.original.id, { priority: v as Priority })}
          />
        ),
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
          const caps = row.original.capabilities
          return (
            <div className="flex items-center gap-1">
              {(Object.keys(CAPABILITY_LABELS) as Array<keyof typeof caps>).map((key) => (
                <Tooltip key={key} content={`${CAPABILITY_LABELS[key]}: ${CAPABILITY_STATE_LABELS[caps[key]]}`}>
                  <span className={cn('h-2 w-2 rounded-full', badgeDotClasses[CAPABILITY_TONE[caps[key]]])} aria-hidden />
                </Tooltip>
              ))}
              <span className="sr-only">
                {(Object.keys(CAPABILITY_LABELS) as Array<keyof typeof caps>)
                  .map((key) => `${CAPABILITY_LABELS[key]}: ${CAPABILITY_STATE_LABELS[caps[key]]}`)
                  .join(', ')}
              </span>
            </div>
          )
        },
      },
      {
        id: 'actions',
        size: 104,
        enableSorting: false,
        enableHiding: false,
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-0.5">
            <RowActionButton
              label="View details"
              icon={Eye}
              onClick={() => setViewing(row.original)}
            />
            <RowActionButton
              label="Edit client"
              icon={Pencil}
              onClick={() => setEditing(row.original)}
              disabled={!canEdit}
              disabledReason={denyReason}
            />
            <RowActionButton
              label="Delete client"
              icon={Trash2}
              danger
              onClick={() => setDeleting(row.original)}
              disabled={!canDelete}
              disabledReason={denyReason}
            />
          </div>
        ),
      },
    ],
    [websites, migrations, canEdit, canDelete, denyReason, updateClient, updateWebsite, readOnly],
  )

  const { table, selectedIds, clearSelection } = useAdminTable({
    data: filtered,
    columns,
    getRowId: (c) => c.id,
    initialSorting: [{ id: 'name', desc: false }],
  })

  const hasFilters = search !== '' || statusFilter.length > 0 || priorityFilter.length > 0
  const clearFilters = () => {
    setSearch('')
    setStatusFilter([])
    setPriorityFilter([])
  }

  const bulkStatusItems: MenuItem[] = STATUS_VALUES.map((v) => ({
    key: v,
    label: CLIENT_STATUS_LABELS[v],
    onSelect: () => {
      bulkUpdateClients(selectedIds, { status: v })
      toast.success('Clients updated', `${selectedIds.length} clients set to ${CLIENT_STATUS_LABELS[v]}.`)
      clearSelection()
    },
  }))
  const bulkPriorityItems: MenuItem[] = PRIORITY_VALUES.map((v) => ({
    key: v,
    label: PRIORITY_LABELS[v],
    onSelect: () => {
      bulkUpdateClients(selectedIds, { priority: v })
      toast.success('Clients updated', `${selectedIds.length} clients set to ${PRIORITY_LABELS[v]} priority.`)
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
          placeholder="Search clients…"
          className="w-64"
          aria-label="Search clients"
        />
        <FilterDropdown label="Status" options={statusOptions} selected={statusFilter} onChange={setStatusFilter} />
        <FilterDropdown label="Priority" options={priorityOptions} selected={priorityFilter} onChange={setPriorityFilter} />
        <div className="ml-auto flex items-center gap-2">
          <ColumnToggleMenu table={table} />
          <DisabledHint when={!canCreate} reason={denyReason}>
            <Button size="sm" variant="outline" disabled={!canCreate} onClick={() => setImporting(true)}>
              <Upload className="h-3.5 w-3.5" aria-hidden />
              Import
            </Button>
          </DisabledHint>
          <DisabledHint when={!canCreate} reason={denyReason}>
            <Button size="sm" variant="primary" disabled={!canCreate} onClick={() => setAdding(true)}>
              <Plus className="h-3.5 w-3.5" aria-hidden />
              Add Client
            </Button>
          </DisabledHint>
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
              groups={[{ items: bulkStatusItems }]}
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
          </>
        ) : (
          <DisabledHint when reason={denyReason}>
            <Button size="xs" variant="outline" disabled>
              Bulk edit
            </Button>
          </DisabledHint>
        )}
        <DisabledHint when={!canDelete} reason={denyReason}>
          <Button size="xs" variant="danger" disabled={!canDelete} onClick={() => setBulkDeleteOpen(true)}>
            <Trash2 className="h-3 w-3" aria-hidden />
            Delete
          </Button>
        </DisabledHint>
      </BulkBar>

      <AdminDataTable
        table={table}
        stickyHeader
        empty={
          <EmptyState
            icon={Users}
            title={hasFilters ? 'No clients match your filters' : 'No clients yet'}
            description={
              hasFilters
                ? 'Try adjusting the search or clearing the active filters.'
                : 'Add your first client to start tracking onboarding.'
            }
            actionLabel={hasFilters ? 'Clear filters' : canCreate ? 'Add Client' : undefined}
            onAction={hasFilters ? clearFilters : canCreate ? () => setAdding(true) : undefined}
          />
        }
      />

      {(adding || editing) && (
        <ClientFormDrawer
          client={editing}
          onClose={() => {
            setAdding(false)
            setEditing(null)
          }}
        />
      )}
      {importing && <ImportClientsModal onClose={() => setImporting(false)} />}

      <Drawer
        open={viewing !== null}
        onClose={() => setViewing(null)}
        title={viewing?.name ?? 'Client details'}
        description={viewing?.location}
        size="xl"
      >
        {viewingRow && (
          <ClientExpansionPanel
            row={viewingRow}
            members={members}
            className="grid-cols-1 gap-x-6 border-0 bg-transparent px-0 py-0 md:grid-cols-2 xl:grid-cols-2"
          />
        )}
      </Drawer>

      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        destructive
        title="Delete client?"
        confirmLabel="Delete client"
        description={
          deleting
            ? `"${deleting.name}" and all of its websites, migrations and weekly priorities will be permanently removed.`
            : undefined
        }
        onConfirm={() => {
          if (!deleting) return
          deleteClients([deleting.id])
          clearSelection()
          toast.success('Client deleted', `${deleting.name} was removed.`)
        }}
      />
      <ConfirmDialog
        open={bulkDeleteOpen}
        onClose={() => setBulkDeleteOpen(false)}
        destructive
        title={`Delete ${selectedIds.length} clients?`}
        confirmLabel="Delete clients"
        description="The selected clients and all of their websites, migrations and weekly priorities will be permanently removed."
        onConfirm={() => {
          const n = selectedIds.length
          deleteClients(selectedIds)
          clearSelection()
          toast.success('Clients deleted', `${n} clients were removed.`)
        }}
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Unified onboarding form — one form for add AND edit that captures   */
/* client info, technology/environment, ordering & QA, migration and   */
/* feature enablement in a single save, populating every admin tab.    */
/* ------------------------------------------------------------------ */

const MIGRATION_STAGE_VALUES = ['planning', 'in-progress', 'testing', 'completed'] as const
const QA_VALUES = ['signed-off', 'pending', 'not-required'] as const
const ENV_VALUES = ['Production', 'Staging', 'QA'] as const
const CAPABILITY_STATE_VALUES = ['enabled', 'in-progress', 'unavailable'] as const

function clientFormSchema(websites: { domain: string }[], currentDomain: string | undefined) {
  const domains = new Set(websites.map((w) => w.domain.toLowerCase()).filter((d) => d !== currentDomain?.toLowerCase()))
  return z.object({
    // Client information
    name: z.string().min(2, 'Name must be at least 2 characters'),
    phone: z.string().optional(),
    location: z.string().min(2, 'Location is required'),
    notes: z.string(),
    status: z.enum(STATUS_VALUES),
    stage: z.enum(STAGE_VALUES),
    priority: z.enum(PRIORITY_VALUES),
    // Site & technology (optional — a client may have no primary website yet)
    domain: z
      .string()
      .regex(DOMAIN_RE, 'Enter a valid domain, e.g. restaurant.com')
      .refine((d) => !domains.has(d.toLowerCase()), 'This domain is already registered')
      .optional()
      .or(z.literal('')),
    liveUrl: z.string().optional().or(z.literal('')),
    framework: z.enum(FRAMEWORK_VALUES),
    environment: z.enum(ENV_VALUES),
    orderingStatus: z.enum(ORDERING_VALUES),
    orderingStage: z.string().optional(),
    qaSignoff: z.enum(QA_VALUES),
    figmaLink: z.string().optional().or(z.literal('')),
    deployedDate: z.string().optional().or(z.literal('')),
    repoName: z.string().optional().or(z.literal('')),
    devLatestBranch: z.string().optional().or(z.literal('')),
    releaseBranch: z.string().optional().or(z.literal('')),
    // Migration (optional — only tracked once a website exists)
    migrationStage: z.union([z.enum(MIGRATION_STAGE_VALUES), z.literal('')]),
    migrationQuarter: z.string().optional(),
    targetStack: z.enum(MIGRATION_TARGET_VALUES),
    // Feature enablement
    ordering: z.enum(CAPABILITY_STATE_VALUES),
    offers: z.enum(CAPABILITY_STATE_VALUES),
    loyalty: z.enum(CAPABILITY_STATE_VALUES),
    reservation: z.enum(CAPABILITY_STATE_VALUES),
    eventOrdering: z.enum(CAPABILITY_STATE_VALUES),
    inFramework: z.enum(CAPABILITY_STATE_VALUES),
  })
}

type ClientFormValuesShape = z.infer<ReturnType<typeof clientFormSchema>>

function DrawerSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-line pt-4 first:border-0 first:pt-0">
      <h3 className="text-2xs font-semibold uppercase tracking-wider text-faint">{title}</h3>
      <div className="mt-3 grid grid-cols-2 gap-3">{children}</div>
    </section>
  )
}

/**
 * Single onboarding form used for both creating and editing a client. Every
 * field the Client Tracker, Features and Migration tabs display lives here —
 * those tabs are read-only views of what gets saved from this drawer.
 */
function ClientFormDrawer({ client, onClose }: { client: Client | null; onClose: () => void }) {
  const isEdit = client !== null
  const websites = useAppStore((s) => s.websites)
  const migrations = useAppStore((s) => s.migrations)
  const createClient = useAppStore((s) => s.createClient)
  const updateClient = useAppStore((s) => s.updateClient)
  const updateWebsite = useAppStore((s) => s.updateWebsite)
  const addWebsite = useAppStore((s) => s.addWebsite)
  const updateMigration = useAppStore((s) => s.updateMigration)
  const addMigration = useAppStore((s) => s.addMigration)
  const deleteMigrations = useAppStore((s) => s.deleteMigrations)

  const site = useMemo(() => (client ? primaryWebsite(websites, client.id) : undefined), [websites, client])
  const migration = useMemo(() => (site ? migrationForWebsite(migrations, site.id) : undefined), [migrations, site])

  const schema = useMemo(() => clientFormSchema(websites, site?.domain), [websites, site?.domain])

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ClientFormValuesShape>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: client?.name ?? '',
      phone: client?.phone ?? '',
      location: client?.location ?? '',
      notes: client?.notes ?? '',
      status: client?.status ?? 'in-progress',
      stage: client?.stage ?? 'onboarded',
      priority: client?.priority ?? 'medium',
      domain: site?.domain ?? '',
      liveUrl: site?.liveUrl ?? '',
      framework: site?.framework ?? 'react',
      environment: site?.environment ?? 'Staging',
      orderingStatus: site?.orderingStatus ?? 'not-started',
      orderingStage: site?.orderingStage ?? '',
      qaSignoff: site?.qaSignoff ?? 'pending',
      figmaLink: site?.figmaLink ?? '',
      deployedDate: site?.deployedDate ?? '',
      repoName: site?.repoName ?? '',
      devLatestBranch: site?.devLatestBranch ?? '',
      releaseBranch: site?.releaseBranch ?? '',
      migrationStage: migration?.stage ?? '',
      migrationQuarter: migration?.quarter ?? '',
      targetStack: migration?.targetStack === 'react' ? 'react' : 'nextjs',
      ordering: client?.capabilities.ordering ?? 'unavailable',
      offers: client?.capabilities.offers ?? 'unavailable',
      loyalty: client?.capabilities.loyalty ?? 'unavailable',
      reservation: client?.capabilities.reservation ?? 'unavailable',
      eventOrdering: client?.capabilities.eventOrdering ?? 'unavailable',
      inFramework: client?.capabilities.inFramework ?? 'unavailable',
    },
  })

  const domainValue = watch('domain')
  const hasSite = !!site || !!domainValue?.trim()

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (isEdit && client) {
        await updateClient(client.id, {
          name: values.name,
          phone: values.phone ?? '',
          location: values.location,
          notes: values.notes,
          status: values.status,
          stage: values.stage,
          priority: values.priority,
          capabilities: {
            ordering: values.ordering,
            offers: values.offers,
            loyalty: values.loyalty,
            reservation: values.reservation,
            eventOrdering: values.eventOrdering,
            inFramework: values.inFramework,
          },
        })

        let siteId = site?.id
        if (site) {
          await updateWebsite(site.id, {
            domain: values.domain || site.domain,
            liveUrl: values.liveUrl || `https://${values.domain || site.domain}`,
            framework: values.framework,
            environment: values.environment,
            orderingStatus: values.orderingStatus,
            orderingStage: values.orderingStage || site.orderingStage,
            qaSignoff: values.qaSignoff,
            figmaLink: values.figmaLink || site.figmaLink,
            deployedDate: values.deployedDate || site.deployedDate,
            repoName: values.repoName || site.repoName,
            devLatestBranch: values.devLatestBranch || site.devLatestBranch,
            releaseBranch: values.releaseBranch || site.releaseBranch,
          })
        } else if (values.domain) {
          siteId = await addWebsite({
            name: values.name,
            domain: values.domain,
            clientId: client.id,
            framework: values.framework,
            orderingStatus: values.orderingStatus,
            orderingStage: values.orderingStage || 'Not scheduled',
            orderingStartDate: null,
            orderingCompletedDate: null,
            environment: values.environment,
            qaSignoff: values.qaSignoff,
            liveUrl: values.liveUrl || `https://${values.domain}`,
            figmaLink: values.figmaLink || '',
            deployedDate: values.deployedDate || null,
            repoName: values.repoName || '',
            devLatestBranch: values.devLatestBranch || '',
            releaseBranch: values.releaseBranch || '',
          })
        }

        if (migration) {
          if (!values.migrationStage) {
            await deleteMigrations([migration.id])
          } else {
            const patch: Partial<typeof migration> = {
              quarter: values.migrationQuarter || migration.quarter,
              targetStack: values.targetStack,
            }
            if (values.migrationStage !== migration.stage) patch.stage = values.migrationStage
            await updateMigration(migration.id, patch)
          }
        } else if (siteId && values.migrationStage) {
          await addMigration({
            websiteId: siteId,
            developerId: null,
            stage: values.migrationStage,
            progress: values.migrationStage === 'completed' ? 100 : 0,
            priority: values.priority,
            dueDate: new Date().toISOString().slice(0, 10),
            quarter: values.migrationQuarter || quarterOptions()[0],
            targetStack: values.targetStack,
          })
        }

        toast.success('Client updated', `${values.name} was saved.`)
      } else {
        await createClient({
          name: values.name,
          phone: values.phone,
          location: values.location,
          notes: values.notes,
          status: values.status,
          stage: values.stage,
          priority: values.priority,
          domain: values.domain,
          liveUrl: values.liveUrl,
          framework: values.framework,
          environment: values.environment,
          orderingStatus: values.orderingStatus,
          orderingStage: values.orderingStage,
          qaSignoff: values.qaSignoff,
          figmaLink: values.figmaLink,
          deployedDate: values.deployedDate || null,
          repoName: values.repoName,
          devLatestBranch: values.devLatestBranch,
          releaseBranch: values.releaseBranch,
          capabilities: {
            ordering: values.ordering,
            offers: values.offers,
            loyalty: values.loyalty,
            reservation: values.reservation,
            eventOrdering: values.eventOrdering,
            inFramework: values.inFramework,
          },
          migrationStage: values.migrationStage || undefined,
          migrationQuarter: values.migrationQuarter,
          targetStack: values.targetStack,
        })
        toast.success('Client created', values.domain ? `${values.name} was added with ${values.domain}.` : `${values.name} was added.`)
      }
      onClose()
    } catch {
      // withErrorToast in the store already surfaced the failure — keep the drawer open so the user can retry.
    }
  })

  return (
    <Drawer
      open
      onClose={onClose}
      title={isEdit ? 'Edit Client' : 'Add Client'}
      description={
        isEdit
          ? client?.name
          : 'Captures onboarding, technology, ordering, migration and feature details in one place.'
      }
      size="xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => void onSubmit()}>
            {isEdit ? 'Save changes' : 'Create client'}
          </Button>
        </>
      }
    >
      <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
        <DrawerSection title="Client information">
          <FormField label="Client / Brand name" htmlFor="cf-name" required error={errors.name?.message}>
            <Input id="cf-name" placeholder="Bella Napoli Pizzeria" invalid={!!errors.name} {...register('name')} />
          </FormField>
          <FormField label="Phone" htmlFor="cf-phone" error={errors.phone?.message}>
            <Input id="cf-phone" {...register('phone')} />
          </FormField>
          <FormField label="Location" htmlFor="cf-location" required error={errors.location?.message}>
            <Input id="cf-location" placeholder="Austin, TX" invalid={!!errors.location} {...register('location')} />
          </FormField>
          <FormField label="Status" htmlFor="cf-status">
            <Select id="cf-status" {...register('status')}>
              {STATUS_VALUES.map((v) => (
                <option key={v} value={v}>
                  {CLIENT_STATUS_LABELS[v]}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Current stage" htmlFor="cf-stage">
            <Select id="cf-stage" {...register('stage')}>
              {STAGE_VALUES.map((v) => (
                <option key={v} value={v}>
                  {CLIENT_STAGE_LABELS[v]}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Priority" htmlFor="cf-priority">
            <Select id="cf-priority" {...register('priority')}>
              {PRIORITY_VALUES.map((v) => (
                <option key={v} value={v}>
                  {PRIORITY_LABELS[v]}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Remarks" htmlFor="cf-notes" className="col-span-2">
            <Textarea id="cf-notes" rows={3} placeholder="Context, requirements, gotchas…" {...register('notes')} />
          </FormField>
        </DrawerSection>

        <DrawerSection title="Technology & environment">
          <FormField
            label="Website domain"
            htmlFor="cf-domain"
            error={errors.domain?.message}
            hint={!hasSite ? 'Optional — leave blank to add technology, ordering and QA details later.' : undefined}
            className="col-span-2"
          >
            <Input id="cf-domain" placeholder="bellanapoli.com" invalid={!!errors.domain} {...register('domain')} />
          </FormField>
          <FormField label="Technology stack" htmlFor="cf-framework">
            <Select id="cf-framework" disabled={!hasSite} {...register('framework')}>
              {FRAMEWORK_VALUES.map((v) => (
                <option key={v} value={v}>
                  {FRAMEWORK_LABELS[v]}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Environment" htmlFor="cf-environment">
            <Select id="cf-environment" disabled={!hasSite} {...register('environment')}>
              {ENVIRONMENTS_ORDERED.map((v) => (
                <option key={v} value={v}>
                  {ENVIRONMENT_LABELS[v]}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Figma design link" htmlFor="cf-figma" className="col-span-2">
            <Input
              id="cf-figma"
              placeholder="https://www.figma.com/design/…"
              disabled={!hasSite}
              {...register('figmaLink')}
            />
          </FormField>
        </DrawerSection>

        <DrawerSection title="Ordering & QA">
          <FormField label="Embedded ordering status" htmlFor="cf-ordering">
            <Select id="cf-ordering" disabled={!hasSite} {...register('orderingStatus')}>
              {ORDERING_VALUES.map((v) => (
                <option key={v} value={v}>
                  {ORDERING_STATUS_LABELS[v]}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Ordering stage" htmlFor="cf-ordering-stage">
            <Input
              id="cf-ordering-stage"
              placeholder="Menu setup, Payments QA…"
              disabled={!hasSite}
              {...register('orderingStage')}
            />
          </FormField>
          <FormField label="QA sign-off" htmlFor="cf-qa">
            <Select id="cf-qa" disabled={!hasSite} {...register('qaSignoff')}>
              {QA_SIGNOFF_ORDERED.map((v) => (
                <option key={v} value={v}>
                  {QA_SIGNOFF_LABELS[v]}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Deployed to live date" htmlFor="cf-deployed-date">
            <Input id="cf-deployed-date" type="date" disabled={!hasSite} {...register('deployedDate')} />
          </FormField>
        </DrawerSection>

        <DrawerSection title="Repository">
          <FormField label="Repo name" htmlFor="cf-repo-name">
            <Input id="cf-repo-name" placeholder="org/client-site" disabled={!hasSite} {...register('repoName')} />
          </FormField>
          <FormField label="Dev latest branch" htmlFor="cf-dev-branch">
            <Input id="cf-dev-branch" placeholder="main" disabled={!hasSite} {...register('devLatestBranch')} />
          </FormField>
          <FormField label="Release branch" htmlFor="cf-release-branch">
            <Input id="cf-release-branch" placeholder="release" disabled={!hasSite} {...register('releaseBranch')} />
          </FormField>
        </DrawerSection>

        <DrawerSection title="Migration">
          {hasSite ? (
            <>
              <FormField label="Target stack" htmlFor="cf-target-stack">
                <Select id="cf-target-stack" {...register('targetStack')}>
                  {MIGRATION_TARGET_VALUES.map((v) => (
                    <option key={v} value={v}>
                      {FRAMEWORK_LABELS[v]}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Migration status" htmlFor="cf-migration-stage">
                <Select id="cf-migration-stage" {...register('migrationStage')}>
                  <option value="">Not tracked</option>
                  {MIGRATION_STAGE_VALUES.map((v) => (
                    <option key={v} value={v}>
                      {MIGRATION_STAGE_LABELS[v]}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Migration quarter" htmlFor="cf-migration-quarter">
                <Select id="cf-migration-quarter" {...register('migrationQuarter')}>
                  <option value="">—</option>
                  {quarterOptions().map((q) => (
                    <option key={q} value={q}>
                      {q}
                    </option>
                  ))}
                </Select>
              </FormField>
            </>
          ) : (
            <p className="col-span-2 text-xs text-faint">Add a website domain above to unlock migration tracking.</p>
          )}
        </DrawerSection>

        <DrawerSection title="Feature enablement">
          <FormField label="Ordering" htmlFor="cf-ordering-capability">
            <Select id="cf-ordering-capability" {...register('ordering')}>
              {CAPABILITY_STATES_ORDERED.map((v) => (
                <option key={v} value={v}>
                  {CAPABILITY_STATE_LABELS[v]}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Offers" htmlFor="cf-offers">
            <Select id="cf-offers" {...register('offers')}>
              {CAPABILITY_STATES_ORDERED.map((v) => (
                <option key={v} value={v}>
                  {CAPABILITY_STATE_LABELS[v]}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Loyalty" htmlFor="cf-loyalty">
            <Select id="cf-loyalty" {...register('loyalty')}>
              {CAPABILITY_STATES_ORDERED.map((v) => (
                <option key={v} value={v}>
                  {CAPABILITY_STATE_LABELS[v]}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Reservation" htmlFor="cf-reservation">
            <Select id="cf-reservation" {...register('reservation')}>
              {CAPABILITY_STATES_ORDERED.map((v) => (
                <option key={v} value={v}>
                  {CAPABILITY_STATE_LABELS[v]}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Event ordering" htmlFor="cf-event-ordering">
            <Select id="cf-event-ordering" {...register('eventOrdering')}>
              {CAPABILITY_STATES_ORDERED.map((v) => (
                <option key={v} value={v}>
                  {CAPABILITY_STATE_LABELS[v]}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="In framework" htmlFor="cf-in-framework">
            <Select id="cf-in-framework" {...register('inFramework')}>
              {CAPABILITY_STATES_ORDERED.map((v) => (
                <option key={v} value={v}>
                  {CAPABILITY_STATE_LABELS[v]}
                </option>
              ))}
            </Select>
          </FormField>
        </DrawerSection>

        <button type="submit" className="hidden" aria-hidden />
      </form>
    </Drawer>
  )
}
