import { useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { Sparkles } from 'lucide-react'
import type { Client } from '@/types'
import { CAPABILITY_LABELS, CAPABILITY_STATE_LABELS, ORDERING_STATUS_LABELS } from '@/types'
import { useAppStore } from '@/store/appStore'
import { useSimulatedLoad } from '@/hooks/useSimulatedLoad'
import { useDebounce } from '@/hooks/useDebounce'
import { primaryWebsite } from '@/utils/selectors'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { SearchInput } from '@/components/common/SearchInput'
import { SkeletonTable } from '@/components/common/Skeleton'
import { StatusBadge } from '@/components/common/StatusBadge'
import { ColumnToggleMenu, SortableHeader } from '@/components/common/table'
import { AdminDataTable, AdminToolbar } from './adminShared'
import { useAdminTable } from './useAdminTable'

const ORDERING_VALUES = ['active', 'in-progress', 'no-need', 'not-started'] as const
const orderingOptions = ORDERING_VALUES.map((v) => ({ value: v, label: ORDERING_STATUS_LABELS[v] }))
const CAPABILITY_KEYS = Object.keys(CAPABILITY_LABELS) as Array<keyof Client['capabilities']>

/** Read-only mirror of per-client feature rollout — every field here is edited from the Client Tracker's onboarding form. */
export function FeaturesManager() {
  const clients = useAppStore((s) => s.clients)
  const websites = useAppStore((s) => s.websites)
  const load = useSimulatedLoad(420)

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
          return <StatusBadge status={site.orderingStatus} />
        },
      },
      ...CAPABILITY_KEYS.map(
        (key): ColumnDef<Client> => ({
          id: key,
          meta: { label: CAPABILITY_LABELS[key] },
          accessorFn: (c) => c.capabilities[key],
          header: ({ column }) => <SortableHeader column={column}>{CAPABILITY_LABELS[key]}</SortableHeader>,
          cell: ({ row }) => (
            <StatusBadge
              status={
                row.original.capabilities[key] === 'in-progress'
                  ? 'in-progress'
                  : row.original.capabilities[key] === 'enabled'
                    ? 'active'
                    : 'no-need'
              }
              label={CAPABILITY_STATE_LABELS[row.original.capabilities[key]]}
            />
          ),
        }),
      ),
    ],
    [websites],
  )

  const { table } = useAdminTable({
    data: filtered,
    columns,
    getRowId: (c) => c.id,
    initialSorting: [{ id: 'name', desc: false }],
    enableSelection: false,
  })

  const hasFilters = search !== '' || orderingFilter.length > 0
  const clearFilters = () => {
    setSearch('')
    setOrderingFilter([])
  }

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
