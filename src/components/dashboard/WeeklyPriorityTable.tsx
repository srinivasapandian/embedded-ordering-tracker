import { useEffect, useMemo, useState } from 'react'
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
import { CalendarX2, ChevronLeft, ChevronRight, SearchX } from 'lucide-react'
import { Badge } from '@/components/common/Badge'
import { IconButton } from '@/components/common/Button'
import { EmptyState } from '@/components/common/EmptyState'
import { FilterDropdown, type FilterOption } from '@/components/common/FilterDropdown'
import { Pagination } from '@/components/common/Pagination'
import { PriorityBadge } from '@/components/common/PriorityBadge'
import { SearchInput } from '@/components/common/SearchInput'
import { Select } from '@/components/common/Select'
import { StatusBadge } from '@/components/common/StatusBadge'
import { SortableHeader, TableShell } from '@/components/common/table'
import { useAppStore } from '@/store/appStore'
import {
  PRIORITY_ITEM_STATUS_LABELS,
  PRIORITY_LABELS,
  type Priority,
  type PriorityItem,
  type PriorityItemStatus,
  type TeamMember,
} from '@/types'
import { cn } from '@/utils/cn'
import { fmtDate, isOverdue, shiftWeekKey, weekKeyOf, weekLabel, weekRangeLabel } from '@/utils/date'

/* ------------------------------------------------------------------ */
/* Row shape + sort orders                                             */
/* ------------------------------------------------------------------ */

interface PriorityRow extends PriorityItem {
  websiteName: string
  member: TeamMember | undefined
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
  review: 'bg-slate-400',
  completed: 'bg-emerald-500',
}

const PRIORITY_DOTS: Record<Priority, string> = {
  high: 'bg-red-500',
  medium: 'bg-amber-500',
  low: 'bg-slate-400',
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
/* Component — read-only; manage priorities from the Admin Panel.      */
/* ------------------------------------------------------------------ */

export function WeeklyPriorityTable() {
  const priorities = useAppStore((s) => s.priorities)
  const websites = useAppStore((s) => s.websites)
  const teamMembers = useAppStore((s) => s.teamMembers)

  const [selectedWeek, setSelectedWeek] = useState(() => weekKeyOf())
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const [priorityFilter, setPriorityFilter] = useState<string[]>([])
  const [sorting, setSorting] = useState<SortingState>([])

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
          member: teamMembers.find((tm) => tm.id === p.assignedToId),
        })),
    [priorities, websites, teamMembers, selectedWeek],
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
    ],
    [],
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
          </div>
        </div>

        {weekRows.length === 0 ? (
          <EmptyState
            icon={CalendarX2}
            title="No priorities planned"
            description={`Nothing is scheduled for ${weekLabel(selectedWeek)} yet — add tasks from the Admin Panel's Priorities tab.`}
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
                          <th key={h.id} scope="col" className="th-cell">
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
                          <td key={cell.id} className="td-cell">
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
    </section>
  )
}
