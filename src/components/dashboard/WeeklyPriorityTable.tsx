import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from '@tanstack/react-table'
import { motion } from 'framer-motion'
import {
  CalendarX2,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  Ellipsis,
  Pencil,
  Plus,
  SearchX,
  Trash2,
} from 'lucide-react'
import { Badge } from '@/components/common/Badge'
import { Button, IconButton } from '@/components/common/Button'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { DropdownMenu } from '@/components/common/DropdownMenu'
import { EmptyState } from '@/components/common/EmptyState'
import { FilterDropdown, type FilterOption } from '@/components/common/FilterDropdown'
import { Pagination } from '@/components/common/Pagination'
import { PriorityBadge } from '@/components/common/PriorityBadge'
import { SearchInput } from '@/components/common/SearchInput'
import { Select } from '@/components/common/Select'
import { StatusBadge } from '@/components/common/StatusBadge'
import { SortableHeader, TableShell } from '@/components/common/table'
import { useAppStore } from '@/store/appStore'
import { toast } from '@/store/toastStore'
import {
  PRIORITY_ITEM_STATUS_LABELS,
  PRIORITY_LABELS,
  type Priority,
  type PriorityItem,
  type PriorityItemStatus,
} from '@/types'
import { cn } from '@/utils/cn'
import { fmtDate, isOverdue, shiftWeekKey, weekKeyOf, weekLabel, weekRangeLabel } from '@/utils/date'
import { PriorityFormModal } from './PriorityFormModal'

/* ------------------------------------------------------------------ */
/* Row shape + sort orders                                             */
/* ------------------------------------------------------------------ */

interface PriorityRow extends PriorityItem {
  websiteName: string
}

/** Custom sort rank: high > medium > low (ascending puts High first). */
const PRIORITY_RANK: Record<Priority, number> = { high: 0, medium: 1, low: 2 }

/** Custom sort rank following the workflow order. */
const STATUS_RANK: Record<PriorityItemStatus, number> = {
  'not-started': 0,
  'in-progress': 1,
  blocked: 2,
  review: 3,
  completed: 4,
}

/* Filter chip dots — mirror the shared badge tones (dot + text always). */
const STATUS_DOTS: Record<PriorityItemStatus, string> = {
  'not-started': 'bg-red-500',
  'in-progress': 'bg-amber-500',
  blocked: 'bg-red-500',
  review: 'bg-violet-500',
  completed: 'bg-emerald-500',
}

const PRIORITY_DOTS: Record<Priority, string> = {
  high: 'bg-red-500',
  medium: 'bg-amber-500',
  low: 'bg-sky-500',
}

const STATUS_OPTIONS: FilterOption[] = (
  Object.keys(PRIORITY_ITEM_STATUS_LABELS) as PriorityItemStatus[]
).map((s) => ({
  value: s,
  label: PRIORITY_ITEM_STATUS_LABELS[s],
  render: <span className={cn('h-2 w-2 shrink-0 rounded-full', STATUS_DOTS[s])} aria-hidden />,
}))

const PRIORITY_OPTIONS: FilterOption[] = (Object.keys(PRIORITY_LABELS) as Priority[]).map((p) => ({
  value: p,
  label: PRIORITY_LABELS[p],
  render: <span className={cn('h-2 w-2 shrink-0 rounded-full', PRIORITY_DOTS[p])} aria-hidden />,
}))

