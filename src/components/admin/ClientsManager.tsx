import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { ColumnDef } from '@tanstack/react-table'
import { ChevronDown, Eye, Pencil, Plus, Trash2, Users } from 'lucide-react'
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
import { useAppStore, type ClientFormValues } from '@/store/appStore'
import { toast } from '@/store/toastStore'
import { useSimulatedLoad } from '@/hooks/useSimulatedLoad'
import { useDebounce } from '@/hooks/useDebounce'
import { migrationForWebsite, primaryWebsite } from '@/utils/selectors'
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
import { Modal } from '@/components/common/Modal'
import { PriorityBadge } from '@/components/common/PriorityBadge'
import { SearchInput } from '@/components/common/SearchInput'
import { Select } from '@/components/common/Select'
import { SkeletonTable } from '@/components/common/Skeleton'
import { StatusBadge } from '@/components/common/StatusBadge'
import { ColumnToggleMenu, SortableHeader } from '@/components/common/table'
import { Tooltip } from '@/components/common/Tooltip'
import { ClientExpansionPanel } from '@/components/clients/ClientExpansionPanel'
import { buildClientRows } from '@/components/clients/clientRows'
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
const FRAMEWORK_VALUES = ['react', 'nextjs'] as const

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

      {adding && <ClientAddModal onClose={() => setAdding(false)} />}
      {editing && <ClientEditDrawer client={editing} onClose={() => setEditing(null)} />}

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
/* Edit modal (compact RHF + zod)                                      */
/* ------------------------------------------------------------------ */

const MIGRATION_STAGE_VALUES = ['planning', 'in-progress', 'testing', 'completed'] as const
const QA_VALUES = ['signed-off', 'pending', 'not-required'] as const
const ENV_VALUES = ['Production', 'Staging', 'QA'] as const
const CAPABILITY_STATE_VALUES = ['enabled', 'in-progress', 'unavailable'] as const

function sectionEditSchema(websites: { domain: string }[], currentDomain: string | undefined) {
  const domains = new Set(websites.map((w) => w.domain.toLowerCase()).filter((d) => d !== currentDomain?.toLowerCase()))
  return z.object({
    // Client information
    name: z.string().min(2, 'Name must be at least 2 characters'),
    phone: z.string().min(7, 'Enter a valid phone number'),
    location: z.string().min(2, 'Location is required'),
    notes: z.string(),
    status: z.enum(STATUS_VALUES),
    stage: z.enum(STAGE_VALUES),
    priority: z.enum(PRIORITY_VALUES),
    // Site & technology (optional — a client may have no primary website)
    domain: z
      .string()
      .regex(DOMAIN_RE, 'Enter a valid domain, e.g. restaurant.com')
      .refine((d) => !domains.has(d.toLowerCase()), 'This domain is already registered')
      .optional()
      .or(z.literal('')),
    liveUrl: z.string().optional().or(z.literal('')),
    framework: z.enum(FRAMEWORK_VALUES).optional(),
    environment: z.enum(ENV_VALUES).optional(),
    orderingStatus: z.enum(ORDERING_VALUES).optional(),
    orderingStage: z.string().optional(),
    qaSignoff: z.enum(QA_VALUES).optional(),
    // Migration (optional — not every site has an active migration record)
    migrationStage: z.enum(MIGRATION_STAGE_VALUES).optional(),
    migrationQuarter: z.string().optional(),
    targetStack: z.enum(FRAMEWORK_VALUES).optional(),
    // Feature enablement
    offers: z.enum(CAPABILITY_STATE_VALUES),
    loyalty: z.enum(CAPABILITY_STATE_VALUES),
    reservation: z.enum(CAPABILITY_STATE_VALUES),
    eventOrdering: z.enum(CAPABILITY_STATE_VALUES),
  })
}

type EditValues = z.infer<ReturnType<typeof sectionEditSchema>>

function DrawerSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-line pt-4 first:border-0 first:pt-0">
      <h3 className="text-2xs font-semibold uppercase tracking-wider text-faint">{title}</h3>
      <div className="mt-3 grid grid-cols-2 gap-3">{children}</div>
    </section>
  )
}

