import { useMemo } from 'react'
import { ChevronDown, FilterX, RotateCw } from 'lucide-react'
import type { ClientStatus, OrderingStatus, TeamMember } from '@/types'
import {
  CLIENT_STATUS_LABELS,
  FRAMEWORK_LABELS,
  ORDERING_STATUS_LABELS,
  PRIORITY_LABELS,
} from '@/types'
import { cn } from '@/utils/cn'
import { Button } from '@/components/common/Button'
import { SearchInput } from '@/components/common/SearchInput'
import { FilterDropdown, type FilterOption } from '@/components/common/FilterDropdown'
import { UserAvatar } from '@/components/common/UserAvatar'
import { UPDATED_OPTIONS, type ClientFilters, type UpdatedWithin } from './clientRows'

const STATUS_DOT: Record<ClientStatus, string> = {
  active: 'bg-emerald-500',
  'in-progress': 'bg-amber-500',
  completed: 'bg-emerald-500',
  blocked: 'bg-red-500',
}

const ORDERING_DOT: Record<OrderingStatus, string> = {
  active: 'bg-emerald-500',
  'in-progress': 'bg-amber-500',
  'no-need': 'bg-slate-400',
  'not-started': 'bg-red-500',
}

const PRIORITY_DOT: Record<string, string> = {
  high: 'bg-red-500',
  medium: 'bg-amber-500',
  low: 'bg-sky-500',
}

function Dot({ className }: { className: string }) {
  return <span className={cn('h-2 w-2 shrink-0 rounded-full', className)} aria-hidden />
}

interface ClientsToolbarProps {
  search: string
  onSearchChange: (value: string) => void
  filters: ClientFilters
  onFiltersChange: (next: ClientFilters) => void
  members: TeamMember[]
  locations: string[]
  anyActive: boolean
  onClearAll: () => void
  onRefresh: () => void
  /** Timeline view: only search + status filter. */
  compact?: boolean
}

/** Filter cluster shared by the table and timeline views (state lives at page level). */
export function ClientsToolbar({
  search,
  onSearchChange,
  filters,
  onFiltersChange,
  members,
  locations,
  anyActive,
  onClearAll,
  onRefresh,
  compact = false,
}: ClientsToolbarProps) {
  const patch = (p: Partial<ClientFilters>) => onFiltersChange({ ...filters, ...p })

  const statusOptions = useMemo<FilterOption[]>(
    () =>
      (Object.keys(CLIENT_STATUS_LABELS) as ClientStatus[]).map((s) => ({
        value: s,
        label: CLIENT_STATUS_LABELS[s],
        render: <Dot className={STATUS_DOT[s]} />,
      })),
    [],
  )

  const orderingOptions = useMemo<FilterOption[]>(
    () =>
      (Object.keys(ORDERING_STATUS_LABELS) as OrderingStatus[]).map((s) => ({
        value: s,
        label: ORDERING_STATUS_LABELS[s],
        render: <Dot className={ORDERING_DOT[s]} />,
      })),
    [],
  )

  const frameworkOptions = useMemo<FilterOption[]>(
    () => [
      { value: 'react', label: FRAMEWORK_LABELS.react, render: <Dot className="bg-sky-500" /> },
      { value: 'nextjs', label: FRAMEWORK_LABELS.nextjs, render: <Dot className="bg-slate-500" /> },
    ],
    [],
  )

  const priorityOptions = useMemo<FilterOption[]>(
    () =>
      Object.entries(PRIORITY_LABELS).map(([value, label]) => ({
        value,
        label,
        render: <Dot className={PRIORITY_DOT[value] ?? 'bg-slate-400'} />,
      })),
    [],
  )

  const assigneeOptions = useMemo<FilterOption[]>(
    () => [
      { value: 'unassigned', label: 'Unassigned', render: <UserAvatar size="xs" /> },
      ...members.map((m) => ({
        value: m.id,
        label: m.name,
        render: <UserAvatar member={m} size="xs" />,
      })),
    ],
    [members],
  )

  const locationOptions = useMemo<FilterOption[]>(
    () => locations.map((l) => ({ value: l, label: l })),
    [locations],
  )

  return (
    <>
      <SearchInput
        value={search}
        onChange={onSearchChange}
        placeholder="Search clients..."
        aria-label="Search clients"
        className="w-full sm:w-52 xl:w-64"
      />

      <FilterDropdown label="Status" options={statusOptions} selected={filters.status} onChange={(v) => patch({ status: v })} />

      {!compact && (
        <>
          <FilterDropdown label="Ordering" options={orderingOptions} selected={filters.ordering} onChange={(v) => patch({ ordering: v })} />
          <FilterDropdown label="Migration" options={frameworkOptions} selected={filters.framework} onChange={(v) => patch({ framework: v })} />
          <FilterDropdown label="Priority" options={priorityOptions} selected={filters.priority} onChange={(v) => patch({ priority: v })} />
          <FilterDropdown label="Assigned To" options={assigneeOptions} selected={filters.assignee} onChange={(v) => patch({ assignee: v })} />
          <FilterDropdown label="Location" options={locationOptions} selected={filters.location} onChange={(v) => patch({ location: v })} />

          <div className="relative">
            <label htmlFor="clients-updated-filter" className="sr-only">
              Filter by last updated
            </label>
            <select
              id="clients-updated-filter"
              value={filters.updatedWithin}
              onChange={(e) => patch({ updatedWithin: e.target.value as UpdatedWithin })}
              className={cn(
                'focus-ring h-8 cursor-pointer appearance-none rounded-lg border bg-card pl-2.5 pr-7 text-xs font-medium transition-colors',
                filters.updatedWithin !== 'any'
                  ? 'border-solid border-primary-300 bg-primary-50 text-primary-700 dark:border-primary-800 dark:bg-primary-950/40 dark:text-primary-300'
                  : 'border-dashed border-line-strong/80 text-sub hover:border-line-strong hover:text-ink',
              )}
            >
              {UPDATED_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-faint"
              aria-hidden
            />
          </div>
        </>
      )}

      {anyActive && (
        <Button size="sm" variant="ghost" onClick={onClearAll}>
          <FilterX className="h-3.5 w-3.5" aria-hidden />
          Clear filters
        </Button>
      )}

      <Button size="sm" variant="ghost" onClick={onRefresh} aria-label="Refresh client data">
        <RotateCw className="h-3.5 w-3.5" aria-hidden />
        Refresh
      </Button>
    </>
  )
}
