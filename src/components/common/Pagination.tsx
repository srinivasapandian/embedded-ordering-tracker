import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { cn } from '@/utils/cn'
import { IconButton } from './Button'
import { Select } from './Select'

interface PaginationProps {
  /** 0-based page index */
  pageIndex: number
  pageCount: number
  pageSize: number
  totalRows: number
  onPageChange: (pageIndex: number) => void
  onPageSizeChange?: (size: number) => void
  pageSizeOptions?: number[]
  className?: string
}

export function Pagination({
  pageIndex,
  pageCount,
  pageSize,
  totalRows,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 30, 50],
  className,
}: PaginationProps) {
  const from = totalRows === 0 ? 0 : pageIndex * pageSize + 1
  const to = Math.min(totalRows, (pageIndex + 1) * pageSize)

  const computedOptions = Array.from(
    new Set(
      pageSizeOptions
        .filter((_, i) => i === 0 || pageSizeOptions[i - 1] < totalRows)
        .map((opt) => Math.min(opt, Math.max(totalRows, pageSizeOptions[0])))
    )
  )
  if (!computedOptions.includes(pageSize)) {
    computedOptions.push(pageSize)
  }
  computedOptions.sort((a, b) => a - b)

  return (
    <nav aria-label="Pagination" className={cn('flex flex-wrap items-center justify-between gap-3 px-1', className)}>
      <p className="text-xs text-sub">
        Showing <span className="font-medium text-ink">{from}</span>–<span className="font-medium text-ink">{to}</span> of{' '}
        <span className="font-medium text-ink">{totalRows}</span>
      </p>
      <div className="flex items-center gap-3">
        {onPageSizeChange && (
          <label className="flex items-center gap-1.5 text-xs text-sub">
            Rows
            <Select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="w-[74px]"
              aria-label="Rows per page"
            >
              {computedOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </label>
        )}
        <div className="flex items-center gap-1">
          <IconButton size="sm" variant="outline" aria-label="First page" disabled={pageIndex === 0} onClick={() => onPageChange(0)}>
            <ChevronsLeft className="h-3.5 w-3.5" aria-hidden />
          </IconButton>
          <IconButton size="sm" variant="outline" aria-label="Previous page" disabled={pageIndex === 0} onClick={() => onPageChange(pageIndex - 1)}>
            <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
          </IconButton>
          <span className="px-2 text-xs tabular-nums text-sub">
            Page <span className="font-medium text-ink">{pageCount === 0 ? 0 : pageIndex + 1}</span> of{' '}
            <span className="font-medium text-ink">{pageCount}</span>
          </span>
          <IconButton
            size="sm"
            variant="outline"
            aria-label="Next page"
            disabled={pageIndex >= pageCount - 1}
            onClick={() => onPageChange(pageIndex + 1)}
          >
            <ChevronRight className="h-3.5 w-3.5" aria-hidden />
          </IconButton>
          <IconButton
            size="sm"
            variant="outline"
            aria-label="Last page"
            disabled={pageIndex >= pageCount - 1}
            onClick={() => onPageChange(pageCount - 1)}
          >
            <ChevronsRight className="h-3.5 w-3.5" aria-hidden />
          </IconButton>
        </div>
      </div>
    </nav>
  )
}
