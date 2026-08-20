import { Bell, Check } from 'lucide-react'
import { cn } from '@/utils/cn'
import { useAppStore } from '@/store/appStore'
import { timeAgo } from '@/utils/date'
import { Popover } from '@/components/common/Popover'
import { EmptyState } from '@/components/common/EmptyState'

const kindDot: Record<string, string> = {
  info: 'bg-sky-500',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
}

export function NotificationsPopover() {
  const notifications = useAppStore((s) => s.notifications)
  const markNotificationRead = useAppStore((s) => s.markNotificationRead)
  const markAllNotificationsRead = useAppStore((s) => s.markAllNotificationsRead)
  const unread = notifications.filter((n) => !n.read).length

  return (
    <Popover
      align="end"
      panelClassName="w-[380px] p-0"
      trigger={(props) => (
        <button
          type="button"
          {...props}
          aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ''}`}
          className="focus-ring relative flex h-9 w-9 items-center justify-center rounded-lg text-sub transition-colors hover:bg-elev hover:text-ink"
        >
          <Bell className="h-[18px] w-[18px]" aria-hidden />
          {unread > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-2 w-2" aria-hidden>
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary-500" />
            </span>
          )}
        </button>
      )}
    >
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <h3 className="text-sm font-semibold text-ink">Notifications</h3>
        {unread > 0 && (
          <button
            type="button"
            onClick={markAllNotificationsRead}
            className="focus-ring flex items-center gap-1 rounded text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
          >
            <Check className="h-3 w-3" aria-hidden /> Mark all read
          </button>
        )}
      </div>
      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <EmptyState icon={Bell} title="All caught up" description="No notifications right now." className="py-10" />
        ) : (
          <ul>
            {notifications.map((n) => (
              <li key={n.id} className="border-b border-line/60 last:border-0">
                <button
                  type="button"
                  onClick={() => markNotificationRead(n.id)}
                  className={cn(
                    'focus-ring flex w-full items-start gap-2.5 px-4 py-3 text-left transition-colors hover:bg-elev',
                    !n.read && 'bg-primary-50/50 dark:bg-primary-500/5',
                  )}
                >
                  <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', kindDot[n.kind])} aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className={cn('block text-sm leading-snug text-ink', !n.read && 'font-semibold')}>{n.title}</span>
                    <span className="mt-0.5 block text-xs leading-snug text-sub">{n.description}</span>
                    <span className="mt-1 block text-2xs text-faint">{timeAgo(n.timestamp)}</span>
                  </span>
                  {!n.read && <span className="sr-only">(unread)</span>}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Popover>
  )
}
