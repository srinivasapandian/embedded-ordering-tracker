import { useMemo } from 'react'
import { MoveRight } from 'lucide-react'
import type { TeamMember } from '@/types'
import { memberById } from '@/utils/selectors'
import { fmtDate, relativeDay } from '@/utils/date'
import { StatusBadge } from '@/components/common/StatusBadge'
import { ProgressBar } from '@/components/common/ProgressBar'
import { UserAvatar } from '@/components/common/UserAvatar'
import { Timeline, type TimelineEntry } from '@/components/common/Timeline'
import type { ClientRow } from './clientRows'

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="text-2xs font-semibold uppercase tracking-wider text-faint">{children}</h4>
  )
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-xs">
      <dt className="shrink-0 text-faint">{label}</dt>
      <dd className="min-w-0 truncate text-right font-medium text-ink">{value}</dd>
    </div>
  )
}

/** Detail grid rendered when a tracker row is expanded. */
export function ClientExpansionPanel({ row, members }: { row: ClientRow; members: TeamMember[] }) {
  const { client, site, migration } = row
  const developer = memberById(members, migration?.developerId)
  const openMigration = migration && migration.stage !== 'completed' ? migration : undefined
  const migrationProgress = migration
    ? migration.progress
    : site?.framework === 'nextjs'
      ? 100
      : 0

  const activityEntries = useMemo<TimelineEntry[]>(
    () =>
      [...client.activity]
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 6)
        .map((a) => ({
          id: a.id,
          dateLabel: relativeDay(a.date),
          title: a.title,
          description: a.description,
        })),
    [client.activity],
  )

  return (
    <div className="grid gap-x-8 gap-y-5 border-t border-line bg-elev/40 px-4 py-4 md:grid-cols-2 xl:grid-cols-4">
      {/* a) Client information */}
      <section aria-label={`Client information for ${client.name}`}>
        <SectionTitle>Client Information</SectionTitle>
        <dl className="mt-2.5 space-y-1.5">
          <InfoRow label="Client" value={client.name} />
          <InfoRow label="Primary website" value={site?.domain ?? '—'} />
          <InfoRow label="Location" value={client.location} />
          <InfoRow label="Contact" value={client.contactName || '—'} />
          <InfoRow label="Email" value={client.email || '—'} />
        </dl>
        {client.notes && (
          <p className="mt-2.5 rounded-lg border border-line bg-card px-2.5 py-2 text-xs leading-relaxed text-sub">
            {client.notes}
          </p>
        )}
      </section>

      {/* b) Ordering */}
      <section aria-label={`Ordering status for ${client.name}`}>
        <SectionTitle>Ordering</SectionTitle>
        {site ? (
          <div className="mt-2.5 space-y-2">
            <StatusBadge status={site.orderingStatus} />
            <dl className="space-y-1.5 pt-0.5">
              <InfoRow
                label="Start date"
                value={site.orderingStartDate ? fmtDate(site.orderingStartDate) : '—'}
              />
              <InfoRow
                label="Completion date"
                value={site.orderingCompletedDate ? fmtDate(site.orderingCompletedDate) : '—'}
              />
              <InfoRow label="Current stage" value={site.orderingStage} />
            </dl>
          </div>
        ) : (
          <p className="mt-2.5 text-xs text-faint">No website linked yet.</p>
        )}
      </section>

      {/* c) Migration */}
      <section aria-label={`Migration status for ${client.name}`}>
        <SectionTitle>Migration</SectionTitle>
        {site ? (
          <div className="mt-2.5 space-y-2.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <StatusBadge status={site.framework} />
              <MoveRight className="h-3.5 w-3.5 text-faint" aria-hidden />
              <StatusBadge status="nextjs" />
            </div>
            <ProgressBar
              value={migrationProgress}
              size="sm"
              showLabel
              tone={migrationProgress >= 100 ? 'emerald' : 'primary'}
              aria-label={`Migration progress for ${site.name}`}
            />
            <dl className="space-y-1.5">
              <InfoRow
                label="Assigned developer"
                value={
                  developer ? (
                    <span className="inline-flex items-center gap-1.5">
                      <UserAvatar member={developer} size="xs" />
                      {developer.name}
                    </span>
                  ) : openMigration ? (
                    'Unassigned'
                  ) : (
                    '—'
                  )
                }
              />
            </dl>
          </div>
        ) : (
          <p className="mt-2.5 text-xs text-faint">No website linked yet.</p>
        )}
      </section>

      {/* d) Activity */}
      <section aria-label={`Recent activity for ${client.name}`}>
        <SectionTitle>Activity</SectionTitle>
        <div className="mt-2.5">
          {activityEntries.length > 0 ? (
            <Timeline entries={activityEntries} />
          ) : (
            <p className="text-xs text-faint">No activity recorded yet.</p>
          )}
        </div>
      </section>
    </div>
  )
}