const columnHelper = createColumnHelper<PriorityRow>()

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export function WeeklyPriorityTable() {
  const priorities = useAppStore((s) => s.priorities)
  const websites = useAppStore((s) => s.websites)
  const updatePriority = useAppStore((s) => s.updatePriority)
  const deletePriority = useAppStore((s) => s.deletePriority)

  const [selectedWeek, setSelectedWeek] = useState(() => weekKeyOf())
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const [priorityFilter, setPriorityFilter] = useState<string[]>([])
  const [sorting, setSorting] = useState<SortingState>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<PriorityItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<PriorityItem | null>(null)

  /* Week options: weeks present in the data ∪ current week ± 2. */
  const weekOptions = useMemo(() => {
    const keys = new Set<string>()
    for (const p of priorities) keys.add(p.weekStart)
    const current = weekKeyOf()
    for (let n = -2; n <= 2; n++) keys.add(shiftWeekKey(current, n))
    keys.add(selectedWeek)
    return [...keys].sort()
  }, [priorities, selectedWeek])

  const weekRows = useMemo<PriorityRow[]>(
    () =>
      priorities
        .filter((p) => p.weekStart === selectedWeek)
        .map((p) => ({
          ...p,
          websiteName: websites.find((w) => w.id === p.websiteId)?.name ?? 'Unknown website',
        })),
    [priorities, websites, selectedWeek],
  )

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return weekRows.filter((r) => {
      if (q && !r.websiteName.toLowerCase().includes(q) && !r.title.toLowerCase().includes(q))
        return false
      if (statusFilter.length > 0 && !statusFilter.includes(r.status)) return false
      if (priorityFilter.length > 0 && !priorityFilter.includes(r.priority)) return false
      return true
    })
  }, [weekRows, search, statusFilter, priorityFilter])

  /* ------------------------------ Actions --------------------------- */

  const openAdd = useCallback(() => {
    setEditing(null)
    setModalOpen(true)
  }, [])

  const openEdit = useCallback((item: PriorityItem) => {
    setEditing(item)
    setModalOpen(true)
  }, [])

  const markCompleted = useCallback(
    (item: PriorityItem) => {
      updatePriority(item.id, { status: 'completed' })
      toast.success('Marked completed', `"${item.title}" moved to Completed.`)
    },
    [updatePriority],
  )

  const confirmDelete = useCallback(() => {
    if (!deleteTarget) return
    deletePriority(deleteTarget.id)
    toast.success('Priority deleted', `"${deleteTarget.title}" removed from ${weekLabel(deleteTarget.weekStart)}.`)
  }, [deleteTarget, deletePriority])

  /* ------------------------------ Columns --------------------------- */

  const columns = useMemo(
    () => [
      columnHelper.accessor('websiteName', {
        id: 'website',
        header: ({ column }) => <SortableHeader column={column}>Website</SortableHeader>,
        meta: { label: 'Website' },
        cell: ({ row }) => (
          <div className="min-w-0 max-w-72">
            <p className="truncate text-sm font-semibold text-ink">{row.original.websiteName}</p>
            <p className="truncate text-xs text-sub">{row.original.title}</p>
          </div>
        ),
      }),
      columnHelper.accessor((r) => PRIORITY_RANK[r.priority], {
        id: 'priority',
        header: ({ column }) => <SortableHeader column={column}>Priority</SortableHeader>,
        meta: { label: 'Priority' },
        cell: ({ row }) => <PriorityBadge priority={row.original.priority} />,
      }),
      columnHelper.accessor('dueDate', {
        id: 'dueDate',
        header: ({ column }) => <SortableHeader column={column}>Due Date</SortableHeader>,
        meta: { label: 'Due Date' },
        cell: ({ row }) => {
          const overdue = isOverdue(row.original.dueDate) && row.original.status !== 'completed'
          return (
            <span className="flex items-center gap-1.5">
              <span
                className={cn(
                  'whitespace-nowrap tabular-nums',
                  overdue ? 'font-medium text-red-600 dark:text-red-400' : 'text-ink',
                )}
              >
                {fmtDate(row.original.dueDate)}
              </span>
              {overdue && (
                <Badge tone="red" uppercase>
                  Overdue
                </Badge>
              )}
            </span>
          )
        },
      }),
      columnHelper.accessor((r) => STATUS_RANK[r.status], {
        id: 'status',
        header: ({ column }) => <SortableHeader column={column}>Status</SortableHeader>,
        meta: { label: 'Status' },
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      }),
      columnHelper.display({
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        meta: { label: 'Actions' },
        cell: ({ row }) => {
          const item = row.original
          return (
            <div className="flex justify-end">
              <DropdownMenu
                align="end"
                trigger={(props) => (
                  <IconButton size="sm" aria-label={`Actions for ${item.title}`} {...props}>
                    <Ellipsis className="h-4 w-4" aria-hidden />
                  </IconButton>
                )}
                groups={[
                  {
                    items: [
                      { key: 'edit', label: 'Edit', icon: Pencil, onSelect: () => openEdit(item) },
                      {
                        key: 'complete',
                        label: 'Mark completed',
                        icon: CircleCheck,
                        disabled: item.status === 'completed',
                        onSelect: () => markCompleted(item),
                      },
                    ],
                  },
                  {
                    items: [
                      {
                        key: 'delete',
                        label: 'Delete',
                        icon: Trash2,
                        danger: true,
                        onSelect: () => setDeleteTarget(item),
                      },
                    ],
                  },
                ]}
              />
            </div>
          )
        },
      }),
    ],
    [openEdit, markCompleted],
  )

  const table = useReactTable({
    data: filteredRows,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageIndex: 0, pageSize: 7 } },
  })

  // Jump back to page 1 whenever the visible dataset changes shape.
  useEffect(() => {
    table.setPageIndex(0)
  }, [selectedWeek, search, statusFilter, priorityFilter, table])

  const clearFilters = () => {
    setSearch('')
    setStatusFilter([])
    setPriorityFilter([])
  }

  /* ------------------------------- Render --------------------------- */

  return (
    <section aria-labelledby="weekly-priority-heading">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15, ease: 'easeOut' }}
        className="app-card"
      >
        {/* Header: title + week navigation */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
          <div className="min-w-0">
            <h2 id="weekly-priority-heading" className="text-sm font-semibold text-ink">
              Weekly Priority
            </h2>
            <p className="mt-0.5 text-xs text-sub">
              {weekLabel(selectedWeek)} · {weekRangeLabel(selectedWeek)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <IconButton
              variant="outline"
              aria-label="Previous week"
              onClick={() => setSelectedWeek((w) => shiftWeekKey(w, -1))}
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </IconButton>
            <Select
              aria-label="Select week"
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(e.target.value)}
              className="w-64"
            >
              {weekOptions.map((k) => (
                <option key={k} value={k}>
                  {weekLabel(k)} ({weekRangeLabel(k)})
                </option>
              ))}
            </Select>
            <IconButton
              variant="outline"
              aria-label="Next week"
              onClick={() => setSelectedWeek((w) => shiftWeekKey(w, 1))}
            >
              <ChevronRight className="h-4 w-4" aria-hidden />
            </IconButton>
            <Button variant="primary" onClick={openAdd}>
              <Plus className="h-4 w-4" aria-hidden />
              Add priority
            </Button>
          </div>
        </div>

        {weekRows.length === 0 ? (
          <EmptyState
            icon={CalendarX2}
            title="No priorities planned"
            description={`Nothing is scheduled for ${weekLabel(selectedWeek)} yet. Add the first priority to start planning this week.`}
            actionLabel="Add priority"
            onAction={openAdd}
          />
        ) : (
          <>
            {/* Toolbar: search + filters */}
            <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-2.5">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search website or task…"
                className="w-64"
                aria-label="Search priorities by website or task"
              />
              <FilterDropdown
                label="Status"
                options={STATUS_OPTIONS}
                selected={statusFilter}
                onChange={setStatusFilter}
              />
              <FilterDropdown
                label="Priority"
                options={PRIORITY_OPTIONS}
                selected={priorityFilter}
                onChange={setPriorityFilter}
              />
              <p className="ml-auto text-xs tabular-nums text-sub">
                {filteredRows.length} of {weekRows.length} task{weekRows.length === 1 ? '' : 's'}
              </p>
            </div>

            {filteredRows.length === 0 ? (
              <EmptyState
                icon={SearchX}
                title="No matching priorities"
                description="No tasks match the current search or filters."
                actionLabel="Clear filters"
                onAction={clearFilters}
              />
            ) : (
              <>
                <TableShell>
                  <thead>
                    {table.getHeaderGroups().map((hg) => (
                      <tr key={hg.id} className="border-b border-line bg-elev/40">
                        {hg.headers.map((h) => (
                          <th
                            key={h.id}
                            scope="col"
                            className={cn('th-cell', h.column.id === 'actions' && 'w-12 text-right')}
                          >
                            {h.isPlaceholder
                              ? null
                              : flexRender(h.column.columnDef.header, h.getContext())}
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody>
                    {table.getRowModel().rows.map((row) => (
                      <tr
                        key={row.id}
                        className="border-b border-line/60 transition-colors last:border-0 hover:bg-elev/60"
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td
                            key={cell.id}
                            className={cn('td-cell', cell.column.id === 'actions' && 'w-12')}
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </TableShell>
                <Pagination
                  className="border-t border-line px-3 py-2.5"
                  pageIndex={table.getState().pagination.pageIndex}
                  pageCount={table.getPageCount()}
                  pageSize={table.getState().pagination.pageSize}
                  totalRows={filteredRows.length}
                  onPageChange={(p) => table.setPageIndex(p)}
                  onPageSizeChange={(s) => table.setPageSize(s)}
                  pageSizeOptions={[7, 14, 21, 35]}
                />
              </>
            )}
          </>
        )}
      </motion.div>

      <PriorityFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        editing={editing}
        weekStart={selectedWeek}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        destructive
        title="Delete priority"
        confirmLabel="Delete"
        description={
          deleteTarget
            ? `This will permanently remove "${deleteTarget.title}" from ${weekLabel(deleteTarget.weekStart)}. This action cannot be undone.`
            : undefined
        }
      />
    </section>
  )
}
