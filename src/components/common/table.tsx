import type { Column, Table as TanStackTable } from '@tanstack/react-table'
import { ArrowDown, ArrowUp, ChevronsUpDown, Columns3 } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Button } from './Button'
import { Checkbox } from './Checkbox'
import { Pagination } from './Pagination'
import { Popover } from './Popover'

/* Shared building blocks for TanStack tables. Modules create their own
   useReactTable instance and compose these for consistent styling. */

/** Scroll container + table element with app styling. */
export function TableShell({ children, className, dense = false }: { children: React.ReactNode; className?: string; dense?: boolean }) {
  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className={cn('w-full border-collapse text-left', dense && 'text-xs')}>{children}</table>
    </div>
  )
}

/** Sortable column header button. Wire into TanStack column API. */
export function SortableHeader<TData, TValue>({
  column,
  children,
  className,
}: {
  column: Column<TData, TValue>
  children: React.ReactNode
  className?: string
}) {
  const sorted = column.getIsSorted()
  if (!column.getCanSort()) return <span className={className}>{children}</span>
  return (
    <button
      type="button"
      onClick={column.getToggleSortingHandler()}
      aria-label={`Sort by ${typeof children === 'string' ? children : 'column'}`}
      className={cn(
        'focus-ring -mx-1 inline-flex items-center gap-1 rounded px-1 py-0.5 transition-colors hover:text-ink',
        sorted && 'text-ink',
        className,
      )}
    >
      {children}
      {sorted === 'asc' ? (
        <ArrowUp className="h-3 w-3" aria-hidden />
      ) : sorted === 'desc' ? (
        <ArrowDown className="h-3 w-3" aria-hidden />
      ) : (
        <ChevronsUpDown className="h-3 w-3 opacity-40" aria-hidden />
      )}
    </button>
  )
}

/** Column show/hide menu driven by the table instance. */
export function ColumnToggleMenu<TData>({ table }: { table: TanStackTable<TData> }) {
  const columns = table.getAllLeafColumns().filter((c) => c.getCanHide())
  const allVisible = columns.every((c) => c.getIsVisible())
  const someVisible = columns.some((c) => c.getIsVisible())
  const isIndeterminate = someVisible && !allVisible

  const handleToggleAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked
    columns.forEach((c) => c.toggleVisibility(checked))
  }

  return (
    <Popover
      align="end"
      panelClassName="w-52"
      trigger={(props) => (
        <Button size="sm" variant="outline" {...props}>
          <Columns3 className="h-3.5 w-3.5" aria-hidden />
          Columns
        </Button>
      )}
    >
      <div className="p-1">
        <p className="px-2 pb-1.5 pt-1.5 text-2xs font-semibold uppercase tracking-wide text-faint">Toggle columns</p>
        
        {columns.length > 0 && (
          <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border-b border-line px-2 pb-2 pt-1.5 text-sm font-semibold text-ink transition-colors hover:bg-elev">
            <Checkbox
              checked={allVisible}
              indeterminate={isIndeterminate}
              onChange={handleToggleAll}
            />
            <span>Apply All</span>
          </label>
        )}

        {columns.map((column) => (
          <label
            key={column.id}
            className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-ink transition-colors hover:bg-elev"
          >
            <Checkbox checked={column.getIsVisible()} onChange={column.getToggleVisibilityHandler()} />
            <span className="truncate capitalize">
              {typeof column.columnDef.meta === 'object' && column.columnDef.meta && 'label' in column.columnDef.meta
                ? String((column.columnDef.meta as { label?: string }).label ?? column.id)
                : column.id}
            </span>
          </label>
        ))}
      </div>
    </Popover>
  )
}

/** Pagination footer bound to a TanStack table instance. */
export function DataTablePagination<TData>({ table, className }: { table: TanStackTable<TData>; className?: string }) {
  return (
    <Pagination
      className={className}
      pageIndex={table.getState().pagination.pageIndex}
      pageCount={table.getPageCount()}
      pageSize={table.getState().pagination.pageSize}
      totalRows={table.getFilteredRowModel().rows.length}
      onPageChange={(p) => table.setPageIndex(p)}
      onPageSizeChange={(s) => table.setPageSize(s)}
    />
  )
}
