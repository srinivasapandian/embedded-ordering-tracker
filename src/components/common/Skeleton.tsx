import { cn } from '@/utils/cn'

/** Shimmering placeholder block. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn('relative overflow-hidden rounded-md bg-elev', className)}
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_infinite] bg-gradient-to-r from-transparent via-line/60 to-transparent" />
    </div>
  )
}

/** Card-shaped skeleton for metric cards. */
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('app-card space-y-3 p-4', className)}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-9 rounded-lg" />
        <Skeleton className="h-4 w-12" />
      </div>
      <Skeleton className="h-7 w-20" />
      <Skeleton className="h-3 w-28" />
      <Skeleton className="h-1.5 w-full" />
    </div>
  )
}

/** Table-shaped skeleton. */
export function SkeletonTable({ rows = 6, cols = 5, className }: { rows?: number; cols?: number; className?: string }) {
  return (
    <div className={cn('space-y-0', className)} aria-hidden>
      <div className="flex gap-4 border-b border-line px-4 py-3">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3.5 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4 border-b border-line/60 px-4 py-3.5">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className={cn('h-4 flex-1', c === 0 && 'max-w-40')} />
          ))}
        </div>
      ))}
    </div>
  )
}

/** Chart-shaped skeleton. */
export function SkeletonChart({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center', className)} aria-hidden>
      <Skeleton className="h-40 w-40 rounded-full" />
    </div>
  )
}
