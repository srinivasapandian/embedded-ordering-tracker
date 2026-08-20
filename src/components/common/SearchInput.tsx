import { Search, X } from 'lucide-react'
import { cn } from '@/utils/cn'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  autoFocus?: boolean
  'aria-label'?: string
}

export function SearchInput({ value, onChange, placeholder = 'Search…', className, autoFocus, ...aria }: SearchInputProps) {
  return (
    <div className={cn('relative', className)}>
      <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" aria-hidden />
      <input
        type="text"
        role="searchbox"
        aria-label={aria['aria-label'] ?? placeholder}
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="focus-ring h-8 w-full rounded-lg border border-line-strong/70 bg-card pl-8 pr-7 text-sm text-ink placeholder:text-faint transition-colors hover:border-line-strong"
      />
      {value && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => onChange('')}
          className="focus-ring absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-faint hover:text-ink"
        >
          <X className="h-3.5 w-3.5" aria-hidden />
        </button>
      )}
    </div>
  )
}
