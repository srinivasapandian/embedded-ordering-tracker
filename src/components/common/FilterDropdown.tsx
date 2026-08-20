import { ChevronDown, X } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Popover } from './Popover'
import { Checkbox } from './Checkbox'

export interface FilterOption {
  value: string
  label: string
  /** Optional adornment rendered before the label (badge dot, avatar…). */
  render?: React.ReactNode
}

interface FilterDropdownProps {
  label: string
  options: FilterOption[]
  selected: string[]
  onChange: (values: string[]) => void
  align?: 'start' | 'end'
  className?: string
}

/** Multi-select filter with a selected-count chip and a clear action. */
export function FilterDropdown({ label, options, selected, onChange, align = 'start', className }: FilterDropdownProps) {
  const toggle = (value: string) => {
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value])
  }

  return (
    <Popover
      align={align}
      panelClassName="max-h-80 w-56 overflow-y-auto"
      trigger={(props) => (
        <button
          type="button"
          {...props}
          className={cn(
            'focus-ring inline-flex h-8 items-center gap-1.5 rounded-lg border border-dashed border-line-strong/80 bg-card px-2.5 text-xs font-medium text-sub transition-colors hover:border-line-strong hover:text-ink',
            selected.length > 0 && 'border-solid border-primary-300 bg-primary-50 text-primary-700 dark:border-primary-800 dark:bg-primary-950/40 dark:text-primary-300',
            className,
          )}
        >
          {label}
          {selected.length > 0 && (
            <span className="rounded-full bg-primary-600 px-1.5 py-px text-2xs font-semibold text-white">
              {selected.length}
            </span>
          )}
          <ChevronDown className="h-3.5 w-3.5 opacity-60" aria-hidden />
        </button>
      )}
    >
      <div className="p-1">
        {options.map((opt) => (
          <label
            key={opt.value}
            className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-ink transition-colors hover:bg-elev"
          >
            <Checkbox checked={selected.includes(opt.value)} onChange={() => toggle(opt.value)} />
            {opt.render}
            <span className="truncate">{opt.label}</span>
          </label>
        ))}
        {selected.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="focus-ring mt-1 flex w-full items-center justify-center gap-1 rounded-lg border-t border-line px-2 py-1.5 text-xs font-medium text-sub hover:text-ink"
          >
            <X className="h-3 w-3" aria-hidden /> Clear filter
          </button>
        )}
      </div>
    </Popover>
  )
}
