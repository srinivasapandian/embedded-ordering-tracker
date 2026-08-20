import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { ColumnDef } from '@tanstack/react-table'
import { ChevronDown, Pencil, Plus, Trash2, Users } from 'lucide-react'
import type { Client, ClientStatus, Priority } from '@/types'
import {
  CLIENT_STAGE_LABELS,
  CLIENT_STATUS_LABELS,
  FRAMEWORK_LABELS,
  ORDERING_STATUS_LABELS,
  PRIORITY_LABELS,
} from '@/types'
import { useAppStore, type ClientFormValues } from '@/store/appStore'
import { toast } from '@/store/toastStore'
import { useSimulatedLoad } from '@/hooks/useSimulatedLoad'
import { useDebounce } from '@/hooks/useDebounce'
import { primaryWebsite } from '@/utils/selectors'
import { fmtDate } from '@/utils/date'
import { Button } from '@/components/common/Button'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
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

const STATUS_VALUES = ['active', 'in-progress', 'completed', 'blocked'] as const
const STAGE_VALUES = ['onboarded', 'requirements', 'ordering', 'migration', 'qa', 'completed'] as const
const PRIORITY_VALUES = ['high', 'medium', 'low'] as const
const ORDERING_VALUES = ['active', 'in-progress', 'no-need', 'not-started'] as const
const FRAMEWORK_VALUES = ['react', 'nextjs'] as const

const DOMAIN_RE = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i

const statusOptions = STATUS_VALUES.map((v) => ({ value: v, label: CLIENT_STATUS_LABELS[v] }))
const priorityOptions = PRIORITY_VALUES.map((v) => ({ value: v, label: PRIORITY_LABELS[v] }))

/* ------------------------------------------------------------------ */
/* Clients manager                                                     */
/* ------------------------------------------------------------------ */

export function ClientsManager({ initialSearch = '' }: { initialSearch?: string }) {
  const clients = useAppStore((s) => s.clients)
  const websites = useAppStore((s) => s.websites)
  const members = useAppStore((s) => s.teamMembers)
  const updateClient = useAppStore((s) => s.updateClient)
  const deleteClients = useAppStore((s) => s.deleteClients)
  const bulkUpdateClients = useAppStore((s) => s.bulkUpdateClients)
  const { can, denyReason } = usePerms()
  const load = useSimulatedLoad(480)

  const canCreate = can('create-client')
  const canEdit = can('edit-client')
  const canDelete = can('delete-client')

  const [search, setSearch] = useState(initialSearch)
  const query = useDebounce(search, 200)
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const [priorityFilter, setPriorityFilter] = useState<string[]>([])
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<Client | null>(null)
  const [deleting, setDeleting] = useState<Client | null>(null)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return clients.filter((c) => {
      if (statusFilter.length > 0 && !statusFilter.includes(c.status)) return false
      if (priorityFilter.length > 0 && !priorityFilter.includes(c.priority)) return false
      if (!q) return true
      const site = primaryWebsite(websites, c.id)
      return [c.name, c.contactName, c.email, c.location, site?.name, site?.domain].some((v) =>
        v?.toLowerCase().includes(q),
      )
    })
  }, [clients, websites, query, statusFilter, priorityFilter])

  const columns = useMemo<ColumnDef<Client>[]>(
    () => [
      selectionColumn<Client>(),
      {
        accessorKey: 'name',
        meta: { label: 'Client' },
        header: ({ column }) => <SortableHeader column={column}>Client</SortableHeader>,
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-ink">{row.original.name}</p>
            <p className="truncate text-xs text-sub">{row.original.contactName}</p>
          </div>
        ),
      },
      {
        id: 'website',
        meta: { label: 'Primary website' },
        accessorFn: (c) => primaryWebsite(websites, c.id)?.name ?? '',
        header: ({ column }) => <SortableHeader column={column}>Primary Website</SortableHeader>,
        cell: ({ row }) => {
          const site = primaryWebsite(websites, row.original.id)
          if (!site) return <span className="text-sm text-faint">—</span>
          return (
            <div className="min-w-0">
              <p className="truncate text-sm text-ink">{site.name}</p>
              <p className="truncate text-xs text-faint">{site.domain}</p>
            </div>
          )
        },
      },
      {
        accessorKey: 'location',
        meta: { label: 'Location' },
        header: ({ column }) => <SortableHeader column={column}>Location</SortableHeader>,
        cell: ({ row }) => <span className="whitespace-nowrap text-sm text-sub">{row.original.location}</span>,
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
    [websites, members, canEdit, canDelete, denyReason, updateClient],
  )

  const { table, selectedIds, clearSelection } = useAdminTable({
    data: filtered,
    columns,
    getRowId: (c) => c.id,
    initialSorting: [{ id: 'updatedAt', desc: true }],
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
  const bulkAssignItems: MenuItem[] = [
    {
      key: 'unassigned',
      label: 'Unassigned',
      onSelect: () => {
        bulkUpdateClients(selectedIds, { assignedToId: null })
        toast.success('Clients updated', `${selectedIds.length} clients unassigned.`)
        clearSelection()
      },
    },
    ...members
      .filter((m) => m.active)
      .map((m) => ({
        key: m.id,
        label: m.name,
        onSelect: () => {
          bulkUpdateClients(selectedIds, { assignedToId: m.id })
          toast.success('Clients updated', `${selectedIds.length} clients assigned to ${m.name}.`)
          clearSelection()
        },
      })),
  ]
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
                  Assign <ChevronDown className="h-3 w-3" aria-hidden />
                </Button>
              )}
              groups={[{ items: bulkAssignItems }]}
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
      {editing && <ClientEditModal client={editing} onClose={() => setEditing(null)} />}

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

const editSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  contactName: z.string().min(2, 'Contact name is required'),
  email: z.string().email('Enter a valid email address'),
  phone: z.string().min(7, 'Enter a valid phone number'),
  location: z.string().min(2, 'Location is required'),
  notes: z.string(),
  status: z.enum(STATUS_VALUES),
  stage: z.enum(STAGE_VALUES),
  priority: z.enum(PRIORITY_VALUES),
  assignedToId: z.string(),
})

