import { useMemo } from 'react'
import { MoveRight } from 'lucide-react'
import type { TeamMember } from '@/types'
import { CAPABILITY_LABELS, CAPABILITY_STATE_LABELS, ENVIRONMENT_LABELS, QA_SIGNOFF_LABELS } from '@/types'
import { memberById } from '@/utils/selectors'
import { fmtDate, relativeDay } from '@/utils/date'
import { useClientActivity } from '@/hooks/useClientActivity'
import { cn } from '@/utils/cn'
import { Badge } from '@/components/common/Badge'
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

/** Detail grid rendered when a tracker row is expanded (or shown in a drawer). */
export function ClientExpansionPanel({
  row,
  members,
  className,
}: {
  row: ClientRow
  members: TeamMember[]
  className?: string
}) {
  const { client, site, migration } = row
  const developer = memberById(members, migration?.developerId)
  const openMigration = migration && migration.stage !== 'completed' ? migration : undefined
  const migrationProgress = migration
    ? migration.progress
    : site?.framework === 'nextjs'
      ? 100
      : 0

  const activity = useClientActivity(client.id, 6)
  const activityEntries = useMemo<TimelineEntry[]>(
    () =>
      activity.map((a) => ({
        id: a.id,
        dateLabel: relativeDay(a.date),
        title: a.title,
        description: a.description,
      })),
    [activity],
  )

  return (
    <div className={cn('grid gap-x-8 gap-y-5 border-t border-line bg-elev/40 px-4 py-4 md:grid-cols-2 xl:grid-cols-4', className)}>
      {/* a) Client information */}
      <section aria-label={`Client information for ${client.name}`}>
        <SectionTitle>Client Information</SectionTitle>
        <dl className="mt-2.5 space-y-1.5">
          <InfoRow label="Client" value={client.name} />
          <InfoRow label="Primary website" value={site?.domain ?? '—'} />
          <InfoRow label="Location" value={client.location} />
          <InfoRow label="Phone" value={client.phone || '—'} />
        </dl>
        {client.notes && (
          <p className="mt-2.5 rounded-lg border border-line bg-card px-2.5 py-2 text-xs leading-relaxed text-sub">
            {client.notes}
          </p>
        )}
      </section>

      {/* b) Ordering */}
      <section aria-label={`Ordering status for ${client.name}`}>
        <SectionTitle>Ordering & QA</SectionTitle>
        {site ? (
          <div className="mt-2.5 space-y-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <StatusBadge status={site.orderingStatus} />
              <Badge tone="slate">{ENVIRONMENT_LABELS[site.environment]}</Badge>
            </div>
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
              <InfoRow label="QA sign-off" value={QA_SIGNOFF_LABELS[site.qaSignoff]} />
              <InfoRow label="Live URL" value={site.liveUrl} />
              <InfoRow label="Deployed to live" value={site.deployedDate ? fmtDate(site.deployedDate) : '—'} />
              <InfoRow
                label="Figma design"
                value={
                  site.figmaLink ? (
                    <a
                      href={site.figmaLink}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary-600 underline-offset-2 hover:underline dark:text-primary-400"
                    >
                      View design
                    </a>
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

      {/* c) Migration */}
      <section aria-label={`Migration status for ${client.name}`}>
        <SectionTitle>Migration</SectionTitle>
        {site ? (
          <div className="mt-2.5 space-y-2.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <StatusBadge status={site.framework} />
              <MoveRight className="h-3.5 w-3.5 text-faint" aria-hidden />
              <StatusBadge status={migration?.targetStack ?? 'nextjs'} />
            </div>
            <ProgressBar
              value={migrationProgress}
              size="sm"
              showLabel
              tone={migrationProgress >= 100 ? 'emerald' : 'primary'}
              aria-label={`Migration progress for ${site.name}`}
            />
            <dl className="space-y-1.5">
              {migration && <InfoRow label="Migration quarter" value={migration.quarter} />}
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
              <InfoRow label="Repo name" value={site.repoName || '—'} />
              <InfoRow label="Dev latest branch" value={site.devLatestBranch || '—'} />
              <InfoRow label="Release branch" value={site.releaseBranch || '—'} />
            </dl>
          </div>
        ) : (
          <p className="mt-2.5 text-xs text-faint">No website linked yet.</p>
        )}
      </section>

      {/* d) Features */}
      <section aria-label={`Feature enablement for ${client.name}`}>
        <SectionTitle>Feature Enablement</SectionTitle>
        <dl className="mt-2.5 space-y-1.5">
          {(Object.keys(CAPABILITY_LABELS) as Array<keyof typeof client.capabilities>).map((key) => (
            <InfoRow key={key} label={CAPABILITY_LABELS[key]} value={CAPABILITY_STATE_LABELS[client.capabilities[key]]} />
          ))}
        </dl>
      </section>

      {/* e) Activity */}
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
