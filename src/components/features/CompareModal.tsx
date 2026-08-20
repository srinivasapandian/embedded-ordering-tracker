import { Check, X } from 'lucide-react'
import type { Feature } from '@/types'
import { FEATURE_CATEGORY_LABELS } from '@/types'
import { fmtDate } from '@/utils/date'
import { cn } from '@/utils/cn'
import { Badge } from '@/components/common/Badge'
import { Modal } from '@/components/common/Modal'
import { StatusBadge } from '@/components/common/StatusBadge'

interface CompareModalProps {
  open: boolean
  onClose: () => void
  /** The 2–4 features selected for comparison. */
  features: Feature[]
}

interface CompareRow {
  label: string
  /** Primitive used to detect differences across the compared features. */
  raw: (f: Feature) => string | number | boolean
  render: (f: Feature) => React.ReactNode
}

const ROWS: CompareRow[] = [
  {
    label: 'Category',
    raw: (f) => f.category,
    render: (f) => <Badge tone="slate">{FEATURE_CATEGORY_LABELS[f.category]}</Badge>,
  },
  {
    label: 'Status',
    raw: (f) => f.status,
    render: (f) => <StatusBadge status={f.status} />,
  },
  {
    label: 'Enabled',
    raw: (f) => f.enabled,
    render: (f) =>
      f.enabled ? (
        <span className="inline-flex items-center">
          <Check className="h-4 w-4 text-emerald-500" aria-hidden />
          <span className="sr-only">Enabled</span>
        </span>
      ) : (
        <span className="inline-flex items-center">
          <X className="h-4 w-4 text-red-500" aria-hidden />
          <span className="sr-only">Disabled</span>
        </span>
      ),
  },
  {
    label: 'Last Updated',
    raw: (f) => fmtDate(f.updatedAt),
    render: (f) => <span className="whitespace-nowrap text-sub">{fmtDate(f.updatedAt)}</span>,
  },
  {
    label: 'Supported Clients',
    raw: (f) => f.supportedClientIds.length,
    render: (f) => (
      <span className="font-medium tabular-nums text-ink">
        {f.supportedClientIds.length} {f.supportedClientIds.length === 1 ? 'client' : 'clients'}
      </span>
    ),
  },
]

/** Side-by-side comparison of 2–4 selected features. */
export function CompareModal({ open, onClose, features }: CompareModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title="Compare Features"
      description={`${features.length} features side by side`}
    >
      <div className="overflow-x-auto rounded-lg border border-line">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-line bg-elev/40">
              <th scope="col" className="th-cell sticky left-0 z-10 w-40 min-w-36 border-r border-line bg-card text-left">
                Feature
              </th>
              {features.map((f) => (
                <th key={f.id} scope="col" className="th-cell min-w-44 text-left font-semibold normal-case text-ink">
                  <span className="line-clamp-2 text-xs leading-snug">{f.name}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => {
              const differs = new Set(features.map(row.raw)).size > 1
              return (
                <tr key={row.label} className="border-b border-line/60 last:border-b-0">
                  <th
                    scope="row"
                    className="td-cell sticky left-0 z-10 border-r border-line bg-card text-left text-xs font-medium text-sub"
                  >
                    {differs && <span aria-hidden className="absolute inset-0 bg-amber-500/[0.07]" />}
                    <span className="relative">{row.label}</span>
                  </th>
                  {features.map((f) => (
                    <td key={f.id} className={cn('td-cell', differs && 'bg-amber-500/[0.07]')}>
                      {row.render(f)}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 flex items-center gap-1.5 text-2xs text-faint">
        <span className="h-2.5 w-2.5 shrink-0 rounded-sm bg-amber-500/30 ring-1 ring-inset ring-amber-500/40" aria-hidden />
        Highlighted rows differ across the selected features
      </p>
    </Modal>
  )
}
