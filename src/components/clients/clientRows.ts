import type { Client, Migration, Priority, TeamMember, Website } from '@/types'
import { memberById, migrationForWebsite, primaryWebsite } from '@/utils/selectors'

/* ------------------------------------------------------------------ */
/* Row model + filter helpers shared by the Client Tracker views.      */
/* ------------------------------------------------------------------ */

/** One tracker row: a client joined with its primary website, migration and assignee. */
export interface ClientRow {
  client: Client
  site: Website | undefined
  migration: Migration | undefined
  assignee: TeamMember | undefined
}

export type UpdatedWithin = 'any' | '7' | '30' | '90'

export interface ClientFilters {
  /** Client statuses (multi). */
  status: string[]
  /** Ordering statuses of the primary website (multi). */
  ordering: string[]
  /** Frameworks of the primary website (multi). */
  framework: string[]
  /** Client priorities (multi). */
  priority: string[]
  /** Team member ids, or 'unassigned' (multi). */
  assignee: string[]
  /** Client locations (multi). */
  location: string[]
  /** Rolling window on client.updatedAt. */
  updatedWithin: UpdatedWithin
}

export const EMPTY_FILTERS: ClientFilters = {
  status: [],
  ordering: [],
  framework: [],
  priority: [],
  assignee: [],
  location: [],
  updatedWithin: 'any',
}

export const UPDATED_OPTIONS: Array<{ value: UpdatedWithin; label: string }> = [
  { value: 'any', label: 'Updated: Any time' },
  { value: '7', label: 'Updated: Last 7 days' },
  { value: '30', label: 'Updated: Last 30 days' },
  { value: '90', label: 'Updated: Last 90 days' },
]

/** Sort rank so High sorts above Medium above Low. */
export const PRIORITY_RANK: Record<Priority, number> = { high: 0, medium: 1, low: 2 }

export function buildClientRows(
  clients: Client[],
  websites: Website[],
  migrations: Migration[],
  members: TeamMember[],
): ClientRow[] {
  return clients.map((client) => {
    const site = primaryWebsite(websites, client.id)
    return {
      client,
      site,
      migration: site ? migrationForWebsite(migrations, site.id) : undefined,
      assignee: memberById(members, client.assignedToId),
    }
  })
}

export function rowMatchesSearch(row: ClientRow, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return [
    row.client.name,
    row.client.contactName,
    row.client.email,
    row.client.location,
    row.site?.name ?? '',
    row.site?.domain ?? '',
  ].some((v) => v.toLowerCase().includes(q))
}

export function filterClientRows(rows: ClientRow[], filters: ClientFilters, search: string): ClientRow[] {
  const cutoff =
    filters.updatedWithin === 'any' ? null : Date.now() - Number(filters.updatedWithin) * 86_400_000
  return rows.filter((row) => {
    if (!rowMatchesSearch(row, search)) return false
    if (filters.status.length > 0 && !filters.status.includes(row.client.status)) return false
    if (filters.ordering.length > 0 && (!row.site || !filters.ordering.includes(row.site.orderingStatus)))
      return false
    if (filters.framework.length > 0 && (!row.site || !filters.framework.includes(row.site.framework)))
      return false
    if (filters.priority.length > 0 && !filters.priority.includes(row.client.priority)) return false
    if (filters.assignee.length > 0 && !filters.assignee.includes(row.client.assignedToId ?? 'unassigned'))
      return false
    if (filters.location.length > 0 && !filters.location.includes(row.client.location)) return false
    if (cutoff !== null && new Date(row.client.updatedAt).getTime() < cutoff) return false
    return true
  })
}

export function anyFilterActive(filters: ClientFilters, search: string): boolean {
  return (
    search.trim().length > 0 ||
    filters.status.length > 0 ||
    filters.ordering.length > 0 ||
    filters.framework.length > 0 ||
    filters.priority.length > 0 ||
    filters.assignee.length > 0 ||
    filters.location.length > 0 ||
    filters.updatedWithin !== 'any'
  )
}

/* ------------------------------------------------------------------ */
/* Domain helpers (client form)                                        */
/* ------------------------------------------------------------------ */

/** Lowercase and strip protocol + trailing slashes: 'https://Foo.com/' → 'foo.com'. */
export function normalizeDomain(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/+$/, '')
}

export const DOMAIN_RE = /^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}$/
