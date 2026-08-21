import { useMemo } from 'react'
import { Circle, Minus, SearchX } from 'lucide-react'
import { EmptyState } from '@/components/common/EmptyState'
import { CAPABILITIES, useFeatureRows, type CapabilityState } from './useFeatureRows'

export function StateIcon({ state }: { state: CapabilityState }) {
  if (state === 'enabled') {
    return (
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
        <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 8.5l3 3 7-7" />
        </svg>
      </span>
    )
  }
  if (state === 'in-progress') {
    return (
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400">
        <Circle className="h-2.5 w-2.5" fill="currentColor" aria-hidden />
      </span>
    )
  }
  return (
    <span className="inline-flex h-5 w-5 items-center justify-center text-faint">
      <Minus className="h-3.5 w-3.5" aria-hidden />
    </span>
  )
}

interface FeatureMatrixProps {
  search?: string
}

/** Client x capability rollout matrix for the four tracked features. */
export function FeatureMatrix({ search = '' }: FeatureMatrixProps) {
  const rows = useFeatureRows()

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((r) => r.clientName.toLowerCase().includes(q) || r.location.toLowerCase().includes(q))
  }, [rows, search])

  return (
    <div className="app-card overflow-hidden">
      {filtered.length === 0 ? (
        <EmptyState icon={SearchX} title="No clients match your search" description="Try a different client name or location." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <thead>
              <tr className="sticky top-0 z-10 border-b border-line bg-elev/40 backdrop-blur">
                <th className="th-cell sticky left-0 z-20 bg-elev/95 backdrop-blur">Client</th>
                {CAPABILITIES.map((c) => (
                  <th key={c} className="th-cell text-center">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.clientId} className="border-b border-line/60 transition-colors last:border-0 hover:bg-elev/60">
                  <td className="td-cell sticky left-0 z-10 min-w-[180px] bg-card">
                    <p className="truncate text-sm font-medium text-ink">{row.clientName}</p>
                    <p className="truncate text-xs text-sub">{row.location}</p>
                  </td>
                  {CAPABILITIES.map((c) => (
                    <td key={c} className="td-cell text-center">
                      <StateIcon state={row.states[c]} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line px-4 py-2.5 text-xs text-sub">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-1.5">
            <StateIcon state="enabled" /> Enabled
          </span>
          <span className="flex items-center gap-1.5">
            <StateIcon state="in-progress" /> In Progress
          </span>
          <span className="flex items-center gap-1.5">
            <StateIcon state="unavailable" /> Not Available
          </span>
        </div>
        <span className="tabular-nums text-faint">{filtered.length} of {rows.length} clients</span>
      </div>
    </div>
  )
}
