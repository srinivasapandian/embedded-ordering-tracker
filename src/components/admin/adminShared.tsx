import { useEffect } from 'react'
import { flexRender, type ColumnDef, type Table as TanStackTable } from '@tanstack/react-table'
import { AnimatePresence, motion } from 'framer-motion'
import { X, type LucideIcon } from 'lucide-react'
import type { AuditLog, FeatureCategory, TeamMember } from '@/types'
import { ROLE_LABELS } from '@/types'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/utils/cn'
import type { BadgeTone } from '@/components/common/Badge'
import { Button, IconButton } from '@/components/common/Button'
import { Checkbox } from '@/components/common/Checkbox'
import { Pagination } from '@/components/common/Pagination'
import { Tooltip } from '@/components/common/Tooltip'
import { DataTablePagination, TableShell } from '@/components/common/table'

/* ------------------------------------------------------------------ */
/* Permission helpers                                                  */
/* ------------------------------------------------------------------ */

/** Permission helpers shared across every Admin manager — backed by the real signed-in user's role. */
export function usePerms() {
  const { profile, can } = useAuth()
  const actingRole = profile?.role ?? 'viewer'
  const denyReason = `Not available for ${ROLE_LABELS[actingRole]}`
  return { actingRole, can, denyReason }
}

/**
 * Wraps a disabled control in a Tooltip explaining why it is unavailable.
 * The span wrapper is focusable so keyboard users can reach the hint too.
 */
export function DisabledHint({
  when,
  reason,
  children,
  block = false,
}: {
  when: boolean
  reason: string
  children: React.ReactElement
  block?: boolean
}) {
  if (!when) return children
  return (
    <Tooltip content={reason}>
      <span tabIndex={0} className={cn('focus-ring rounded-lg', block ? 'flex' : 'inline-flex', 'cursor-not-allowed')}>
        {children}
      </span>
    </Tooltip>
  )
}

/* ------------------------------------------------------------------ */
/* Table building blocks                                               */
/* ------------------------------------------------------------------ */

/** Leading checkbox column for multi-select tables. */
export function selectionColumn<T>(): ColumnDef<T> {
  return {
    id: 'select',
    size: 36,
    enableSorting: false,
    enableHiding: false,
    header: ({ table }) => (
      <Checkbox
        aria-label="Select all rows on this page"
        checked={table.getIsAllPageRowsSelected()}
        indeterminate={table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected()}
        onChange={table.getToggleAllPageRowsSelectedHandler()}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        aria-label="Select row"
        checked={row.getIsSelected()}
        onChange={row.getToggleSelectedHandler()}
      />
    ),
  }
}

interface AdminDataTableProps<T> {
  table: TanStackTable<T>
  /** Rendered when zero rows survive filtering. */
  empty: React.ReactNode
  /** Extra classes per row (e.g. audit highlight flash). */
  rowClassName?: (row: T) => string | undefined
  /** Override the page-size options (default 10/20/30/50). */
  pageSizeOptions?: number[]
  /** Pins the header row to the top of the table's scroll container. */
  stickyHeader?: boolean
}

