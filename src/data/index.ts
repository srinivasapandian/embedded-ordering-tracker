import type {
  AppNotification,
  AuditLog,
  Client,
  Feature,
  Migration,
  PriorityItem,
  TeamMember,
  Website,
} from '@/types'
import { seedAuditLogs } from './auditLogs'
import { seedClients } from './clients'
import { seedFeatures } from './features'
import { seedMigrations } from './migrations'
import { seedNotifications } from './notifications'
import { seedPriorities } from './priorities'
import { seedTeamMembers } from './users'
import { seedWebsites } from './websites'

export interface SeedState {
  clients: Client[]
  websites: Website[]
  features: Feature[]
  migrations: Migration[]
  priorities: PriorityItem[]
  teamMembers: TeamMember[]
  auditLogs: AuditLog[]
  notifications: AppNotification[]
  /** Snapshot used for dashboard trend deltas ("vs last week"). */
  baseline: {
    totalWebsites: number
    orderingActive: number
    nextjs: number
    migrationsCompleted: number
  }
}

/** Build a fresh copy of the demo dataset (deep-cloned so mutations never touch seeds). */
export function buildSeedState(): SeedState {
  const websites = structuredClone(seedWebsites)
  const migrations = structuredClone(seedMigrations)
  return {
    clients: structuredClone(seedClients),
    websites,
    features: structuredClone(seedFeatures),
    migrations,
    priorities: structuredClone(seedPriorities),
    teamMembers: structuredClone(seedTeamMembers),
    auditLogs: structuredClone(seedAuditLogs),
    notifications: structuredClone(seedNotifications),
    baseline: {
      totalWebsites: websites.length - 3,
      orderingActive: websites.filter((w) => w.orderingStatus === 'active').length - 5,
      nextjs: websites.filter((w) => w.framework === 'nextjs').length - 4,
      migrationsCompleted: migrations.filter((m) => m.stage === 'completed').length - 2,
    },
  }
}