type EditValues = z.infer<typeof editSchema>

function ClientEditModal({ client, onClose }: { client: Client; onClose: () => void }) {
  const members = useAppStore((s) => s.teamMembers)
  const updateClient = useAppStore((s) => s.updateClient)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      name: client.name,
      contactName: client.contactName,
      email: client.email,
      phone: client.phone,
      location: client.location,
      notes: client.notes,
      status: client.status,
      stage: client.stage,
      priority: client.priority,
      assignedToId: client.assignedToId ?? '',
    },
  })

  const onSubmit = handleSubmit((values) => {
    updateClient(client.id, { ...values, assignedToId: values.assignedToId || null })
    toast.success('Client updated', `${values.name} was saved.`)
    onClose()
  })

  return (
    <Modal
      open
      onClose={onClose}
      title="Edit Client"
      description={client.name}
      size="lg"
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
        <FormField label="Client name" htmlFor="ce-name" required error={errors.name?.message}>
          <Input id="ce-name" invalid={!!errors.name} {...register('name')} />
        </FormField>
        <FormField label="Contact name" htmlFor="ce-contact" required error={errors.contactName?.message}>
          <Input id="ce-contact" invalid={!!errors.contactName} {...register('contactName')} />
        </FormField>
        <FormField label="Email" htmlFor="ce-email" required error={errors.email?.message}>
          <Input id="ce-email" type="email" invalid={!!errors.email} {...register('email')} />
        </FormField>
        <FormField label="Phone" htmlFor="ce-phone" required error={errors.phone?.message}>
          <Input id="ce-phone" invalid={!!errors.phone} {...register('phone')} />
        </FormField>
        <FormField label="Location" htmlFor="ce-location" required error={errors.location?.message}>
          <Input id="ce-location" invalid={!!errors.location} {...register('location')} />
        </FormField>
        <FormField label="Assigned to" htmlFor="ce-assigned">
          <Select id="ce-assigned" {...register('assignedToId')}>
            <option value="">Unassigned</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </Select>
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
        <FormField label="Stage" htmlFor="ce-stage">
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
        <FormField label="Notes" htmlFor="ce-notes" className="col-span-2">
          <Textarea id="ce-notes" rows={3} {...register('notes')} />
        </FormField>
        <button type="submit" className="hidden" aria-hidden />
      </form>
    </Modal>
  )
}

/* ------------------------------------------------------------------ */
/* Add modal — creates client + primary website via saveClientForm     */
/* ------------------------------------------------------------------ */

function ClientAddModal({ onClose }: { onClose: () => void }) {
  const websites = useAppStore((s) => s.websites)
  const saveClientForm = useAppStore((s) => s.saveClientForm)

  const addSchema = useMemo(() => {
    const domains = new Set(websites.map((w) => w.domain.toLowerCase()))
    return z.object({
      name: z.string().min(2, 'Name must be at least 2 characters'),
      domain: z
        .string()
        .regex(DOMAIN_RE, 'Enter a valid domain, e.g. restaurant.com')
        .refine((d) => !domains.has(d.toLowerCase()), 'This domain is already registered'),
      location: z.string().min(2, 'Location is required'),
      orderingStatus: z.enum(ORDERING_VALUES),
      framework: z.enum(FRAMEWORK_VALUES),
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
      orderingStatus: 'not-started',
      framework: 'react',
      priority: 'medium',
      notes: '',
    },
  })

  const onSubmit = handleSubmit((values) => {
    const payload: ClientFormValues = {
      ...values,
      email: '',
      assignedToId: null,
    }
    saveClientForm(null, payload)
    toast.success('Client created', `${values.name} was added with ${values.domain}.`)
    onClose()
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
        <FormField label="Website domain" htmlFor="ca-domain" required error={errors.domain?.message}>
          <Input id="ca-domain" placeholder="bellanapoli.com" invalid={!!errors.domain} {...register('domain')} />
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
