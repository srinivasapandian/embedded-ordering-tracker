import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { ColumnDef } from '@tanstack/react-table'
import { ChevronDown, Earth, Pencil, Plus, Trash2 } from 'lucide-react'
import type { Framework, OrderingStatus, Website } from '@/types'
import { FRAMEWORK_LABELS, ORDERING_STATUS_LABELS } from '@/types'
import { useAppStore } from '@/store/appStore'
import { toast } from '@/store/toastStore'
import { useSimulatedLoad } from '@/hooks/useSimulatedLoad'
import { useDebounce } from '@/hooks/useDebounce'
import { clientById } from '@/utils/selectors'
import { fmtDate } from '@/utils/date'
import { Button } from '@/components/common/Button'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { DropdownMenu, type MenuItem } from '@/components/common/DropdownMenu'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { FormField } from '@/components/common/FormField'
import { Input } from '@/components/common/Input'
import { Modal } from '@/components/common/Modal'
import { SearchInput } from '@/components/common/SearchInput'
import { Select } from '@/components/common/Select'
import { SkeletonTable } from '@/components/common/Skeleton'
import { StatusBadge } from '@/components/common/StatusBadge'
import { ColumnToggleMenu, SortableHeader } from '@/components/common/table'
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
const ORDERING_VALUES = ['active', 'in-progress', 'no-need', 'not-started'] as const
const DOMAIN_RE = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i

const frameworkOptions = FRAMEWORK_VALUES.map((v) => ({ value: v, label: FRAMEWORK_LABELS[v] }))
const orderingOptions = ORDERING_VALUES.map((v) => ({ value: v, label: ORDERING_STATUS_LABELS[v] }))

/** Default human ordering-stage label for a given ordering status. */
function stageForStatus(status: OrderingStatus): string {
  switch (status) {
    case 'active':
      return 'Live'
    case 'in-progress':
      return 'Menu setup'
    case 'no-need':
      return 'Not required'
    default:
      return 'Not scheduled'
  }
}

