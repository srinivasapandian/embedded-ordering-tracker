import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  AppNotification,
  AuditLog,
  Client,
  ClientStage,
  ClientStatus,
  Feature,
  Framework,
  Migration,
  MigrationStage,
  OrderingStatus,
  Permission,
  Priority,
  PriorityItem,
  Role,
  TeamMember,
  Website,
} from '@/types'
import {
  CLIENT_STATUS_LABELS,
  FRAMEWORK_LABELS,
  MIGRATION_STAGE_LABELS,
  ORDERING_STATUS_LABELS,
  PRIORITY_LABELS,
  ROLE_LABELS,
  ROLE_PERMISSIONS,
} from '@/types'
import { buildSeedState, type SeedState } from '@/data'
import { uid } from '@/utils/id'
import { clamp } from '@/utils/format'

/* ------------------------------------------------------------------ */
/* Shapes                                                              */
/* ------------------------------------------------------------------ */

/** Values collected by the Create/Edit Client modal. */
export interface ClientFormValues {
  name: string
  domain: string
  location: string
  email: string
  orderingStatus: OrderingStatus
  framework: Framework
  priority: Priority
  assignedToId: string | null
  notes: string
  contactName?: string
  phone?: string
  status?: ClientStatus
  stage?: ClientStage
}

export interface BulkClientPatch {
  status?: ClientStatus
  priority?: Priority
  assignedToId?: string | null
  stage?: ClientStage
  orderingStatus?: OrderingStatus
  framework?: Framework
}

export interface RealtimeEvent {
  id: string
  message: string
  /** Entity that changed — modules use this to flash an "Updated" indicator. */
  migrationId: string | null
  at: number
}

interface AppState extends SeedState {
  currentUserId: string
  /** Role the UI is simulating (Admin Panel "act as" control). */
  actingRole: Role
  lastRealtimeEvent: RealtimeEvent | null

  /* Derived-permission helper */
  can: (permission: Permission) => boolean
  setActingRole: (role: Role) => void

  /* Clients */
  saveClientForm: (clientId: string | null, values: ClientFormValues) => string
  updateClient: (id: string, patch: Partial<Client>) => void
  deleteClient: (id: string) => void
  deleteClients: (ids: string[]) => void
  duplicateClient: (id: string) => string | null
  bulkUpdateClients: (ids: string[], patch: BulkClientPatch) => void

  /* Websites */
  addWebsite: (input: Omit<Website, 'id' | 'addedAt' | 'updatedAt'>) => string
  updateWebsite: (id: string, patch: Partial<Website>) => void
  deleteWebsite: (id: string) => void

  /* Features */
  addFeature: (input: Omit<Feature, 'id' | 'createdAt' | 'updatedAt'>) => string
  updateFeature: (id: string, patch: Partial<Feature>) => void
  deleteFeature: (id: string) => void
  duplicateFeature: (id: string) => string | null
  toggleFeature: (id: string) => void

  /* Migrations */
  addMigration: (input: Omit<Migration, 'id' | 'startedAt' | 'updatedAt' | 'logs' | 'order'>) => string
  updateMigration: (id: string, patch: Partial<Migration>) => void
  moveMigration: (id: string, stage: MigrationStage, order?: number) => void
  appendMigrationLog: (id: string, title: string, detail: string) => void
  deleteMigrations: (ids: string[]) => void
  bulkUpdateMigrations: (
    ids: string[],
    patch: Partial<Pick<Migration, 'stage' | 'developerId' | 'priority'>>,
  ) => void

  /* Weekly priorities */
  addPriority: (input: Omit<PriorityItem, 'id'>) => string
  updatePriority: (id: string, patch: Partial<PriorityItem>) => void
  deletePriority: (id: string) => void

  /* Team members / users */
  addTeamMember: (input: Omit<TeamMember, 'id' | 'createdAt'>) => string
  updateTeamMember: (id: string, patch: Partial<TeamMember>) => void
  deleteTeamMember: (id: string) => void

