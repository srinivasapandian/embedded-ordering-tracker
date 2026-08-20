import { forwardRef } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/utils/cn'

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean
}

/** Styled native select — reliable keyboard/screen-reader behavior for free. */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, invalid, children, ...rest },
  ref,
) {
  return (
    <div className={cn('relative', className)}>
      <select
        ref={ref}
        className={cn(
          'focus-ring h-9 w-full cursor-pointer appearance-none rounded-lg border border-line-strong/70 bg-card pl-3 pr-8 text-sm text-ink transition-colors',
          'hover:border-line-strong disabled:cursor-not-allowed disabled:opacity-60',
          invalid && 'border-red-500 focus-visible:ring-red-500',
        )}
        aria-invalid={invalid || undefined}
        {...rest}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-faint"
        aria-hidden
      />
    </div>
  )
})
