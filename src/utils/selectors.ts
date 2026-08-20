import type {
  Client,
  Feature,
  Migration,
  MigrationStage,
  PriorityItem,
  TeamMember,
  Website,
} from '@/types'

/* Pure derivation helpers shared by every module. Call inside useMemo. */

export interface OnboardingMetrics {
  total: number
  active: number
  inProgress: number
  noNeed: number
  notStarted: number
}

export function onboardingMetrics(websites: Website[]): OnboardingMetrics {
  return {
    total: websites.length,
    active: websites.filter((w) => w.orderingStatus === 'active').length,
    inProgress: websites.filter((w) => w.orderingStatus === 'in-progress').length,
    noNeed: websites.filter((w) => w.orderingStatus === 'no-need').length,
    notStarted: websites.filter((w) => w.orderingStatus === 'not-started').length,
  }
}

export interface MigrationMetrics {
  totalWebsites: number
  nextjs: number
  react: number
  /** 0..100 */
  completionPct: number
  byStage: Record<MigrationStage, number>
  totalMigrations: number
}

export function migrationMetrics(websites: Website[], migrations: Migration[]): MigrationMetrics {
  const nextjs = websites.filter((w) => w.framework === 'nextjs').length
  const react = websites.length - nextjs
  const byStage: Record<MigrationStage, number> = {
    planning: 0,
    'in-progress': 0,
    testing: 0,
    completed: 0,
  }
  for (const m of migrations) byStage[m.stage] += 1
  return {
    totalWebsites: websites.length,
    nextjs,
    react,
    completionPct: websites.length ? (nextjs / websites.length) * 100 : 0,
    byStage,
    totalMigrations: migrations.length,
  }
}

export interface ClientSummary {
  total: number
  active: number
  inProgress: number
  completed: number
  blocked: number
}

export function clientSummary(clients: Client[]): ClientSummary {
  return {
    total: clients.length,
    active: clients.filter((c) => c.status === 'active').length,
    inProgress: clients.filter((c) => c.status === 'in-progress').length,
    completed: clients.filter((c) => c.status === 'completed').length,
    blocked: clients.filter((c) => c.status === 'blocked').length,
  }
}

export interface FeatureSummary {
  total: number
  deployed: number
  testing: number
  planned: number
}

export function featureSummary(features: Feature[]): FeatureSummary {
  return {
    total: features.length,
    deployed: features.filter((f) => f.status === 'deployed').length,
    testing: features.filter((f) => f.status === 'testing').length,
    planned: features.filter((f) => f.status === 'planned').length,
  }
}

/* ---------------------------- Lookups ------------------------------ */

export function memberById(members: TeamMember[], id: string | null | undefined): TeamMember | undefined {
  return id ? members.find((m) => m.id === id) : undefined
}

export function websiteById(websites: Website[], id: string | null | undefined): Website | undefined {
  return id ? websites.find((w) => w.id === id) : undefined
}

export function clientById(clients: Client[], id: string | null | undefined): Client | undefined {
  return id ? clients.find((c) => c.id === id) : undefined
}

/** First website registered for a client — the one the tracker row shows. */
export function primaryWebsite(websites: Website[], clientId: string): Website | undefined {
  return websites.find((w) => w.clientId === clientId)
}

export function websitesForClient(websites: Website[], clientId: string): Website[] {
  return websites.filter((w) => w.clientId === clientId)
}

export function migrationForWebsite(migrations: Migration[], websiteId: string): Migration | undefined {
  return migrations.find((m) => m.websiteId === websiteId)
}

/** Priority items belonging to a week key ('yyyy-MM-dd' Monday). */
export function prioritiesForWeek(priorities: PriorityItem[], weekStart: string): PriorityItem[] {
  return priorities.filter((p) => p.weekStart === weekStart)
}