/** Standard Admin table body: th/td cells, hover rows, pagination footer. */
export function AdminDataTable<T>({ table, empty, rowClassName, pageSizeOptions, stickyHeader }: AdminDataTableProps<T>) {
  const rows = table.getRowModel().rows
  const pageIndex = table.getState().pagination.pageIndex
  const pageCount = table.getPageCount()

  // autoResetPageIndex is off — clamp manually when filters shrink the data.
  useEffect(() => {
    if (pageCount > 0 && pageIndex > pageCount - 1) table.setPageIndex(pageCount - 1)
  }, [pageIndex, pageCount, table])

  return (
    <>
      <TableShell>
        <thead>
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id} className={cn('border-b border-line bg-elev/40', stickyHeader && 'sticky top-0 z-10 backdrop-blur')}>
              {hg.headers.map((header, i) => {
                const size = header.column.columnDef.size
                return (
                  <th
                    key={header.id}
                    className={cn(
                      'th-cell whitespace-nowrap',
                      i === 0 && 'sticky left-0 z-20 border-r border-line bg-elev',
                    )}
                    style={size !== undefined && size !== 150 ? { width: size } : undefined}
                  >
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                )
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className={cn(
                'border-b border-line/60 transition-colors hover:bg-elev/60',
                row.getIsSelected() && 'bg-primary-50/60 dark:bg-primary-500/5',
                rowClassName?.(row.original),
              )}
            >
              {row.getVisibleCells().map((cell, i) => (
                <td
                  key={cell.id}
                  className={cn('td-cell', i === 0 && 'sticky left-0 z-10 border-r border-line bg-card')}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </TableShell>
      {rows.length === 0 ? (
        empty
      ) : (
        <div className="px-3 py-2.5">
          {pageSizeOptions ? (
            <Pagination
              pageIndex={pageIndex}
              pageCount={pageCount}
              pageSize={table.getState().pagination.pageSize}
              totalRows={table.getFilteredRowModel().rows.length}
              onPageChange={(p) => table.setPageIndex(p)}
              onPageSizeChange={(s) => table.setPageSize(s)}
              pageSizeOptions={pageSizeOptions}
            />
          ) : (
            <DataTablePagination table={table} />
          )}
        </div>
      )}
    </>
  )
}

/** Toolbar row above each Admin table. */
export function AdminToolbar({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap items-center gap-2 border-b border-line px-3 py-2.5">{children}</div>
}

/** Sliding bulk-action bar shown while rows are selected. */
export function BulkBar({
  count,
  onClear,
  children,
}: {
  count: number
  onClear: () => void
  children: React.ReactNode
}) {
  return (
    <AnimatePresence initial={false}>
      {count > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="overflow-hidden border-b border-line bg-primary-50/70 dark:bg-primary-500/10"
        >
          <div className="flex flex-wrap items-center gap-2 px-3 py-2">
            <span className="text-xs font-semibold text-primary-700 dark:text-primary-300">
              {count} selected
            </span>
            <span className="h-4 w-px bg-line-strong/60" aria-hidden />
            {children}
            <Button size="xs" variant="ghost" className="ml-auto" onClick={onClear}>
              <X className="h-3 w-3" aria-hidden />
              Clear
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/** Icon row action with a tooltip (or a disabled-reason tooltip when gated). */
export function RowActionButton({
  label,
  icon: Icon,
  onClick,
  disabled,
  disabledReason,
  danger = false,
}: {
  label: string
  icon: LucideIcon
  onClick: () => void
  disabled?: boolean
  disabledReason?: string
  danger?: boolean
}) {
  const btn = (
    <IconButton
      size="sm"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(danger && 'text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10')}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
    </IconButton>
  )
  if (disabled && disabledReason) {
    return (
      <DisabledHint when reason={disabledReason}>
        {btn}
      </DisabledHint>
    )
  }
  return <Tooltip content={label}>{btn}</Tooltip>
}

/* ------------------------------------------------------------------ */
/* Shared display maps                                                 */
/* ------------------------------------------------------------------ */

export const MODULE_TONES: Record<AuditLog['module'], BadgeTone> = {
  Clients: 'indigo',
  Websites: 'sky',
  Features: 'violet',
  Migration: 'amber',
  Priorities: 'emerald',
  Team: 'rose',
  System: 'slate',
}

export const CATEGORY_TONES: Record<FeatureCategory, BadgeTone> = {
  ordering: 'indigo',
  reservation: 'violet',
  seo: 'emerald',
  analytics: 'sky',
  marketing: 'rose',
  uiux: 'amber',
  infrastructure: 'slate',
}

/** Avatar color palette offered by the Team Member modals. */
export const AVATAR_COLORS: Array<{ value: string; label: string }> = [
  { value: 'bg-indigo-500', label: 'Indigo' },
  { value: 'bg-violet-500', label: 'Violet' },
  { value: 'bg-sky-500', label: 'Sky' },
  { value: 'bg-emerald-500', label: 'Emerald' },
  { value: 'bg-teal-500', label: 'Teal' },
  { value: 'bg-amber-500', label: 'Amber' },
  { value: 'bg-orange-500', label: 'Orange' },
  { value: 'bg-rose-500', label: 'Rose' },
  { value: 'bg-fuchsia-500', label: 'Fuchsia' },
  { value: 'bg-cyan-500', label: 'Cyan' },
]

/** Accessible swatch picker for the ~10 avatar colors. */
export function ColorSwatchPicker({
  value,
  onChange,
  label = 'Avatar color',
}: {
  value: string
  onChange: (color: string) => void
  label?: string
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap items-center gap-1.5">
      {AVATAR_COLORS.map((c) => {
        const selected = c.value === value
        return (
          <Tooltip key={c.value} content={c.label}>
            <button
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={c.label}
              onClick={() => onChange(c.value)}
              className={cn(
                'focus-ring h-6 w-6 rounded-full transition-transform hover:scale-110',
                c.value,
                selected && 'ring-2 ring-primary-500 ring-offset-2 ring-offset-card',
              )}
            />
          </Tooltip>
        )
      })}
    </div>
  )
}

/** Member select options with a leading Unassigned entry. */
export function memberOptions(members: TeamMember[], includeUnassigned = true) {
  const opts = members.filter((m) => m.active).map((m) => ({ value: m.id, label: m.name }))
  return includeUnassigned ? [{ value: '', label: 'Unassigned' }, ...opts] : opts
}