export function WebsitesManager({ initialSearch = '' }: { initialSearch?: string }) {
  const websites = useAppStore((s) => s.websites)
  const clients = useAppStore((s) => s.clients)
  const updateWebsite = useAppStore((s) => s.updateWebsite)
  const deleteWebsite = useAppStore((s) => s.deleteWebsite)
  const { can, denyReason } = usePerms()
  const load = useSimulatedLoad(480)

  const canCreate = can('create-client')
  const canEdit = can('edit-client')
  const canDelete = can('delete-client')

  const [search, setSearch] = useState(initialSearch)
  const query = useDebounce(search, 200)
  const [frameworkFilter, setFrameworkFilter] = useState<string[]>([])
  const [orderingFilter, setOrderingFilter] = useState<string[]>([])
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<Website | null>(null)
  const [deleting, setDeleting] = useState<Website | null>(null)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return websites.filter((w) => {
      if (frameworkFilter.length > 0 && !frameworkFilter.includes(w.framework)) return false
      if (orderingFilter.length > 0 && !orderingFilter.includes(w.orderingStatus)) return false
      if (!q) return true
      const client = clientById(clients, w.clientId)
      return [w.name, w.domain, client?.name].some((v) => v?.toLowerCase().includes(q))
    })
  }, [websites, clients, query, frameworkFilter, orderingFilter])

  const columns = useMemo<ColumnDef<Website>[]>(
    () => [
      selectionColumn<Website>(),
      {
        accessorKey: 'name',
        meta: { label: 'Website' },
        header: ({ column }) => <SortableHeader column={column}>Website</SortableHeader>,
        cell: ({ row }) => <span className="text-sm font-medium text-ink">{row.original.name}</span>,
      },
      {
        accessorKey: 'domain',
        meta: { label: 'Domain' },
        header: ({ column }) => <SortableHeader column={column}>Domain</SortableHeader>,
        cell: ({ row }) => <span className="text-xs text-faint">{row.original.domain}</span>,
      },
      {
        id: 'client',
        meta: { label: 'Client' },
        accessorFn: (w) => clientById(clients, w.clientId)?.name ?? '',
        header: ({ column }) => <SortableHeader column={column}>Client</SortableHeader>,
        cell: ({ row }) => (
          <span className="text-sm text-sub">{clientById(clients, row.original.clientId)?.name ?? '—'}</span>
        ),
      },
      {
        accessorKey: 'framework',
        meta: { label: 'Framework' },
        header: ({ column }) => <SortableHeader column={column}>Framework</SortableHeader>,
        cell: ({ row }) => (
          <InlineSelectCell
            value={row.original.framework}
            options={frameworkOptions}
            ariaLabel={`Framework for ${row.original.name}`}
            display={<StatusBadge status={row.original.framework} />}
            disabled={!canEdit}
            disabledReason={denyReason}
            onSave={(v) => updateWebsite(row.original.id, { framework: v as Framework })}
          />
        ),
      },
      {
        accessorKey: 'orderingStatus',
        meta: { label: 'Ordering status' },
        header: ({ column }) => <SortableHeader column={column}>Ordering Status</SortableHeader>,
        cell: ({ row }) => (
          <InlineSelectCell
            value={row.original.orderingStatus}
            options={orderingOptions}
            ariaLabel={`Ordering status for ${row.original.name}`}
            display={<StatusBadge status={row.original.orderingStatus} />}
            disabled={!canEdit}
            disabledReason={denyReason}
            onSave={(v) => updateWebsite(row.original.id, { orderingStatus: v as OrderingStatus })}
          />
        ),
      },
      {
        accessorKey: 'updatedAt',
        meta: { label: 'Updated' },
        header: ({ column }) => <SortableHeader column={column}>Updated</SortableHeader>,
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-xs text-sub">{fmtDate(row.original.updatedAt)}</span>
        ),
      },
      {
        id: 'actions',
        size: 80,
        enableSorting: false,
        enableHiding: false,
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-0.5">
            <RowActionButton
              label="Edit website"
              icon={Pencil}
              onClick={() => setEditing(row.original)}
              disabled={!canEdit}
              disabledReason={denyReason}
            />
            <RowActionButton
              label="Delete website"
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
    [clients, canEdit, canDelete, denyReason, updateWebsite],
  )

  const { table, selectedIds, clearSelection } = useAdminTable({
    data: filtered,
    columns,
    getRowId: (w) => w.id,
    initialSorting: [{ id: 'updatedAt', desc: true }],
  })

  const hasFilters = search !== '' || frameworkFilter.length > 0 || orderingFilter.length > 0
  const clearFilters = () => {
    setSearch('')
    setFrameworkFilter([])
    setOrderingFilter([])
  }

  const bulkOrderingItems: MenuItem[] = ORDERING_VALUES.map((v) => ({
    key: v,
    label: ORDERING_STATUS_LABELS[v],
    onSelect: () => {
      for (const id of selectedIds) updateWebsite(id, { orderingStatus: v })
      toast.success('Websites updated', `${selectedIds.length} websites set to ${ORDERING_STATUS_LABELS[v]}.`)
      clearSelection()
    },
  }))
  const bulkFrameworkItems: MenuItem[] = FRAMEWORK_VALUES.map((v) => ({
    key: v,
    label: FRAMEWORK_LABELS[v],
    onSelect: () => {
      for (const id of selectedIds) updateWebsite(id, { framework: v })
      toast.success('Websites updated', `${selectedIds.length} websites moved to ${FRAMEWORK_LABELS[v]}.`)
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
          placeholder="Search websites…"
          className="w-64"
          aria-label="Search websites"
        />
        <FilterDropdown label="Framework" options={frameworkOptions} selected={frameworkFilter} onChange={setFrameworkFilter} />
        <FilterDropdown label="Ordering Status" options={orderingOptions} selected={orderingFilter} onChange={setOrderingFilter} />
        <div className="ml-auto flex items-center gap-2">
          <ColumnToggleMenu table={table} />
          <DisabledHint when={!canCreate} reason={denyReason}>
            <Button size="sm" variant="primary" disabled={!canCreate} onClick={() => setAdding(true)}>
              <Plus className="h-3.5 w-3.5" aria-hidden />
              Add Website
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
                  Change Ordering Status <ChevronDown className="h-3 w-3" aria-hidden />
                </Button>
              )}
              groups={[{ items: bulkOrderingItems }]}
            />
            <DropdownMenu
              align="start"
              trigger={(props) => (
                <Button size="xs" variant="outline" {...props}>
                  Change Framework <ChevronDown className="h-3 w-3" aria-hidden />
                </Button>
              )}
              groups={[{ items: bulkFrameworkItems }]}
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
        empty={
          <EmptyState
            icon={Earth}
            title={hasFilters ? 'No websites match your filters' : 'No websites yet'}
            description={
              hasFilters
                ? 'Try adjusting the search or clearing the active filters.'
                : 'Register a website for one of your clients.'
            }
            actionLabel={hasFilters ? 'Clear filters' : canCreate ? 'Add Website' : undefined}
            onAction={hasFilters ? clearFilters : canCreate ? () => setAdding(true) : undefined}
          />
        }
      />

      {adding && <WebsiteAddModal onClose={() => setAdding(false)} />}
      {editing && <WebsiteEditModal website={editing} onClose={() => setEditing(null)} />}

      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        destructive
        title="Delete website?"
        confirmLabel="Delete website"
        description={
          deleting
            ? `"${deleting.name}" (${deleting.domain}) will be permanently removed. Any migrations and weekly priorities linked to this website are deleted with it.`
            : undefined
        }
        onConfirm={() => {
          if (!deleting) return
          deleteWebsite(deleting.id)
          clearSelection()
          toast.success('Website deleted', `${deleting.name} and its linked records were removed.`)
        }}
      />
      <ConfirmDialog
        open={bulkDeleteOpen}
        onClose={() => setBulkDeleteOpen(false)}
        destructive
        title={`Delete ${selectedIds.length} websites?`}
        confirmLabel="Delete websites"
        description="The selected websites will be permanently removed. Any migrations and weekly priorities linked to them are deleted as well."
        onConfirm={() => {
          const n = selectedIds.length
          for (const id of selectedIds) deleteWebsite(id)
          clearSelection()
          toast.success('Websites deleted', `${n} websites and their linked records were removed.`)
        }}
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Add modal — requires picking an existing client                     */
/* ------------------------------------------------------------------ */

function WebsiteAddModal({ onClose }: { onClose: () => void }) {
  const clients = useAppStore((s) => s.clients)
  const websites = useAppStore((s) => s.websites)
  const addWebsite = useAppStore((s) => s.addWebsite)

  const schema = useMemo(() => {
    const domains = new Set(websites.map((w) => w.domain.toLowerCase()))
    return z.object({
      clientId: z.string().min(1, 'Pick the client this website belongs to'),
      name: z.string().min(2, 'Name must be at least 2 characters'),
      domain: z
        .string()
        .regex(DOMAIN_RE, 'Enter a valid domain, e.g. restaurant.com')
        .refine((d) => !domains.has(d.toLowerCase()), 'This domain is already registered'),
      framework: z.enum(FRAMEWORK_VALUES),
      orderingStatus: z.enum(ORDERING_VALUES),
    })
  }, [websites])

  type Values = z.infer<typeof schema>

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { clientId: '', name: '', domain: '', framework: 'react', orderingStatus: 'not-started' },
  })

  const sortedClients = useMemo(() => [...clients].sort((a, b) => a.name.localeCompare(b.name)), [clients])

  const onSubmit = handleSubmit((values) => {
    const now = new Date().toISOString()
    addWebsite({
      name: values.name,
      domain: values.domain,
      clientId: values.clientId,
      framework: values.framework,
      orderingStatus: values.orderingStatus,
      orderingStage: stageForStatus(values.orderingStatus),
      orderingStartDate: values.orderingStatus === 'active' || values.orderingStatus === 'in-progress' ? now : null,
      orderingCompletedDate: values.orderingStatus === 'active' ? now : null,
    })
    toast.success('Website created', `${values.name} (${values.domain}) was added.`)
    onClose()
  })

  return (
    <Modal
      open
      onClose={onClose}
      title="Add Website"
      description="Websites must belong to an existing client."
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => void onSubmit()}>
            Create website
          </Button>
        </>
      }
    >
      <form onSubmit={(e) => void onSubmit(e)} className="grid grid-cols-2 gap-3">
        <FormField label="Client" htmlFor="wa-client" required error={errors.clientId?.message} className="col-span-2">
          <Select id="wa-client" invalid={!!errors.clientId} {...register('clientId')}>
            <option value="">Select a client…</option>
            {sortedClients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Website name" htmlFor="wa-name" required error={errors.name?.message}>
          <Input id="wa-name" placeholder="Bella Napoli Online" invalid={!!errors.name} {...register('name')} />
        </FormField>
        <FormField label="Domain" htmlFor="wa-domain" required error={errors.domain?.message}>
          <Input id="wa-domain" placeholder="order.bellanapoli.com" invalid={!!errors.domain} {...register('domain')} />
        </FormField>
        <FormField label="Framework" htmlFor="wa-framework">
          <Select id="wa-framework" {...register('framework')}>
            {FRAMEWORK_VALUES.map((v) => (
              <option key={v} value={v}>
                {FRAMEWORK_LABELS[v]}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Ordering status" htmlFor="wa-ordering">
          <Select id="wa-ordering" {...register('orderingStatus')}>
            {ORDERING_VALUES.map((v) => (
              <option key={v} value={v}>
                {ORDERING_STATUS_LABELS[v]}
              </option>
            ))}
          </Select>
        </FormField>
        <button type="submit" className="hidden" aria-hidden />
      </form>
    </Modal>
  )
}

/* ------------------------------------------------------------------ */
/* Edit modal — includes re-parenting to another client                */
/* ------------------------------------------------------------------ */

function WebsiteEditModal({ website, onClose }: { website: Website; onClose: () => void }) {
  const clients = useAppStore((s) => s.clients)
  const websites = useAppStore((s) => s.websites)
  const updateWebsite = useAppStore((s) => s.updateWebsite)

  const schema = useMemo(() => {
    const domains = new Set(
      websites.filter((w) => w.id !== website.id).map((w) => w.domain.toLowerCase()),
    )
    return z.object({
      clientId: z.string().min(1, 'Pick the client this website belongs to'),
      name: z.string().min(2, 'Name must be at least 2 characters'),
      domain: z
        .string()
        .regex(DOMAIN_RE, 'Enter a valid domain, e.g. restaurant.com')
        .refine((d) => !domains.has(d.toLowerCase()), 'This domain is already registered'),
      framework: z.enum(FRAMEWORK_VALUES),
      orderingStatus: z.enum(ORDERING_VALUES),
      orderingStage: z.string().min(2, 'Stage label is required'),
    })
  }, [websites, website.id])

  type Values = z.infer<typeof schema>

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      clientId: website.clientId,
      name: website.name,
      domain: website.domain,
      framework: website.framework,
      orderingStatus: website.orderingStatus,
      orderingStage: website.orderingStage,
    },
  })

  const sortedClients = useMemo(() => [...clients].sort((a, b) => a.name.localeCompare(b.name)), [clients])

  const onSubmit = handleSubmit((values) => {
    updateWebsite(website.id, values)
    toast.success('Website updated', `${values.name} was saved.`)
    onClose()
  })

  return (
    <Modal
      open
      onClose={onClose}
      title="Edit Website"
      description={website.domain}
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
      <form onSubmit={(e) => void onSubmit(e)} className="grid grid-cols-2 gap-3">
        <FormField
          label="Client"
          htmlFor="we-client"
          required
          error={errors.clientId?.message}
          hint="Changing this re-parents the website to another client."
          className="col-span-2"
        >
          <Select id="we-client" invalid={!!errors.clientId} {...register('clientId')}>
            {sortedClients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Website name" htmlFor="we-name" required error={errors.name?.message}>
          <Input id="we-name" invalid={!!errors.name} {...register('name')} />
        </FormField>
        <FormField label="Domain" htmlFor="we-domain" required error={errors.domain?.message}>
          <Input id="we-domain" invalid={!!errors.domain} {...register('domain')} />
        </FormField>
        <FormField label="Framework" htmlFor="we-framework" hint="Switching to Next.js completes any open migration.">
          <Select id="we-framework" {...register('framework')}>
            {FRAMEWORK_VALUES.map((v) => (
              <option key={v} value={v}>
                {FRAMEWORK_LABELS[v]}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Ordering status" htmlFor="we-ordering">
          <Select id="we-ordering" {...register('orderingStatus')}>
            {ORDERING_VALUES.map((v) => (
              <option key={v} value={v}>
                {ORDERING_STATUS_LABELS[v]}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Ordering stage" htmlFor="we-stage" required error={errors.orderingStage?.message} className="col-span-2">
          <Input id="we-stage" placeholder="Menu setup, Payments QA…" invalid={!!errors.orderingStage} {...register('orderingStage')} />
        </FormField>
        <button type="submit" className="hidden" aria-hidden />
      </form>
    </Modal>
  )
}
