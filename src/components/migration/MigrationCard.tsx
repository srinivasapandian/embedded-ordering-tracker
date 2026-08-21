import { Calendar } from 'lucide-react'
import type { Client, Migration, TeamMember, Website } from '@/types'
import { fmtDate, isOverdue, timeAgo } from '@/utils/date'
import { cn } from '@/utils/cn'
import { PriorityBadge } from '@/components/common/PriorityBadge'
import { ProgressBar } from '@/components/common/ProgressBar'
import { UserAvatar } from '@/components/common/UserAvatar'
import { STAGE_META } from './stageMeta'

export interface MigrationCardData {
  migration: Migration
  website: Website | undefined
  client: Client | undefined
  developer: TeamMember | undefined
}

/** Pure, read-only card content — the standalone Migration page's board is view-only; editing happens in the Admin Panel. */
export function MigrationCardBody({ migration, website, client, developer }: MigrationCardData) {
  const meta = STAGE_META[migration.stage]
  const overdue = isOverdue(migration.dueDate) && migration.stage !== 'completed'
  const siteName = website?.name ?? 'Unknown website'

  return (
    <>
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold leading-tight text-ink">{siteName}</p>
          <p className="truncate text-2xs text-faint">{website?.domain ?? '—'}</p>
        </div>
      </div>

      <p className="mt-1 truncate text-xs text-sub">{client?.name ?? 'Unknown client'}</p>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <UserAvatar member={developer ?? null} size="xs" tooltip />
        <PriorityBadge priority={migration.priority} />
        <span
          className={cn(
            'inline-flex items-center gap-1 whitespace-nowrap rounded-md bg-elev px-1.5 py-0.5 text-2xs font-medium text-sub',
            overdue && 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400',
          )}
        >
          <Calendar className="h-3 w-3 shrink-0" aria-hidden />
          {fmtDate(migration.dueDate)}
          {overdue && <span className="sr-only">, overdue</span>}
        </span>
      </div>

      <ProgressBar
        value={migration.progress}
        tone={meta.bar}
        size="xs"
        showLabel
        className="mt-2.5"
        aria-label={`${siteName} migration progress`}
      />

      <p className="mt-1.5 text-2xs text-faint">Updated {timeAgo(migration.updatedAt)}</p>
    </>
  )
}
