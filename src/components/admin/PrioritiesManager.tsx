import { useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { CalendarClock, Pencil, Plus, Trash2 } from 'lucide-react'
import type { Priority, PriorityItem, PriorityItemStatus } from '@/types'
import { PRIORITY_ITEM_STATUS_LABELS, PRIORITY_LABELS } from '@/types'
import { useAppStore } from '@/store/appStore'
import { toast } from '@/store/toastStore'
import { useSimulatedLoad } from '@/hooks/useSimulatedLoad'
import { useDebounce } from '@/hooks/useDebounce'
import { fmtDate, isOverdue, weekKeyOf, weekLabel } from '@/utils/date'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { PriorityBadge } from '@/components/common/PriorityBadge'
import { SearchInput } from '@/components/common/SearchInput'
import { SkeletonTable } from '@/components/common/Skeleton'
import { StatusBadge } from '@/components/common/StatusBadge'
import { ColumnToggleMenu, SortableHeader } from '@/components/common/table'
import { UserAvatar } from '@/components/common/UserAvatar'
import { PriorityFormModal } from '@/components/dashboard/PriorityFormModal'
import {
  AdminDataTable,
  AdminToolbar,
  DisabledHint,
  RowActionButton,
  usePerms,
} from './adminShared'
import { InlineSelectCell } from './inlineCells'
import { useAdminTable } from './useAdminTable'

const PRIORITY_VALUES = ['high', 'medium', 'low'] as const
const STATUS_VALUES = ['not-started', 'in-progress', 'blocked', 'review', 'completed'] as const

const priorityOptions = PRIORITY_VALUES.map((v) => ({ value: v, label: PRIORITY_LABELS[v] }))
const statusOptions = STATUS_VALUES.map((v) => ({ value: v, label: PRIORITY_ITEM_STATUS_LABELS[v] }))

/** Admin manager for weekly priority tasks across every week, not just the current one. */
export function PrioritiesManager() {
  const priorities = useAppStore((s) => s.priorities)
  const websites = useAppStore((s) => s.websites)
  const teamMembers = useAppStore((s) => s.teamMembers)
  const updatePriority = useAppStore((s) => s.updatePriority)
  const deletePriority = useAppStore((s) => s.deletePriority)
  const { can, denyReason } = usePerms()
  const load = useSimulatedLoad(420)

  const canEdit = can('edit-client')

  const [search, setSearch] = useState('')
  const query = useDebounce(search, 200)
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const [priorityFilter, setPriorityFilter] = useState<string[]>([])
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<PriorityItem | null>(null)
  const [deleting, setDeleting] = useState<PriorityItem | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return priorities.filter((p) => {
      if (statusFilter.length > 0 && !statusFilter.includes(p.status)) return false
      if (priorityFilter.length > 0 && !priorityFilter.includes(p.priority)) return false
      if (!q) return true
      const site = websites.find((w) => w.id === p.websiteId)
      return [p.title, site?.name, site?.domain].some((v) => v?.toLowerCase().includes(q))
    })
  }, [priorities, websites, query, statusFilter, priorityFilter])

  const columns = useMemo<ColumnDef<PriorityItem>[]>(
    () => [
      {
        accessorKey: 'title',
        meta: { label: 'Task' },
        header: ({ column }) => <SortableHeader column={column}>Task</SortableHeader>,
        cell: ({ row }) => {
          const site = websites.find((w) => w.id === row.original.websiteId)
          return (
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-ink">{row.original.title}</p>
              <p className="truncate text-xs text-sub">{site?.name ?? 'Unknown website'}</p>
            </div>
          )
        },
      },
      {
        accessorKey: 'weekStart',
        meta: { label: 'Week' },
        header: ({ column }) => <SortableHeader column={column}>Week</SortableHeader>,
        cell: ({ row }) => <span className="whitespace-nowrap text-sm text-sub">{weekLabel(row.original.weekStart)}</span>,
      },
      {
        accessorKey: 'priority',
        meta: { label: 'Priority' },
        header: ({ column }) => <SortableHeader column={column}>Priority</SortableHeader>,
        cell: ({ row }) => (
          <InlineSelectCell
            value={row.original.priority}
            options={priorityOptions}
            ariaLabel={`Priority for ${row.original.title}`}
            display={<PriorityBadge priority={row.original.priority} />}
            disabled={!canEdit}
            disabledReason={denyReason}
            onSave={(v) => updatePriority(row.original.id, { priority: v as Priority })}
          />
        ),
      },
      {
        accessorKey: 'dueDate',
        meta: { label: 'Due Date' },
        header: ({ column }) => <SortableHeader column={column}>Due Date</SortableHeader>,
        cell: ({ row }) => {
          const overdue = isOverdue(row.original.dueDate) && row.original.status !== 'completed'
          return (
            <span className="flex items-center gap-1.5 whitespace-nowrap">
              <span className={overdue ? 'font-medium text-red-600 dark:text-red-400' : 'text-ink'}>
                {fmtDate(row.original.dueDate)}
              </span>
              {overdue && <Badge tone="red" uppercase>Overdue</Badge>}
            </span>
          )
        },
      },
      {
        accessorKey: 'status',
        meta: { label: 'Status' },
        header: ({ column }) => <SortableHeader column={column}>Status</SortableHeader>,
        cell: ({ row }) => (
          <InlineSelectCell
            value={row.original.status}
            options={statusOptions}
            ariaLabel={`Status for ${row.original.title}`}
            display={<StatusBadge status={row.original.status} />}
            disabled={!canEdit}
            disabledReason={denyReason}
            onSave={(v) => updatePriority(row.original.id, { status: v as PriorityItemStatus })}
          />
        ),
      },
      {
        id: 'assignee',
        meta: { label: 'Assignee' },
        accessorFn: (p) => teamMembers.find((m) => m.id === p.assignedToId)?.name ?? '',
        header: ({ column }) => <SortableHeader column={column}>Assignee</SortableHeader>,
        cell: ({ row }) => {
          const member = teamMembers.find((m) => m.id === row.original.assignedToId)
          return member ? (
            <UserAvatar member={member} size="sm" showName />
          ) : (
            <span className="text-sm text-faint">Unassigned</span>
          )
        },
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
              label="Edit priority"
              icon={Pencil}
              onClick={() => setEditing(row.original)}
              disabled={!canEdit}
              disabledReason={denyReason}
            />
            <RowActionButton
              label="Delete priority"
              icon={Trash2}
              danger
              onClick={() => setDeleting(row.original)}
              disabled={!canEdit}
              disabledReason={denyReason}
            />
          </div>
        ),
      },
    ],
    [websites, teamMembers, canEdit, denyReason, updatePriority],
  )

  const { table } = useAdminTable({
    data: filtered,
    columns,
    getRowId: (p) => p.id,
    initialSorting: [{ id: 'dueDate', desc: false }],
    enableSelection: false,
  })

  const hasFilters = search !== '' || statusFilter.length > 0 || priorityFilter.length > 0
  const clearFilters = () => {
    setSearch('')
    setStatusFilter([])
    setPriorityFilter([])
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
          placeholder="Search task or website…"
          className="w-64"
          aria-label="Search priorities"
        />
        <FilterDropdown label="Status" options={statusOptions} selected={statusFilter} onChange={setStatusFilter} />
        <FilterDropdown label="Priority" options={priorityOptions} selected={priorityFilter} onChange={setPriorityFilter} />
        <div className="ml-auto flex items-center gap-2">
          <ColumnToggleMenu table={table} />
          <DisabledHint when={!canEdit} reason={denyReason}>
            <Button size="sm" variant="primary" disabled={!canEdit} onClick={() => setAdding(true)}>
              <Plus className="h-3.5 w-3.5" aria-hidden />
              Add Priority
            </Button>
          </DisabledHint>
        </div>
      </AdminToolbar>

      <AdminDataTable
        table={table}
        stickyHeader
        empty={
          <EmptyState
            icon={CalendarClock}
            title={hasFilters ? 'No priorities match your filters' : 'No priorities yet'}
            description={
              hasFilters
                ? 'Try adjusting the search or clearing the active filters.'
                : 'Add the first weekly priority task.'
            }
            actionLabel={hasFilters ? 'Clear filters' : canEdit ? 'Add Priority' : undefined}
            onAction={hasFilters ? clearFilters : canEdit ? () => setAdding(true) : undefined}
          />
        }
      />

      {(adding || editing) && (
        <PriorityFormModal
          open
          onClose={() => {
            setAdding(false)
            setEditing(null)
          }}
          editing={editing}
          weekStart={editing?.weekStart ?? weekKeyOf()}
        />
      )}

      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        destructive
        title="Delete priority?"
        confirmLabel="Delete priority"
        description={deleting ? `"${deleting.title}" will be permanently removed from ${weekLabel(deleting.weekStart)}.` : undefined}
        onConfirm={() => {
          if (!deleting) return
          deletePriority(deleting.id)
          toast.success('Priority deleted', `"${deleting.title}" was removed.`)
        }}
      />
    </div>
  )
}