/** Full-lifecycle edit drawer: client info, site/technology, ordering & QA, migration and feature enablement. */
function ClientEditDrawer({ client, onClose }: { client: Client; onClose: () => void }) {
  const websites = useAppStore((s) => s.websites)
  const migrations = useAppStore((s) => s.migrations)
  const updateClient = useAppStore((s) => s.updateClient)
  const updateWebsite = useAppStore((s) => s.updateWebsite)
  const updateMigration = useAppStore((s) => s.updateMigration)
  const addWebsite = useAppStore((s) => s.addWebsite)

  const site = useMemo(() => primaryWebsite(websites, client.id), [websites, client.id])
  const [newSiteDomain, setNewSiteDomain] = useState('')
  const [newSiteError, setNewSiteError] = useState<string | null>(null)
  const [creatingSite, setCreatingSite] = useState(false)

  const handleCreateSite = async () => {
    const domain = newSiteDomain.trim().toLowerCase()
    if (!domain) {
      setNewSiteError('Enter a domain first.')
      return
    }
    if (websites.some((w) => w.domain.toLowerCase() === domain)) {
      setNewSiteError('This domain is already registered.')
      return
    }
    setNewSiteError(null)
    setCreatingSite(true)
    try {
      await addWebsite({
        name: client.name,
        domain,
        clientId: client.id,
        framework: 'react',
        orderingStatus: 'not-started',
        orderingStage: 'Not scheduled',
        orderingStartDate: null,
        orderingCompletedDate: null,
        environment: 'Staging',
        qaSignoff: 'pending',
        liveUrl: `https://${domain}`,
      })
      toast.success('Website added', `Reopen "Edit" on ${client.name} to fill in the rest.`)
      onClose()
    } catch {
      // withErrorToast in the store already surfaced the failure.
    } finally {
      setCreatingSite(false)
    }
  }
  const migration = useMemo(() => (site ? migrationForWebsite(migrations, site.id) : undefined), [migrations, site])

  const schema = useMemo(() => sectionEditSchema(websites, site?.domain), [websites, site?.domain])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EditValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: client.name,
      phone: client.phone,
      location: client.location,
      notes: client.notes,
      status: client.status,
      stage: client.stage,
      priority: client.priority,
      domain: site?.domain ?? '',
      liveUrl: site?.liveUrl ?? '',
      framework: site?.framework ?? 'react',
      environment: site?.environment ?? 'Staging',
      orderingStatus: site?.orderingStatus ?? 'not-started',
      orderingStage: site?.orderingStage ?? '',
      qaSignoff: site?.qaSignoff ?? 'pending',
      migrationStage: migration?.stage,
      migrationQuarter: migration?.quarter ?? '',
      targetStack: migration?.targetStack ?? 'nextjs',
      offers: client.capabilities.offers,
      loyalty: client.capabilities.loyalty,
      reservation: client.capabilities.reservation,
      eventOrdering: client.capabilities.eventOrdering,
    },
  })

  const onSubmit = handleSubmit(async (values) => {
    try {
      await updateClient(client.id, {
        name: values.name,
        phone: values.phone,
        location: values.location,
        notes: values.notes,
        status: values.status,
        stage: values.stage,
        priority: values.priority,
        capabilities: {
          offers: values.offers,
          loyalty: values.loyalty,
          reservation: values.reservation,
          eventOrdering: values.eventOrdering,
        },
      })

      if (site) {
        await updateWebsite(site.id, {
          domain: values.domain || site.domain,
          liveUrl: values.liveUrl || `https://${values.domain || site.domain}`,
          framework: values.framework ?? site.framework,
          environment: values.environment ?? site.environment,
          orderingStatus: values.orderingStatus ?? site.orderingStatus,
          orderingStage: values.orderingStage || site.orderingStage,
          qaSignoff: values.qaSignoff ?? site.qaSignoff,
        })
      }

      if (migration) {
        const patch: Partial<typeof migration> = {
          quarter: values.migrationQuarter || migration.quarter,
          targetStack: values.targetStack ?? migration.targetStack,
        }
        if (values.migrationStage && values.migrationStage !== migration.stage) patch.stage = values.migrationStage
        await updateMigration(migration.id, patch)
      }

      toast.success('Client updated', `${values.name} was saved.`)
      onClose()
    } catch {
      // withErrorToast in the store already surfaced the failure — keep the drawer open so the user can retry.
    }
  })

  return (
    <Drawer
      open
      onClose={onClose}
      title="Edit Client"
      description={client.name}
      size="xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => void onSubmit()}>
            Save changes
          </Button>
        </>
      }
    >
      <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
        <DrawerSection title="Client information">
          <FormField label="Client / Brand name" htmlFor="ce-name" required error={errors.name?.message}>
            <Input id="ce-name" invalid={!!errors.name} {...register('name')} />
          </FormField>
          <FormField label="Phone" htmlFor="ce-phone" required error={errors.phone?.message}>
            <Input id="ce-phone" invalid={!!errors.phone} {...register('phone')} />
          </FormField>
          <FormField label="Location" htmlFor="ce-location" required error={errors.location?.message}>
            <Input id="ce-location" invalid={!!errors.location} {...register('location')} />
          </FormField>
          <FormField label="Status" htmlFor="ce-status">
            <Select id="ce-status" {...register('status')}>
              {STATUS_VALUES.map((v) => (
                <option key={v} value={v}>
                  {CLIENT_STATUS_LABELS[v]}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Current stage" htmlFor="ce-stage">
            <Select id="ce-stage" {...register('stage')}>
              {STAGE_VALUES.map((v) => (
                <option key={v} value={v}>
                  {CLIENT_STAGE_LABELS[v]}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Priority" htmlFor="ce-priority">
            <Select id="ce-priority" {...register('priority')}>
              {PRIORITY_VALUES.map((v) => (
                <option key={v} value={v}>
                  {PRIORITY_LABELS[v]}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Remarks" htmlFor="ce-notes" className="col-span-2">
            <Textarea id="ce-notes" rows={3} {...register('notes')} />
          </FormField>
        </DrawerSection>

        {site ? (
          <>
            <DrawerSection title="Technology & environment">
              <FormField label="Live URL / domain" htmlFor="ce-domain" error={errors.domain?.message}>
                <Input id="ce-domain" invalid={!!errors.domain} {...register('domain')} />
              </FormField>
              <FormField label="Technology stack" htmlFor="ce-framework">
                <Select id="ce-framework" {...register('framework')}>
                  {FRAMEWORK_VALUES.map((v) => (
                    <option key={v} value={v}>
                      {FRAMEWORK_LABELS[v]}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Environment" htmlFor="ce-environment">
                <Select id="ce-environment" {...register('environment')}>
                  {ENVIRONMENTS_ORDERED.map((v) => (
                    <option key={v} value={v}>
                      {ENVIRONMENT_LABELS[v]}
                    </option>
                  ))}
                </Select>
              </FormField>
            </DrawerSection>

            <DrawerSection title="Ordering & QA">
              <FormField label="Embedded ordering status" htmlFor="ce-ordering">
                <Select id="ce-ordering" {...register('orderingStatus')}>
                  {ORDERING_VALUES.map((v) => (
                    <option key={v} value={v}>
                      {ORDERING_STATUS_LABELS[v]}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Ordering stage" htmlFor="ce-ordering-stage">
                <Input id="ce-ordering-stage" placeholder="Menu setup, Payments QA…" {...register('orderingStage')} />
              </FormField>
              <FormField label="QA sign-off" htmlFor="ce-qa">
                <Select id="ce-qa" {...register('qaSignoff')}>
                  {QA_SIGNOFF_ORDERED.map((v) => (
                    <option key={v} value={v}>
                      {QA_SIGNOFF_LABELS[v]}
                    </option>
                  ))}
                </Select>
              </FormField>
            </DrawerSection>

            <DrawerSection title="Migration">
              {migration ? (
                <>
                  <FormField label="Current stack" htmlFor="ce-current-stack" hint="Mirrors the technology stack above.">
                    <Input id="ce-current-stack" value={FRAMEWORK_LABELS[site.framework]} disabled />
                  </FormField>
                  <FormField label="Target stack" htmlFor="ce-target-stack">
                    <Select id="ce-target-stack" {...register('targetStack')}>
                      {FRAMEWORK_VALUES.map((v) => (
                        <option key={v} value={v}>
                          {FRAMEWORK_LABELS[v]}
                        </option>
                      ))}
                    </Select>
                  </FormField>
                  <FormField label="Migration status" htmlFor="ce-migration-stage">
                    <Select id="ce-migration-stage" {...register('migrationStage')}>
                      {MIGRATION_STAGE_VALUES.map((v) => (
                        <option key={v} value={v}>
                          {MIGRATION_STAGE_LABELS[v]}
                        </option>
                      ))}
                    </Select>
                  </FormField>
                  <FormField label="Migration quarter" htmlFor="ce-migration-quarter">
                    <Select id="ce-migration-quarter" {...register('migrationQuarter')}>
                      {quarterOptions().map((q) => (
                        <option key={q} value={q}>
                          {q}
                        </option>
                      ))}
                    </Select>
                  </FormField>
                </>
              ) : (
                <p className="col-span-2 text-xs text-faint">
                  No migration is tracked for this site yet — start one from the Migration tab.
                </p>
              )}
            </DrawerSection>
          </>
        ) : (
          <DrawerSection title="Technology & environment">
            <p className="col-span-2 text-xs text-faint">
              No website is registered for this client yet — Technology Stack, Environment, Embedded Ordering, QA
              Sign-off and Migration all live on the primary website, so add one to unlock those fields.
            </p>
            <FormField label="Domain" htmlFor="ce-new-site-domain" error={newSiteError ?? undefined} className="col-span-2">
              <div className="flex gap-2">
                <Input
                  id="ce-new-site-domain"
                  placeholder="restaurant.com"
                  value={newSiteDomain}
                  onChange={(e) => setNewSiteDomain(e.target.value)}
                />
                <Button type="button" variant="secondary" onClick={() => void handleCreateSite()} disabled={creatingSite}>
                  {creatingSite ? 'Adding…' : 'Add website'}
                </Button>
              </div>
            </FormField>
          </DrawerSection>
        )}

        <DrawerSection title="Feature enablement">
          <FormField label="Offers" htmlFor="ce-offers">
            <Select id="ce-offers" {...register('offers')}>
              {CAPABILITY_STATES_ORDERED.map((v) => (
                <option key={v} value={v}>
                  {CAPABILITY_STATE_LABELS[v]}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Loyalty" htmlFor="ce-loyalty">
            <Select id="ce-loyalty" {...register('loyalty')}>
              {CAPABILITY_STATES_ORDERED.map((v) => (
                <option key={v} value={v}>
                  {CAPABILITY_STATE_LABELS[v]}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Reservation" htmlFor="ce-reservation">
            <Select id="ce-reservation" {...register('reservation')}>
              {CAPABILITY_STATES_ORDERED.map((v) => (
                <option key={v} value={v}>
                  {CAPABILITY_STATE_LABELS[v]}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Event ordering" htmlFor="ce-event-ordering">
            <Select id="ce-event-ordering" {...register('eventOrdering')}>
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

/* ------------------------------------------------------------------ */
/* Add modal — creates client + primary website via saveClientForm     */
/* ------------------------------------------------------------------ */

function ClientAddModal({ onClose }: { onClose: () => void }) {
  const websites = useAppStore((s) => s.websites)
  const createClient = useAppStore((s) => s.createClient)

  const addSchema = useMemo(() => {
    const domains = new Set(websites.map((w) => w.domain.toLowerCase()))
    return z.object({
      name: z.string().min(2, 'Name must be at least 2 characters'),
      domain: z
        .string()
        .regex(DOMAIN_RE, 'Enter a valid domain, e.g. restaurant.com')
        .refine((d) => !domains.has(d.toLowerCase()), 'This domain is already registered')
        .optional()
        .or(z.literal('')),
      location: z.string().min(2, 'Location is required'),
      phone: z.string(),
      orderingStatus: z.enum(ORDERING_VALUES),
      framework: z.enum(FRAMEWORK_VALUES),
      environment: z.enum(ENV_VALUES),
      qaSignoff: z.enum(QA_VALUES),
      priority: z.enum(PRIORITY_VALUES),
      notes: z.string(),
    })
  }, [websites])

  type AddValues = z.infer<typeof addSchema>

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AddValues>({
    resolver: zodResolver(addSchema),
    defaultValues: {
      name: '',
      domain: '',
      location: '',
      phone: '',
      orderingStatus: 'not-started',
      framework: 'react',
      environment: 'Staging',
      qaSignoff: 'pending',
      priority: 'medium',
      notes: '',
    },
  })

  const onSubmit = handleSubmit(async (values) => {
    const payload: ClientFormValues = { ...values }
    try {
      await createClient(payload)
      toast.success('Client created', values.domain ? `${values.name} was added with ${values.domain}.` : `${values.name} was added.`)
      onClose()
    } catch {
      // withErrorToast in the store already surfaced the failure — keep the modal open so the user can retry.
    }
  })

  return (
    <Modal
      open
      onClose={onClose}
      title="Add Client"
      description="Creates the client and registers its primary website."
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => void onSubmit()}>
            Create client
          </Button>
        </>
      }
    >
      <form onSubmit={(e) => void onSubmit(e)} className="grid grid-cols-2 gap-3">
        <FormField label="Client name" htmlFor="ca-name" required error={errors.name?.message}>
          <Input id="ca-name" placeholder="Bella Napoli Pizzeria" invalid={!!errors.name} {...register('name')} />
        </FormField>
        <FormField
          label="Website domain"
          htmlFor="ca-domain"
          error={errors.domain?.message}
          hint="Optional — leave blank to add technology, ordering and QA details for this client later."
        >
          <Input id="ca-domain" placeholder="bellanapoli.com" invalid={!!errors.domain} {...register('domain')} />
        </FormField>
        <FormField label="Phone" htmlFor="ca-phone" error={errors.phone?.message}>
          <Input id="ca-phone" {...register('phone')} />
        </FormField>
        <FormField label="Location" htmlFor="ca-location" required error={errors.location?.message}>
          <Input id="ca-location" placeholder="Austin, TX" invalid={!!errors.location} {...register('location')} />
        </FormField>
        <FormField label="Ordering status" htmlFor="ca-ordering">
          <Select id="ca-ordering" {...register('orderingStatus')}>
            {ORDERING_VALUES.map((v) => (
              <option key={v} value={v}>
                {ORDERING_STATUS_LABELS[v]}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Framework" htmlFor="ca-framework">
          <Select id="ca-framework" {...register('framework')}>
            {FRAMEWORK_VALUES.map((v) => (
              <option key={v} value={v}>
                {FRAMEWORK_LABELS[v]}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Environment" htmlFor="ca-environment">
          <Select id="ca-environment" {...register('environment')}>
            {ENVIRONMENTS_ORDERED.map((v) => (
              <option key={v} value={v}>
                {ENVIRONMENT_LABELS[v]}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="QA sign-off" htmlFor="ca-qa">
          <Select id="ca-qa" {...register('qaSignoff')}>
            {QA_SIGNOFF_ORDERED.map((v) => (
              <option key={v} value={v}>
                {QA_SIGNOFF_LABELS[v]}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Priority" htmlFor="ca-priority">
          <Select id="ca-priority" {...register('priority')}>
            {PRIORITY_VALUES.map((v) => (
              <option key={v} value={v}>
                {PRIORITY_LABELS[v]}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Notes" htmlFor="ca-notes" className="col-span-2">
          <Textarea id="ca-notes" rows={3} placeholder="Context, requirements, gotchas…" {...register('notes')} />
        </FormField>
        <button type="submit" className="hidden" aria-hidden />
      </form>
    </Modal>
  )
}
