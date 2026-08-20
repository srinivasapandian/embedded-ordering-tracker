import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/utils/cn'

export interface TabItem {
  key: string
  label: string
  icon?: LucideIcon
  count?: number
}

interface TabsProps {
  items: TabItem[]
  active: string
  onChange: (key: string) => void
  variant?: 'underline' | 'pills'
  className?: string
  /** Unique id when multiple Tabs share a page (keeps motion layoutIds separate). */
  layoutId?: string
}

export function Tabs({ items, active, onChange, variant = 'underline', className, layoutId = 'tabs' }: TabsProps) {
  return (
    <div
      role="tablist"
      className={cn(
        'flex items-center gap-1',
        variant === 'underline' && 'border-b border-line',
        variant === 'pills' && 'rounded-lg bg-elev p-0.5',
        className,
      )}
    >
      {items.map((item) => {
        const isActive = item.key === active
        return (
          <button
            key={item.key}
            role="tab"
            type="button"
            aria-selected={isActive}
            onClick={() => onChange(item.key)}
            className={cn(
              'focus-ring relative flex items-center gap-1.5 whitespace-nowrap text-sm font-medium transition-colors',
              variant === 'underline' && 'px-3 pb-2.5 pt-1.5',
              variant === 'underline' && (isActive ? 'text-ink' : 'text-sub hover:text-ink'),
              variant === 'pills' && 'rounded-md px-3 py-1.5',
              variant === 'pills' && (isActive ? 'text-ink' : 'text-sub hover:text-ink'),
            )}
          >
            {variant === 'pills' && isActive && (
              <motion.span
                layoutId={`${layoutId}-pill`}
                className="absolute inset-0 rounded-md bg-card shadow-card ring-1 ring-line"
                transition={{ type: 'spring', stiffness: 500, damping: 40 }}
              />
            )}
            <span className="relative flex items-center gap-1.5">
              {item.icon && <item.icon className="h-4 w-4" aria-hidden />}
              {item.label}
              {item.count !== undefined && (
                <span
                  className={cn(
                    'rounded-full px-1.5 py-px text-2xs font-semibold tabular-nums',
                    isActive ? 'bg-primary-100 text-primary-700 dark:bg-primary-500/20 dark:text-primary-300' : 'bg-elev text-sub',
                  )}
                >
                  {item.count}
                </span>
              )}
            </span>
            {variant === 'underline' && isActive && (
              <motion.span
                layoutId={`${layoutId}-underline`}
                className="absolute inset-x-1 -bottom-px h-0.5 rounded-full bg-primary-600"
                transition={{ type: 'spring', stiffness: 500, damping: 40 }}
              />
            )}
          </button>
        )
      })}
    </div>
  )
}