  /* Notifications */
  addNotification: (n: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void

  /* System */
  resetAll: () => void
  tickRealtime: () => string | null
}

/* ------------------------------------------------------------------ */
/* Internal helpers                                                    */
/* ------------------------------------------------------------------ */

const nowIso = () => new Date().toISOString()

function makeAudit(
  actor: string,
  action: string,
  module: AuditLog['module'],
  recordName: string,
  previousValue: string,
  newValue: string,
): AuditLog {
  return {
    id: uid('a'),
    timestamp: nowIso(),
    actor,
    action,
    module,
    recordName,
    previousValue,
    newValue,
  }
}

const AUDIT_CAP = 400

function memberName(members: TeamMember[], id: string | null | undefined): string {
  if (!id) return 'Unassigned'
  return members.find((m) => m.id === id)?.name ?? 'Unknown'
}

/** Progress floor applied when a migration enters a stage. */
const STAGE_MIN_PROGRESS: Record<MigrationStage, number> = {
  planning: 0,
  'in-progress': 20,
  testing: 75,
  completed: 100,
}

const REALTIME_LOGS: Array<[string, string]> = [
  ['Component batch migrated', 'Another set of shared components moved to server components'],
  ['Menu pages converted', 'Menu detail routes now render on the server'],
  ['Bundle size reduced', 'Client JS trimmed after removing legacy router code'],
  ['Accessibility pass', 'Focus order and aria labels verified on migrated pages'],
  ['Cache headers tuned', 'Static assets now served with immutable cache headers'],
]

/* ------------------------------------------------------------------ */
/* Store                                                               */
/* ------------------------------------------------------------------ */

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => {
      /** Append an audit entry (newest first) as part of a state patch. */
      const audit = (
        state: Pick<AppState, 'auditLogs' | 'teamMembers' | 'currentUserId'>,
        action: string,
        module: AuditLog['module'],
        recordName: string,
        previousValue: string,
        newValue: string,
        actorOverride?: string,
      ): AuditLog[] => {
        const actor =
          actorOverride ?? state.teamMembers.find((m) => m.id === state.currentUserId)?.name ?? 'Admin'
        return [
          makeAudit(actor, action, module, recordName, previousValue, newValue),
          ...state.auditLogs,
        ].slice(0, AUDIT_CAP)
      }

      return {
        ...buildSeedState(),
        currentUserId: 'tm01',
        actingRole: 'super-admin' as Role,
        lastRealtimeEvent: null,

        can: (permission) => ROLE_PERMISSIONS[get().actingRole].includes(permission),

        setActingRole: (role) =>
          set((s) => ({
            actingRole: role,
            auditLogs: audit(s, 'Switched Acting Role', 'System', 'Session', ROLE_LABELS[s.actingRole], ROLE_LABELS[role]),
          })),

        /* ---------------------------- Clients ---------------------------- */

        saveClientForm: (clientId, values) => {
          const s = get()
          if (clientId === null) {
            const id = uid('c')
            const websiteId = uid('w')
            const created = nowIso()
            const client: Client = {
              id,
              name: values.name,
              contactName: values.contactName ?? values.name,
              email: values.email,
              phone: values.phone ?? '',
              location: values.location,
              status: values.status ?? 'in-progress',
              stage: values.stage ?? 'onboarded',
              priority: values.priority,
              assignedToId: values.assignedToId,
              notes: values.notes,
              activity: [
                { id: uid('act'), date: created, title: 'Website added', description: `${values.domain} registered in the tracker` },
                { id: uid('act'), date: created, title: 'Client onboarded', description: 'Created from the Client Tracker' },
              ],
              createdAt: created,
              updatedAt: created,
            }
            const website: Website = {
              id: websiteId,
              name: values.name,
              domain: values.domain,
              clientId: id,
              framework: values.framework,
              orderingStatus: values.orderingStatus,
              orderingStage: values.orderingStatus === 'active' ? 'Live' : values.orderingStatus === 'in-progress' ? 'Menu setup' : values.orderingStatus === 'no-need' ? 'Not required' : 'Not scheduled',
              orderingStartDate: values.orderingStatus === 'active' || values.orderingStatus === 'in-progress' ? created : null,
              orderingCompletedDate: values.orderingStatus === 'active' ? created : null,
              addedAt: created,
              updatedAt: created,
            }
            set((st) => ({
              clients: [client, ...st.clients],
              websites: [website, ...st.websites],
              auditLogs: audit(st, 'Created Client', 'Clients', values.name, '—', 'Created'),
            }))
            return id
          }

          // Update existing client + its primary website
          const client = s.clients.find((c) => c.id === clientId)
          if (!client) return clientId
          const primary = s.websites.find((w) => w.clientId === clientId)
          const statusChanged = values.status && values.status !== client.status
          set((st) => ({
            clients: st.clients.map((c) =>
              c.id === clientId
                ? {
                    ...c,
                    name: values.name,
                    contactName: values.contactName ?? c.contactName,
                    email: values.email,
                    phone: values.phone ?? c.phone,
                    location: values.location,
                    priority: values.priority,
                    assignedToId: values.assignedToId,
                    notes: values.notes,
                    status: values.status ?? c.status,
                    stage: values.stage ?? c.stage,
                    updatedAt: nowIso(),
                  }
                : c,
            ),
            websites: primary
              ? st.websites.map((w) =>
                  w.id === primary.id
                    ? {
                        ...w,
                        domain: values.domain,
                        framework: values.framework,
                        orderingStatus: values.orderingStatus,
                        updatedAt: nowIso(),
                      }
                    : w,
                )
              : st.websites,
            auditLogs: audit(
              st,
              'Updated Client',
              'Clients',
              values.name,
              statusChanged ? CLIENT_STATUS_LABELS[client.status] : 'Edited',
              statusChanged && values.status ? CLIENT_STATUS_LABELS[values.status] : 'Saved',
            ),
          }))
          // Framework flips propagate to any open migration for the site.
          if (primary && primary.framework !== values.framework) {
            get().updateWebsite(primary.id, { framework: values.framework })
          }
          return clientId
        },

        updateClient: (id, patch) => {
          const before = get().clients.find((c) => c.id === id)
          if (!before) return
          const changedStatus = patch.status && patch.status !== before.status
          set((st) => ({
            clients: st.clients.map((c) => (c.id === id ? { ...c, ...patch, updatedAt: nowIso() } : c)),
            auditLogs: audit(
              st,
              changedStatus ? 'Updated Client Status' : 'Updated Client',
              'Clients',
              before.name,
              changedStatus ? CLIENT_STATUS_LABELS[before.status] : 'Edited',
              changedStatus && patch.status ? CLIENT_STATUS_LABELS[patch.status] : 'Saved',
            ),
          }))
        },

        deleteClient: (id) => get().deleteClients([id]),

        deleteClients: (ids) => {
          const s = get()
          const idSet = new Set(ids)
          const names = s.clients.filter((c) => idSet.has(c.id)).map((c) => c.name)
          const siteIds = new Set(s.websites.filter((w) => idSet.has(w.clientId)).map((w) => w.id))
          set((st) => ({
            clients: st.clients.filter((c) => !idSet.has(c.id)),
            websites: st.websites.filter((w) => !idSet.has(w.clientId)),
            migrations: st.migrations.filter((m) => !siteIds.has(m.websiteId)),
            priorities: st.priorities.filter((p) => !siteIds.has(p.websiteId)),
            features: st.features.map((f) => ({
              ...f,
              supportedClientIds: f.supportedClientIds.filter((cid) => !idSet.has(cid)),
            })),
            auditLogs: audit(
              st,
              ids.length > 1 ? 'Bulk Deleted Clients' : 'Deleted Client',
              'Clients',
              ids.length > 1 ? `${ids.length} clients` : (names[0] ?? 'Client'),
              'Existing',
              '—',
            ),
          }))
        },

        duplicateClient: (id) => {
          const s = get()
          const src = s.clients.find((c) => c.id === id)
          if (!src) return null
          const primary = s.websites.find((w) => w.clientId === id)
          const newId = uid('c')
          const created = nowIso()
          const copy: Client = {
            ...structuredClone(src),
            id: newId,
            name: `${src.name} (Copy)`,
            createdAt: created,
            updatedAt: created,
            activity: [
              { id: uid('act'), date: created, title: 'Client duplicated', description: `Copied from ${src.name}` },
            ],
          }
          const siteCopy: Website | null = primary
            ? {
                ...structuredClone(primary),
                id: uid('w'),
                clientId: newId,
                domain: `copy-${primary.domain}`,
                name: `${primary.name} (Copy)`,
                addedAt: created,
                updatedAt: created,
              }
            : null
          set((st) => ({
            clients: [copy, ...st.clients],
            websites: siteCopy ? [siteCopy, ...st.websites] : st.websites,
            auditLogs: audit(st, 'Duplicated Client', 'Clients', src.name, '—', copy.name),
          }))
          return newId
        },

        bulkUpdateClients: (ids, patch) => {
          const idSet = new Set(ids)
          const now = nowIso()
          const parts: string[] = []
          if (patch.status) parts.push(`Status → ${CLIENT_STATUS_LABELS[patch.status]}`)
          if (patch.priority) parts.push(`Priority → ${PRIORITY_LABELS[patch.priority]}`)
          if (patch.assignedToId !== undefined) parts.push(`Assignee → ${memberName(get().teamMembers, patch.assignedToId)}`)
          if (patch.orderingStatus) parts.push(`Ordering → ${ORDERING_STATUS_LABELS[patch.orderingStatus]}`)
          if (patch.framework) parts.push(`Framework → ${FRAMEWORK_LABELS[patch.framework]}`)
          if (patch.stage) parts.push(`Stage → ${patch.stage}`)
          set((st) => ({
            clients: st.clients.map((c) =>
              idSet.has(c.id)
                ? {
                    ...c,
                    ...(patch.status ? { status: patch.status } : null),
                    ...(patch.priority ? { priority: patch.priority } : null),
                    ...(patch.assignedToId !== undefined ? { assignedToId: patch.assignedToId } : null),
                    ...(patch.stage ? { stage: patch.stage } : null),
                    updatedAt: now,
                  }
                : c,
            ),
            websites:
              patch.orderingStatus || patch.framework
                ? st.websites.map((w) =>
                    idSet.has(w.clientId)
                      ? {
                          ...w,
                          ...(patch.orderingStatus ? { orderingStatus: patch.orderingStatus } : null),
                          ...(patch.framework ? { framework: patch.framework } : null),
                          updatedAt: now,
                        }
                      : w,
                  )
                : st.websites,
            migrations:
              patch.framework === 'nextjs'
                ? st.migrations.map((m) => {
                    const site = st.websites.find((w) => w.id === m.websiteId)
                    return site && idSet.has(site.clientId) && m.stage !== 'completed'
                      ? { ...m, stage: 'completed' as MigrationStage, progress: 100, updatedAt: now }
                      : m
                  })
                : st.migrations,
            auditLogs: audit(st, 'Bulk Updated Clients', 'Clients', `${ids.length} clients`, 'Various', parts.join(', ') || 'Updated'),
          }))
        },

        /* ---------------------------- Websites --------------------------- */

        addWebsite: (input) => {
          const id = uid('w')
          const now = nowIso()
          set((st) => ({
            websites: [{ ...input, id, addedAt: now, updatedAt: now }, ...st.websites],
            auditLogs: audit(st, 'Created Website', 'Websites', input.name, '—', 'Created'),
          }))
          return id
        },

        updateWebsite: (id, patch) => {
          const before = get().websites.find((w) => w.id === id)
          if (!before) return
          const now = nowIso()
          const frameworkChanged = patch.framework && patch.framework !== before.framework
          const orderingChanged = patch.orderingStatus && patch.orderingStatus !== before.orderingStatus
          set((st) => ({
            websites: st.websites.map((w) => (w.id === id ? { ...w, ...patch, updatedAt: now } : w)),
            // Framework flip to Next.js completes any open migration; back to React reopens it.
            migrations: frameworkChanged
              ? st.migrations.map((m) => {
                  if (m.websiteId !== id) return m
                  if (patch.framework === 'nextjs' && m.stage !== 'completed') {
                    return {
                      ...m,
                      stage: 'completed' as MigrationStage,
                      progress: 100,
                      updatedAt: now,
                      logs: [
                        ...m.logs,
                        { id: uid('mlog'), timestamp: now, title: 'Marked live on Next.js', detail: 'Framework switched from the admin panel' },
                      ],
                    }
                  }
                  if (patch.framework === 'react' && m.stage === 'completed') {
                    return { ...m, stage: 'testing' as MigrationStage, progress: 90, updatedAt: now }
                  }
                  return m
                })
              : st.migrations,
            auditLogs: audit(
              st,
              frameworkChanged ? 'Updated Framework' : orderingChanged ? 'Updated Ordering Status' : 'Updated Website',
              'Websites',
              before.name,
              frameworkChanged
                ? FRAMEWORK_LABELS[before.framework]
                : orderingChanged
                  ? ORDERING_STATUS_LABELS[before.orderingStatus]
                  : 'Edited',
              frameworkChanged && patch.framework
                ? FRAMEWORK_LABELS[patch.framework]
                : orderingChanged && patch.orderingStatus
                  ? ORDERING_STATUS_LABELS[patch.orderingStatus]
                  : 'Saved',
            ),
          }))
        },

        deleteWebsite: (id) => {
          const before = get().websites.find((w) => w.id === id)
          if (!before) return
          set((st) => ({
            websites: st.websites.filter((w) => w.id !== id),
            migrations: st.migrations.filter((m) => m.websiteId !== id),
            priorities: st.priorities.filter((p) => p.websiteId !== id),
            auditLogs: audit(st, 'Deleted Website', 'Websites', before.name, 'Existing', '—'),
          }))
        },

        /* ---------------------------- Features --------------------------- */

        addFeature: (input) => {
          const id = uid('f')
          const now = nowIso()
          set((st) => ({
            features: [{ ...input, id, createdAt: now, updatedAt: now }, ...st.features],
            auditLogs: audit(st, 'Created Feature', 'Features', input.name, '—', 'Created'),
          }))
          return id
        },

        updateFeature: (id, patch) => {
          const before = get().features.find((f) => f.id === id)
          if (!before) return
          const statusChanged = patch.status && patch.status !== before.status
          set((st) => ({
            features: st.features.map((f) => (f.id === id ? { ...f, ...patch, updatedAt: nowIso() } : f)),
            auditLogs: audit(
              st,
              statusChanged ? 'Updated Deployment Status' : 'Updated Feature',
              'Features',
              before.name,
              statusChanged ? before.status : 'Edited',
              statusChanged && patch.status ? patch.status : 'Saved',
            ),
          }))
        },

        deleteFeature: (id) => {
          const before = get().features.find((f) => f.id === id)
          if (!before) return
          set((st) => ({
            features: st.features.filter((f) => f.id !== id),
            auditLogs: audit(st, 'Deleted Feature', 'Features', before.name, 'Existing', '—'),
          }))
        },

        duplicateFeature: (id) => {
          const src = get().features.find((f) => f.id === id)
          if (!src) return null
          const newId = uid('f')
          const now = nowIso()
          set((st) => ({
            features: [
              { ...structuredClone(src), id: newId, name: `${src.name} (Copy)`, createdAt: now, updatedAt: now },
              ...st.features,
            ],
            auditLogs: audit(st, 'Duplicated Feature', 'Features', src.name, '—', `${src.name} (Copy)`),
          }))
          return newId
        },

        toggleFeature: (id) => {
          const before = get().features.find((f) => f.id === id)
          if (!before) return
          set((st) => ({
            features: st.features.map((f) =>
              f.id === id ? { ...f, enabled: !f.enabled, updatedAt: nowIso() } : f,
            ),
            auditLogs: audit(
              st,
              before.enabled ? 'Disabled Feature' : 'Enabled Feature',
              'Features',
              before.name,
              before.enabled ? 'Enabled' : 'Disabled',
              before.enabled ? 'Disabled' : 'Enabled',
            ),
          }))
        },

        /* --------------------------- Migrations -------------------------- */

        addMigration: (input) => {
          const id = uid('m')
          const now = nowIso()
          const site = get().websites.find((w) => w.id === input.websiteId)
          set((st) => ({
            migrations: [
              {
                ...input,
                id,
                startedAt: now,
                updatedAt: now,
                order: -1, // sorts to the top of its column
                logs: [
                  { id: uid('mlog'), timestamp: now, title: 'Migration kickoff', detail: 'Project created from the Migration board' },
                ],
              },
              ...st.migrations,
            ],
            auditLogs: audit(st, 'Created Migration', 'Migration', site?.name ?? 'Website', '—', MIGRATION_STAGE_LABELS[input.stage]),
          }))
          return id
        },

        updateMigration: (id, patch) => {
          const s = get()
          const before = s.migrations.find((m) => m.id === id)
          if (!before) return
          if (patch.stage && patch.stage !== before.stage) {
            // Stage transitions go through moveMigration so side-effects stay in one place.
            const { stage, ...rest } = patch
            if (Object.keys(rest).length > 0) {
              set((st) => ({
                migrations: st.migrations.map((m) => (m.id === id ? { ...m, ...rest, updatedAt: nowIso() } : m)),
              }))
            }
            get().moveMigration(id, stage)
            return
          }
          const site = s.websites.find((w) => w.id === before.websiteId)
          const progressChanged = patch.progress !== undefined && patch.progress !== before.progress
          set((st) => ({
            migrations: st.migrations.map((m) => (m.id === id ? { ...m, ...patch, updatedAt: nowIso() } : m)),
            auditLogs: audit(
              st,
              progressChanged ? 'Updated Progress' : 'Updated Migration',
              'Migration',
              site?.name ?? 'Website',
              progressChanged ? `${before.progress}%` : 'Edited',
              progressChanged ? `${patch.progress}%` : 'Saved',
            ),
          }))
        },

        moveMigration: (id, stage, order) => {
          const s = get()
          const before = s.migrations.find((m) => m.id === id)
          if (!before || (before.stage === stage && order === undefined)) return
          const site = s.websites.find((w) => w.id === before.websiteId)
          const now = nowIso()
          const stageChanged = before.stage !== stage
          const progress = stageChanged
            ? stage === 'completed'
              ? 100
              : stage === 'planning'
                ? Math.min(before.progress, 15)
                : before.stage === 'completed' && stage === 'testing'
                  ? 90
                  : Math.max(before.progress, STAGE_MIN_PROGRESS[stage])
            : before.progress
          set((st) => {
            const targetOrder =
              order !== undefined
                ? order
                : Math.min(0, ...st.migrations.filter((m) => m.stage === stage).map((m) => m.order)) - 1
            return {
              migrations: st.migrations.map((m) =>
                m.id === id
                  ? {
                      ...m,
                      stage,
                      order: targetOrder,
                      progress,
                      updatedAt: now,
                      logs: stageChanged
                        ? [
                            ...m.logs,
                            {
                              id: uid('mlog'),
                              timestamp: now,
                              title: `Moved to ${MIGRATION_STAGE_LABELS[stage]}`,
                              detail: `Stage changed from ${MIGRATION_STAGE_LABELS[before.stage]}`,
                            },
                          ]
                        : m.logs,
                    }
                  : m,
              ),
              // Completing a migration flips the website to Next.js (and vice versa).
              websites: stageChanged
                ? st.websites.map((w) => {
                    if (w.id !== before.websiteId) return w
                    if (stage === 'completed' && w.framework !== 'nextjs') return { ...w, framework: 'nextjs', updatedAt: now }
                    if (before.stage === 'completed' && stage !== 'completed' && w.framework !== 'react')
                      return { ...w, framework: 'react', updatedAt: now }
                    return w
                  })
                : st.websites,
              auditLogs: stageChanged
                ? audit(
                    st,
                    'Updated Migration Status',
                    'Migration',
                    site?.name ?? 'Website',
                    MIGRATION_STAGE_LABELS[before.stage],
                    MIGRATION_STAGE_LABELS[stage],
                  )
                : st.auditLogs,
              notifications:
                stageChanged && stage === 'completed'
                  ? [
                      {
                        id: uid('n'),
                        title: `${site?.name ?? 'Website'} migrated to Next.js`,
                        description: 'Migration marked completed — dashboard metrics updated.',
                        timestamp: now,
                        read: false,
                        kind: 'success' as const,
                      },
                      ...st.notifications,
                    ]
                  : st.notifications,
            }
          })
        },

        appendMigrationLog: (id, title, detail) => {
          set((st) => ({
            migrations: st.migrations.map((m) =>
              m.id === id
                ? {
                    ...m,
                    updatedAt: nowIso(),
                    logs: [...m.logs, { id: uid('mlog'), timestamp: nowIso(), title, detail }],
                  }
                : m,
            ),
          }))
        },

        deleteMigrations: (ids) => {
          const s = get()
          const idSet = new Set(ids)
          const names = s.migrations
            .filter((m) => idSet.has(m.id))
            .map((m) => s.websites.find((w) => w.id === m.websiteId)?.name ?? 'Website')
          set((st) => ({
            migrations: st.migrations.filter((m) => !idSet.has(m.id)),
            auditLogs: audit(
              st,
              ids.length > 1 ? 'Bulk Deleted Migrations' : 'Deleted Migration',
              'Migration',
              ids.length > 1 ? `${ids.length} migrations` : (names[0] ?? 'Migration'),
              'Existing',
              '—',
            ),
          }))
        },

        bulkUpdateMigrations: (ids, patch) => {
          const { stage, ...rest } = patch
          if (Object.keys(rest).length > 0) {
            const now = nowIso()
            const idSet = new Set(ids)
            const parts: string[] = []
            if (rest.developerId !== undefined) parts.push(`Developer → ${memberName(get().teamMembers, rest.developerId)}`)
            if (rest.priority) parts.push(`Priority → ${PRIORITY_LABELS[rest.priority]}`)
            set((st) => ({
              migrations: st.migrations.map((m) => (idSet.has(m.id) ? { ...m, ...rest, updatedAt: now } : m)),
              auditLogs: audit(st, 'Bulk Updated Migrations', 'Migration', `${ids.length} migrations`, 'Various', parts.join(', ') || 'Updated'),
            }))
          }
          if (stage) {
            for (const id of ids) get().moveMigration(id, stage)
          }
        },

        /* ----------------------- Weekly priorities ----------------------- */

        addPriority: (input) => {
          const id = uid('p')
          set((st) => ({
            priorities: [{ ...input, id }, ...st.priorities],
            auditLogs: audit(st, 'Created Priority', 'Priorities', input.title, '—', 'Created'),
          }))
          return id
        },

        updatePriority: (id, patch) => {
          const before = get().priorities.find((p) => p.id === id)
          if (!before) return
          const parts: string[] = []
          if (patch.status && patch.status !== before.status) parts.push(`Status → ${patch.status}`)
          if (patch.priority && patch.priority !== before.priority) parts.push(`Priority → ${PRIORITY_LABELS[patch.priority]}`)
          if (patch.assignedToId !== undefined && patch.assignedToId !== before.assignedToId)
            parts.push(`Assignee → ${memberName(get().teamMembers, patch.assignedToId)}`)
          if (patch.dueDate && patch.dueDate !== before.dueDate) parts.push(`Due → ${patch.dueDate}`)
          set((st) => ({
            priorities: st.priorities.map((p) => (p.id === id ? { ...p, ...patch } : p)),
            auditLogs: audit(st, 'Updated Priority', 'Priorities', before.title, 'Various', parts.join(', ') || 'Saved'),
          }))
        },

        deletePriority: (id) => {
          const before = get().priorities.find((p) => p.id === id)
          if (!before) return
          set((st) => ({
            priorities: st.priorities.filter((p) => p.id !== id),
            auditLogs: audit(st, 'Deleted Priority', 'Priorities', before.title, 'Existing', '—'),
          }))
        },

        /* --------------------------- Team members ------------------------ */

        addTeamMember: (input) => {
          const id = uid('tm')
          set((st) => ({
            teamMembers: [...st.teamMembers, { ...input, id, createdAt: nowIso() }],
            auditLogs: audit(st, 'Created Team Member', 'Team', input.name, '—', ROLE_LABELS[input.role]),
          }))
          return id
        },

        updateTeamMember: (id, patch) => {
          const before = get().teamMembers.find((m) => m.id === id)
          if (!before) return
          const roleChanged = patch.role && patch.role !== before.role
          set((st) => ({
            teamMembers: st.teamMembers.map((m) => (m.id === id ? { ...m, ...patch } : m)),
            auditLogs: audit(
              st,
              roleChanged ? 'Updated Role' : 'Updated Team Member',
              'Team',
              before.name,
              roleChanged ? ROLE_LABELS[before.role] : 'Edited',
              roleChanged && patch.role ? ROLE_LABELS[patch.role] : 'Saved',
            ),
          }))
        },

        deleteTeamMember: (id) => {
          const before = get().teamMembers.find((m) => m.id === id)
          if (!before || id === get().currentUserId) return
          set((st) => ({
            teamMembers: st.teamMembers.filter((m) => m.id !== id),
            clients: st.clients.map((c) => (c.assignedToId === id ? { ...c, assignedToId: null } : c)),
            migrations: st.migrations.map((m) => (m.developerId === id ? { ...m, developerId: null } : m)),
            priorities: st.priorities.map((p) => (p.assignedToId === id ? { ...p, assignedToId: null } : p)),
            auditLogs: audit(st, 'Deleted Team Member', 'Team', before.name, ROLE_LABELS[before.role], '—'),
          }))
        },

        /* --------------------------- Notifications ----------------------- */

        addNotification: (n) =>
          set((st) => ({
            notifications: [{ ...n, id: uid('n'), timestamp: nowIso(), read: false }, ...st.notifications].slice(0, 30),
          })),

        markNotificationRead: (id) =>
          set((st) => ({
            notifications: st.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
          })),

        markAllNotificationsRead: () =>
          set((st) => ({ notifications: st.notifications.map((n) => ({ ...n, read: true })) })),

        /* ------------------------------ System ---------------------------- */

        resetAll: () => {
          const fresh = buildSeedState()
          set((st) => ({
            ...fresh,
            auditLogs: [
              makeAudit(
                st.teamMembers.find((m) => m.id === st.currentUserId)?.name ?? 'Admin',
                'Reset Demo Data',
                'System',
                'All records',
                'Modified',
                'Seed data',
              ),
              ...fresh.auditLogs,
            ],
          }))
        },

        tickRealtime: () => {
          const s = get()
          const candidates = s.migrations.filter((m) => m.stage === 'in-progress' && m.progress < 94)
          if (candidates.length === 0) return null
          const target = candidates[Math.floor(Math.random() * candidates.length)]!
          const site = s.websites.find((w) => w.id === target.websiteId)
          const bump = 1 + Math.floor(Math.random() * 3)
          const next = clamp(target.progress + bump, 0, 94)
          const addLog = Math.random() < 0.35
          const logEntry = REALTIME_LOGS[Math.floor(Math.random() * REALTIME_LOGS.length)]!
          const now = nowIso()
          const message = `${site?.name ?? 'A migration'} progressed to ${next}%`
          set((st) => ({
            migrations: st.migrations.map((m) =>
              m.id === target.id
                ? {
                    ...m,
                    progress: next,
                    updatedAt: now,
                    logs: addLog
                      ? [...m.logs, { id: uid('mlog'), timestamp: now, title: logEntry[0], detail: logEntry[1] }]
                      : m.logs,
                  }
                : m,
            ),
            lastRealtimeEvent: { id: uid('rt'), message, migrationId: target.id, at: Date.now() },
            notifications:
              next >= 90 && target.progress < 90
                ? [
                    {
                      id: uid('n'),
                      title: `${site?.name ?? 'Migration'} nearing completion`,
                      description: `Migration progress reached ${next}% — ready for QA soon.`,
                      timestamp: now,
                      read: false,
                      kind: 'info' as const,
                    },
                    ...st.notifications,
                  ].slice(0, 30)
                : st.notifications,
          }))
          return message
        },
      }
    },
    {
      name: 'eot-data',
      version: 3,
      migrate: () => ({ ...buildSeedState() }) as unknown as AppState,
      partialize: (state) =>
        ({
          clients: state.clients,
          websites: state.websites,
          features: state.features,
          migrations: state.migrations,
          priorities: state.priorities,
          teamMembers: state.teamMembers,
          auditLogs: state.auditLogs,
          notifications: state.notifications,
          baseline: state.baseline,
          currentUserId: state.currentUserId,
          actingRole: state.actingRole,
        }) as AppState,
    },
  ),
)
