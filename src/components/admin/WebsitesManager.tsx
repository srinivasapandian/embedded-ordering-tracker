import { useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { Globe } from 'lucide-react'
import type { Website } from '@/types'
import { ENVIRONMENT_LABELS, FRAMEWORK_LABELS, ORDERING_STATUS_LABELS, QA_SIGNOFF_LABELS } from '@/types'
import { useAppStore } from '@/store/appStore'
import { useSimulatedLoad } from '@/hooks/useSimulatedLoad'
import { useDebounce } from '@/hooks/useDebounce'
import { clientById } from '@/utils/selectors'
import { fmtDate } from '@/utils/date'
import { Badge } from '@/components/common/Badge'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { SearchInput } from '@/components/common/SearchInput'
import { SkeletonTable } from '@/components/common/Skeleton'
import { StatusBadge } from '@/components/common/StatusBadge'
import { ColumnToggleMenu, SortableHeader } from '@/components/common/table'
import { AdminDataTable, AdminToolbar } from './adminShared'
import { useAdminTable } from './useAdminTable'

const FRAMEWORK_VALUES = ['react', 'nextjs'] as const
const ORDERING_VALUES = ['active', 'in-progress', 'no-need', 'not-started'] as const

const frameworkOptions = FRAMEWORK_VALUES.map((v) => ({ value: v, label: FRAMEWORK_LABELS[v] }))
const orderingOptions = ORDERING_VALUES.map((v) => ({ value: v, label: ORDERING_STATUS_LABELS[v] }))

const ENV_TONE = { Production: 'emerald', Staging: 'amber', QA: 'sky' } as const
const QA_TONE = { 'signed-off': 'emerald', pending: 'amber', 'not-required': 'slate' } as const

/** Read-only mirror of registered websites — every field here is edited from the Client Tracker's onboarding form. */
export function WebsitesManager({ initialSearch = '' }: { initialSearch?: string }) {
  const websites = useAppStore((s) => s.websites)
  const clients = useAppStore((s) => s.clients)
  const load = useSimulatedLoad(480)

  const [search, setSearch] = useState(initialSearch)
  const query = useDebounce(search, 200)
  const [frameworkFilter, setFrameworkFilter] = useState<string[]>([])
  const [orderingFilter, setOrderingFilter] = useState<string[]>([])

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
        cell: ({ row }) => <StatusBadge status={row.original.framework} />,
      },
      {
        accessorKey: 'orderingStatus',
        meta: { label: 'Ordering status' },
        header: ({ column }) => <SortableHeader column={column}>Ordering Status</SortableHeader>,
        cell: ({ row }) => <StatusBadge status={row.original.orderingStatus} />,
      },
      {
        accessorKey: 'environment',
        meta: { label: 'Environment' },
        header: ({ column }) => <SortableHeader column={column}>Environment</SortableHeader>,
        cell: ({ row }) => (
          <Badge tone={ENV_TONE[row.original.environment]}>{ENVIRONMENT_LABELS[row.original.environment]}</Badge>
        ),
      },
      {
        accessorKey: 'qaSignoff',
        meta: { label: 'QA Sign-off' },
        header: ({ column }) => <SortableHeader column={column}>QA Sign-off</SortableHeader>,
        cell: ({ row }) => (
          <Badge tone={QA_TONE[row.original.qaSignoff]}>{QA_SIGNOFF_LABELS[row.original.qaSignoff]}</Badge>
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
    ],
    [clients],
  )

  const { table } = useAdminTable({
    data: filtered,
    columns,
    getRowId: (w) => w.id,
    initialSorting: [{ id: 'updatedAt', desc: true }],
    enableSelection: false,
  })

  const hasFilters = search !== '' || frameworkFilter.length > 0 || orderingFilter.length > 0
  const clearFilters = () => {
    setSearch('')
    setFrameworkFilter([])
    setOrderingFilter([])
  }

  if (load.loading) {
    return (
      <div className="app-card overflow-hidden">
        <SkeletonTable rows={8} cols={8} />
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
        </div>
      </AdminToolbar>

      <AdminDataTable
        table={table}
        empty={
          <EmptyState
            icon={Globe}
            title={hasFilters ? 'No websites match your filters' : 'No websites yet'}
            description={
              hasFilters
                ? 'Try adjusting the search or clearing the active filters.'
                : 'Register a website from the Client Tracker onboarding form.'
            }
            actionLabel={hasFilters ? 'Clear filters' : undefined}
            onAction={hasFilters ? clearFilters : undefined}
          />
        }
      />
    </div>
  )
}
