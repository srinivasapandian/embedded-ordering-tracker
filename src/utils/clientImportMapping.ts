import type { ImportSourceRow } from '@/data/clientImportSource'
import type { ClientFormValues } from '@/store/appStore'
import type { ClientStage, ClientStatus, Framework, MigrationStage, OrderingStatus } from '@/types'

export interface MappedImportRow {
  source: ImportSourceRow
  /** null when the row has no usable client name (skipped entirely). */
  values: ClientFormValues | null
  /** Populated when a field required a judgment call worth flagging in the review table. */
  notes: string[]
}

const ORDERING_STATUS_MAP: Record<string, OrderingStatus> = {
  'not started': 'not-started',
  'in progress': 'in-progress',
  completed: 'active',
  na: 'no-need',
}

const CURRENT_STACK_MAP: Record<string, Framework> = {
  'react js': 'react',
  'next js': 'nextjs',
  html: 'html',
  shopify: 'shopify',
  wordpress: 'wordpress',
  na: 'unknown',
}

/** Client-level status/stage inferred from the sheet's free-text "Live" column. */
const EMB_LIVE_META: Record<string, { status: ClientStatus; stage: ClientStage }> = {
  live: { status: 'active', stage: 'completed' },
  qa: { status: 'in-progress', stage: 'qa' },
  'ready for go live': { status: 'in-progress', stage: 'qa' },
  'under developement': { status: 'in-progress', stage: 'ordering' },
  'under development': { status: 'in-progress', stage: 'ordering' },
  'planned development': { status: 'in-progress', stage: 'onboarded' },
  'on hold': { status: 'blocked', stage: 'onboarded' },
}

function parseSheetDate(value: string): string | null {
  const m = value.trim().match(/^(\d{1,2})[.-](\d{1,2})[.-](\d{4})$/)
  if (!m) return null
  const [, dd, mm, yyyy] = m
  return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`
}

function quarterFromDate(iso: string): string {
  const [year, month] = iso.split('-').map(Number)
  return `Q${Math.ceil(month / 3)} ${year}`
}

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

/**
 * Maps one raw spreadsheet row to the same `ClientFormValues` shape the
 * onboarding form submits — this is the single place every mapping
 * assumption lives, so it's easy to audit before anything gets written.
 */
export function mapImportRow(row: ImportSourceRow): MappedImportRow {
  const notes: string[] = []
  const name = row.client.trim()
  if (!name) return { source: row, values: null, notes: ['No client name — skipped'] }

  const region = row.region.trim()
  const location = region && region.toLowerCase() !== 'na' ? region : ''
  if (!location) notes.push('No region in sheet — location left blank')

  const orderingStatus = ORDERING_STATUS_MAP[row.status.trim().toLowerCase()] ?? 'not-started'

  const embLiveKey = row.embLive.trim().toLowerCase()
  const meta = EMB_LIVE_META[embLiveKey]
  if (!meta) notes.push(`Unrecognized "Live" value "${row.embLive}" — defaulted to Active/Onboarded`)
  const status = meta?.status ?? 'active'
  const stage = meta?.stage ?? 'onboarded'

  const liveLink = row.liveLink.trim()
  const domain = liveLink ? hostnameOf(liveLink) : ''
  if (liveLink && !domain) notes.push(`Could not parse a domain from "${liveLink}"`)

  const currentStackKey = row.currentStack.trim().toLowerCase()
  let framework: Framework = CURRENT_STACK_MAP[currentStackKey] ?? 'unknown'

  const targetIsNextjs = row.targetStack.trim().toLowerCase() === 'next js'
  const migrationStatusRaw = row.migrationStatus.trim().toLowerCase()
  const parsedDate = parseSheetDate(row.migrationDate)

  let migrationStage: MigrationStage | undefined
  let migrationQuarter: string | undefined
  const targetStack: Framework = 'nextjs'

  if (domain && targetIsNextjs && framework !== 'nextjs') {
    if (migrationStatusRaw === 'completed') {
      migrationStage = 'completed'
      // "Completed" is the authoritative signal even when Current Stack in
      // the sheet was left stale at React JS — the app treats framework
      // nextjs and migration-completed as the same fact.
      framework = 'nextjs'
      notes.push('Migration marked Completed in sheet — current stack corrected to Next.js')
    } else {
      migrationStage =
        embLiveKey === 'under developement' || embLiveKey === 'under development'
          ? 'in-progress'
          : embLiveKey === 'qa' || embLiveKey === 'ready for go live'
            ? 'testing'
            : embLiveKey === 'live'
              ? 'in-progress'
              : 'planning'
      notes.push(`Migration status not marked in sheet — inferred "${migrationStage}" from the Live column`)
    }
    migrationQuarter = parsedDate ? quarterFromDate(parsedDate) : undefined
  }

  const values: ClientFormValues = {
    name,
    location,
    phone: '',
    notes: row.remarks.trim() || (row.brand.trim() ? `Brand: ${row.brand.trim()}` : ''),
    status,
    stage,
    priority: 'medium',
    domain: domain || undefined,
    liveUrl: liveLink || undefined,
    framework,
    environment: 'Production',
    orderingStatus,
    orderingStage: row.embLive.trim() || undefined,
    qaSignoff: 'not-required',
    capabilities: {
      ordering: 'unavailable',
      offers: 'unavailable',
      loyalty: 'unavailable',
      reservation: 'unavailable',
      eventOrdering: 'unavailable',
      inFramework: 'unavailable',
    },
    migrationStage,
    migrationQuarter,
    targetStack,
  }

  return { source: row, values, notes }
}
