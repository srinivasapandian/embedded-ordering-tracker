import { AlertTriangle, RotateCw } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Button } from './Button'

interface ErrorStateProps {
  title?: string
  description?: string
  onRetry?: () => void
  className?: string
}

export function ErrorState({
  title = 'Unable to load data',
  description = 'Something went wrong. Please try again.',
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div role="alert" className={cn('flex flex-col items-center justify-center px-6 py-14 text-center', className)}>
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-500/15">
        <AlertTriangle className="h-6 w-6 text-red-500" aria-hidden />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-ink">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-sub">{description}</p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          <RotateCw className="h-3.5 w-3.5" aria-hidden />
          Try again
        </Button>
      )}
    </div>
  )
}
