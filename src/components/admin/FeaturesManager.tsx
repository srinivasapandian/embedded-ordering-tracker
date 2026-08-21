import { useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { ChevronDown, Sparkles } from 'lucide-react'
import type { CapabilityState, Client, OrderingStatus } from '@/types'
import {
  CAPABILITY_LABELS,
  CAPABILITY_STATE_LABELS,
  CAPABILITY_STATES_ORDERED,
  ORDERING_STATUS_LABELS,
} from '@/types'
import { useAppStore } from '@/store/appStore'
import { toast } from '@/store/toastStore'
import { useSimulatedLoad } from '@/hooks/useSimulatedLoad'
import { useDebounce } from '@/hooks/useDebounce'
import { primaryWebsite } from '@/utils/selectors'
import { Button } from '@/components/common/Button'
import { DropdownMenu, type MenuItem } from '@/components/common/DropdownMenu'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { SearchInput } from '@/components/common/SearchInput'
import { SkeletonTable } from '@/components/common/Skeleton'
import { StatusBadge } from '@/components/common/StatusBadge'
import { ColumnToggleMenu, SortableHeader } from '@/components/common/table'
import {
  AdminDataTable,
  AdminToolbar,
  BulkBar,
  DisabledHint,
  selectionColumn,
  usePerms,
} from './adminShared'
import { InlineSelectCell } from './inlineCells'
import { useAdminTable } from './useAdminTable'

const ORDERING_VALUES = ['active', 'in-progress', 'no-need', 'not-started'] as const
const orderingOptions = ORDERING_VALUES.map((v) => ({ value: v, label: ORDERING_STATUS_LABELS[v] }))
const capabilityOptions = CAPABILITY_STATES_ORDERED.map((v) => ({ value: v, label: CAPABILITY_STATE_LABELS[v] }))
const CAPABILITY_KEYS = Object.keys(CAPABILITY_LABELS) as Array<keyof Client['capabilities']>

/** Admin manager for per-client feature rollout: Embedded Ordering plus the four tracked capabilities. */
export function FeaturesManager() {
  const clients = useAppStore((s) => s.clients)
  const websites = useAppStore((s) => s.websites)
  const updateWebsite = useAppStore((s) => s.updateWebsite)
  const updateClientCapability = useAppStore((s) => s.updateClientCapability)
  const bulkUpdateClientCapability = useAppStore((s) => s.bulkUpdateClientCapability)
  const { can, denyReason } = usePerms()
  const load = useSimulatedLoad(420)

  const canEdit = can('manage-features')

  const [search, setSearch] = useState('')
  const query = useDebounce(search, 200)
  const [orderingFilter, setOrderingFilter] = useState<string[]>([])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return clients.filter((c) => {
      const site = primaryWebsite(websites, c.id)
      if (orderingFilter.length > 0 && (!site || !orderingFilter.includes(site.orderingStatus))) return false
      if (!q) return true
      return [c.name, c.location, site?.domain].some((v) => v?.toLowerCase().includes(q))
    })
  }, [clients, websites, query, orderingFilter])

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
            <p className="truncate text-xs text-sub">{row.original.location}</p>
          </div>
        ),
      },
      {
        id: 'embeddedOrdering',
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
      ...CAPABILITY_KEYS.map(
        (key): ColumnDef<Client> => ({
          id: key,
          meta: { label: CAPABILITY_LABELS[key] },
          accessorFn: (c) => c.capabilities[key],
          header: ({ column }) => <SortableHeader column={column}>{CAPABILITY_LABELS[key]}</SortableHeader>,
          cell: ({ row }) => (
            <InlineSelectCell
              value={row.original.capabilities[key]}
              options={capabilityOptions}
              ariaLabel={`${CAPABILITY_LABELS[key]} for ${row.original.name}`}
              display={<StatusBadge status={row.original.capabilities[key] === 'in-progress' ? 'in-progress' : row.original.capabilities[key] === 'enabled' ? 'active' : 'no-need'} label={CAPABILITY_STATE_LABELS[row.original.capabilities[key]]} />}
              disabled={!canEdit}
              disabledReason={denyReason}
              onSave={(v) => updateClientCapability(row.original.id, key, v as CapabilityState)}
            />
          ),
        }),
      ),
    ],
    [websites, canEdit, denyReason, updateWebsite, updateClientCapability],
  )

  const { table, selectedIds, clearSelection } = useAdminTable({
    data: filtered,
    columns,
    getRowId: (c) => c.id,
    initialSorting: [{ id: 'name', desc: false }],
  })

  const hasFilters = search !== '' || orderingFilter.length > 0
  const clearFilters = () => {
    setSearch('')
    setOrderingFilter([])
  }

  const bulkMenuFor = (key: keyof Client['capabilities']): MenuItem[] =>
    CAPABILITY_STATES_ORDERED.map((v) => ({
      key: v,
      label: CAPABILITY_STATE_LABELS[v],
      onSelect: () => {
        bulkUpdateClientCapability(selectedIds, key, v)
        toast.success('Clients updated', `${selectedIds.length} clients set to ${CAPABILITY_STATE_LABELS[v]} for ${CAPABILITY_LABELS[key]}.`)
        clearSelection()
      },
    }))

  if (load.loading) {
    return (
      <div className="app-card overflow-hidden">
        <SkeletonTable rows={8} cols={6} />
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
        <FilterDropdown
          label="Embedded Ordering"
          options={orderingOptions}
          selected={orderingFilter}
          onChange={setOrderingFilter}
        />
        <div className="ml-auto flex items-center gap-2">
          <ColumnToggleMenu table={table} />
        </div>
      </AdminToolbar>

      <BulkBar count={selectedIds.length} onClear={clearSelection}>
        {canEdit ? (
          CAPABILITY_KEYS.map((key) => (
            <DropdownMenu
              key={key}
              align="start"
              trigger={(props) => (
                <Button size="xs" variant="outline" {...props}>
                  Set {CAPABILITY_LABELS[key]} <ChevronDown className="h-3 w-3" aria-hidden />
                </Button>
              )}
              groups={[{ items: bulkMenuFor(key) }]}
            />
          ))
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
            icon={Sparkles}
            title={hasFilters ? 'No clients match your filters' : 'No clients yet'}
            description={
              hasFilters
                ? 'Try adjusting the search or clearing the active filters.'
                : 'Add a client from the Client Tracker tab to start tracking feature rollout.'
            }
            actionLabel={hasFilters ? 'Clear filters' : undefined}
            onAction={hasFilters ? clearFilters : undefined}
          />
        }
      />
    </div>
  )
}
