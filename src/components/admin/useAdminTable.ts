import { useMemo, useState } from 'react'
import {
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type RowSelectionState,
  type SortingState,
  type VisibilityState,
} from '@tanstack/react-table'

interface UseAdminTableOptions<T> {
  data: T[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: ColumnDef<T, any>[]
  getRowId: (row: T) => string
  initialSorting?: SortingState
  pageSize?: number
  enableSelection?: boolean
}

/**
 * Shared TanStack config for every Admin Panel table:
 * sorting + pagination + row selection + column visibility.
 * Data is pre-filtered by the caller (search/filters) with useMemo.
 */
export function useAdminTable<T>({
  data,
  columns,
  getRowId,
  initialSorting = [],
  pageSize = 10,
  enableSelection = true,
}: UseAdminTableOptions<T>) {
  const [sorting, setSorting] = useState<SortingState>(initialSorting)
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})

  const table = useReactTable({
    data,
    columns,
    state: { sorting, rowSelection, columnVisibility },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    getRowId,
    enableRowSelection: enableSelection,
    // Keep the current page stable across inline edits; AdminDataTable clamps
    // the index whenever filtering shrinks the page count.
    autoResetPageIndex: false,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageIndex: 0, pageSize } },
  })

  const selectedIds = useMemo(
    () => Object.keys(rowSelection).filter((k) => rowSelection[k]),
    [rowSelection],
  )

  return { table, selectedIds, clearSelection: () => setRowSelection({}) }
}
