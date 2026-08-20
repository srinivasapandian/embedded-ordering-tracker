import type { LucideIcon } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Popover } from './Popover'

export interface MenuItem {
  key: string
  label: string
  icon?: LucideIcon
  danger?: boolean
  disabled?: boolean
  onSelect: () => void
}

export interface MenuGroup {
  items: MenuItem[]
}

interface DropdownMenuProps {
  trigger: (props: {
    ref: React.RefObject<HTMLButtonElement | null>
    onClick: () => void
    'aria-expanded': boolean
    'aria-haspopup': true
    'aria-controls': string
  }) => React.ReactNode
  groups: MenuGroup[]
  align?: 'start' | 'end'
}

/** Action menu (row actions, bulk actions, profile menu). */
export function DropdownMenu({ trigger, groups, align = 'end' }: DropdownMenuProps) {
  return (
    <Popover trigger={trigger} align={align} panelClassName="py-1">
      {(close) => (
        <div role="menu">
          {groups.map((group, gi) => (
            <div key={gi} role="group" className={cn(gi > 0 && 'mt-1 border-t border-line pt-1')}>
              {group.items.map((item) => (
                <button
                  key={item.key}
                  role="menuitem"
                  type="button"
                  disabled={item.disabled}
                  onClick={() => {
                    close()
                    item.onSelect()
                  }}
                  className={cn(
                    'focus-ring flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors',
                    item.danger
                      ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10'
                      : 'text-ink hover:bg-elev',
                    item.disabled && 'cursor-not-allowed opacity-50 hover:bg-transparent',
                  )}
                >
                  {item.icon && <item.icon className="h-4 w-4 shrink-0 opacity-70" aria-hidden />}
                  {item.label}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </Popover>
  )
}
