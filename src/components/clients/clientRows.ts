import type { Client, Migration, Website } from '@/types'
import { migrationForWebsite, primaryWebsite } from '@/utils/selectors'

/* ------------------------------------------------------------------ */
/* Row model shared by the Client Tracker views.                       */
/* ------------------------------------------------------------------ */

/** One tracker row: a client joined with its primary website and migration. */
export interface ClientRow {
  client: Client
  site: Website | undefined
  migration: Migration | undefined
}

export function buildClientRows(clients: Client[], websites: Website[], migrations: Migration[]): ClientRow[] {
  return clients.map((client) => {
    const site = primaryWebsite(websites, client.id)
    return {
      client,
      site,
      migration: site ? migrationForWebsite(migrations, site.id) : undefined,
    }
  })
}

export function rowMatchesSearch(row: ClientRow, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return [row.client.name, row.client.location, row.site?.name ?? '', row.site?.domain ?? ''].some((v) =>
    v.toLowerCase().includes(q),
  )
}
