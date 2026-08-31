import { ExternalLink } from 'lucide-react'
import type { Client, Migration, Website } from '@/types'
import {
  CAPABILITY_LABELS,
  CAPABILITY_STATE_LABELS,
  CLIENT_STAGE_LABELS,
  ENVIRONMENT_LABELS,
  MIGRATION_STAGE_LABELS,
  QA_SIGNOFF_LABELS,
} from '@/types'
import { fmtDate } from '@/utils/date'
import { cn } from '@/utils/cn'
import { Badge, badgeDotClasses } from '@/components/common/Badge'
import { PriorityBadge } from '@/components/common/PriorityBadge'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Drawer } from '@/components/common/Drawer'
import { Button } from '@/components/common/Button'
import { DisabledHint } from '@/components/admin/adminShared'

const ENV_TONE = { Production: 'emerald', Staging: 'amber', QA: 'sky' } as const
const QA_TONE = { 'signed-off': 'emerald', pending: 'amber', 'not-required': 'slate' } as const
const CAPABILITY_TONE = { enabled: 'emerald', 'in-progress': 'amber', unavailable: 'slate' } as const

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h4 className="text-2xs font-semibold uppercase tracking-wider text-faint">{children}</h4>
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 text-sm">
      <span className="text-sub">{label}</span>
      <span className="min-w-0 truncate font-medium text-ink">{value}</span>
    </div>
  )
}

export function MasterTrackerDrawer({
  open,
  onClose,
  client,
  site,
  migration,
  canEdit,
  denyReason,
  onEdit,
}: {
  open: boolean
  onClose: () => void
  client: Client | null
  site: Website | undefined
  migration: Migration | undefined
  canEdit: boolean
  denyReason: string
  onEdit: () => void
}) {
  const migrationLabel = migration
    ? MIGRATION_STAGE_LABELS[migration.stage]
    : site?.framework === 'nextjs'
      ? 'Completed'
      : 'Not started'

  return (
    <Drawer
      open={open && client !== null}
      onClose={onClose}
      title={client?.name ?? ''}
      description={client?.location}
      size="md"
      footer={
        <DisabledHint when={!canEdit} reason={denyReason}>
          <Button variant="primary" disabled={!canEdit} onClick={onEdit}>
            Edit Client
          </Button>
        </DisabledHint>
      }
    >
      {!client ? null : (
      <div className="space-y-6">
        <section>
          <SectionLabel>Overview</SectionLabel>
          <div className="mt-2 divide-y divide-line/70">
            <Row label="Technology" value={site ? <StatusBadge status={site.framework} /> : '—'} />
            <Row
              label="Environment"
              value={site ? <Badge tone={ENV_TONE[site.environment]}>{ENVIRONMENT_LABELS[site.environment]}</Badge> : '—'}
            />
            <Row label="Ordering" value={site ? <StatusBadge status={site.orderingStatus} /> : '—'} />
            <Row label="Stage" value={CLIENT_STAGE_LABELS[client.stage]} />
            <Row label="Status" value={<StatusBadge status={client.status} />} />
            <Row label="Priority" value={<PriorityBadge priority={client.priority} />} />
          </div>
        </section>

        <section>
          <SectionLabel>Rollout Details</SectionLabel>
          <div className="mt-2 divide-y divide-line/70">
            <Row
              label="QA Sign-off"
              value={site ? <Badge tone={QA_TONE[site.qaSignoff]}>{QA_SIGNOFF_LABELS[site.qaSignoff]}</Badge> : '—'}
            />
            <Row label="Deployed Date" value={site?.deployedDate ? fmtDate(site.deployedDate) : '—'} />
            <Row label="Migration" value={migrationLabel} />
            <Row
              label="Figma Design"
              value={
                site?.figmaLink ? (
                  <a
                    href={site.figmaLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-primary-600 hover:underline dark:text-primary-400"
                  >
                    View Design
                    <ExternalLink className="h-3 w-3" aria-hidden />
                  </a>
                ) : (
                  '—'
                )
              }
            />
            <Row label="Live Link" value={site?.liveUrl || '—'} />
          </div>
        </section>

        <section>
          <SectionLabel>Repository</SectionLabel>
          <div className="mt-2 divide-y divide-line/70">
            <Row label="Repo Name" value={site?.repoName || '—'} />
            <Row label="Dev Latest Branch" value={site?.devLatestBranch || '—'} />
            <Row label="Release Branch" value={site?.releaseBranch || '—'} />
          </div>
        </section>

        <section>
          <SectionLabel>Features</SectionLabel>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {(Object.keys(CAPABILITY_LABELS) as Array<keyof typeof client.capabilities>).map((key) => (
              <span
                key={key}
                className="inline-flex items-center gap-1.5 rounded-full border border-line bg-elev/60 px-2.5 py-1 text-xs font-medium text-ink"
              >
                <span className={cn('h-1.5 w-1.5 rounded-full', badgeDotClasses[CAPABILITY_TONE[client.capabilities[key]]])} aria-hidden />
                {CAPABILITY_LABELS[key]}
                <span className="text-faint">· {CAPABILITY_STATE_LABELS[client.capabilities[key]]}</span>
              </span>
            ))}
          </div>
        </section>
      </div>
      )}
    </Drawer>
  )
}
