import { create } from 'zustand'
import type { DocumentData } from 'firebase/firestore'
import type {
  AppNotification,
  AuditLog,
  CapabilityState,
  Client,
  ClientCapabilities,
  ClientStage,
  ClientStatus,
  Environment,
  Framework,
  Migration,
  MigrationStage,
  OrderingStatus,
  Priority,
  PriorityItem,
  QaSignoff,
  TeamMember,
  Website,
} from '@/types'
import {
  CAPABILITY_LABELS,
  CAPABILITY_STATE_LABELS,
  CLIENT_STATUS_LABELS,
  FRAMEWORK_LABELS,
  MIGRATION_STAGE_LABELS,
  ORDERING_STATUS_LABELS,
  PRIORITY_LABELS,
} from '@/types'
import {
  addNewDoc,
  addSubDoc,
  collectSubDocRefs,
  newBatch,
  newRef,
  newSubRef,
  nowIso,
  patchDoc,
  refAt,
  removeDoc,
  subscribeCollection,
} from '@/firebase/collection'
import { subscribeUserProfiles } from '@/firebase/firestore'
import { toast } from '@/store/toastStore'

/* ------------------------------------------------------------------ */
/* Shapes                                                              */
/* ------------------------------------------------------------------ */

/** Values collected by the Add Client modal. Website domain is optional — no domain means no website gets created yet. */
export interface ClientFormValues {
  name: string
  domain?: string
  location: string
  orderingStatus: OrderingStatus
  framework: Framework
  priority: Priority
  notes: string
  phone?: string
  status?: ClientStatus
  stage?: ClientStage
  environment?: Environment
  qaSignoff?: QaSignoff
  liveUrl?: string
  orderingStage?: string
  figmaLink?: string
  deployedDate?: string | null
  repoName?: string
  devLatestBranch?: string
  releaseBranch?: string
  capabilities?: ClientCapabilities
  /** Optional migration record to create alongside the website — omit to leave migration untracked. */
  migrationStage?: MigrationStage
  migrationQuarter?: string
  targetStack?: Framework
}

export interface BulkClientPatch {
  status?: ClientStatus
  priority?: Priority
  stage?: ClientStage
  orderingStatus?: OrderingStatus
  framework?: Framework
}

export interface RealtimeEvent {
  id: string
  message: string
  migrationId: string | null
  at: number
}

interface AppState {
  clients: Client[]
  websites: Website[]
  migrations: Migration[]
  priorities: PriorityItem[]
  teamMembers: TeamMember[]
  auditLogs: AuditLog[]
  notifications: AppNotification[]
  /** Never set anymore (the mock realtime ticker is gone) — kept so
   *  LiveIndicator/MigrationCard degrade to their idle state instead of erroring. */
  lastRealtimeEvent: RealtimeEvent | null
  /** Name written into new audit log entries — kept in sync with the signed-in user by AuthContext. */
  currentActorName: string

  setCurrentActor: (name: string) => void
  /** Attaches onSnapshot listeners for every collection; returns the combined unsubscribe. */
  initFirestoreSync: () => () => void

  /* Clients */
  createClient: (values: ClientFormValues) => Promise<string>
  updateClient: (id: string, patch: Partial<Client>) => Promise<void>
  deleteClient: (id: string) => Promise<void>
  deleteClients: (ids: string[]) => Promise<void>
  bulkUpdateClients: (ids: string[], patch: BulkClientPatch) => Promise<void>
  updateClientCapability: (id: string, capability: keyof ClientCapabilities, state: CapabilityState) => Promise<void>
  bulkUpdateClientCapability: (ids: string[], capability: keyof ClientCapabilities, state: CapabilityState) => Promise<void>

  /* Websites */
  addWebsite: (input: Omit<Website, 'id' | 'addedAt' | 'updatedAt'>) => Promise<string>
  updateWebsite: (id: string, patch: Partial<Website>) => Promise<void>
  deleteWebsite: (id: string) => Promise<void>

  /* Migrations */
  addMigration: (input: Omit<Migration, 'id' | 'order' | 'startedAt' | 'updatedAt'>) => Promise<string>
  updateMigration: (id: string, patch: Partial<Migration>) => Promise<void>
  moveMigration: (id: string, stage: MigrationStage, order?: number) => Promise<void>
  appendMigrationLog: (id: string, title: string, detail: string) => Promise<void>
  deleteMigrations: (ids: string[]) => Promise<void>
  bulkUpdateMigrations: (
    ids: string[],
    patch: Partial<Pick<Migration, 'stage' | 'developerId' | 'priority'>>,
  ) => Promise<void>

  /* Weekly priorities */
  addPriority: (input: Omit<PriorityItem, 'id'>) => Promise<string>
  updatePriority: (id: string, patch: Partial<PriorityItem>) => Promise<void>
  deletePriority: (id: string) => Promise<void>

  /* Notifications */
  addNotification: (n: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => Promise<void>
  markNotificationRead: (id: string) => Promise<void>
  markAllNotificationsRead: () => Promise<void>
}

/* ------------------------------------------------------------------ */
/* Internal helpers                                                    */
/* ------------------------------------------------------------------ */

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

/** Runs a Firestore operation; on failure, surfaces a toast and rethrows so awaiting callers can react. */
async function withErrorToast<T>(op: () => Promise<T>, failMessage: string): Promise<T> {
  try {
    return await op()
  } catch (error) {
    console.error(failMessage, error)
    toast.error('Something went wrong', failMessage)
    throw error
  }
}

/* ------------------------------------------------------------------ */
/* Normalization                                                       */
/* Firestore documents aren't type-checked — a doc created by hand in  */
/* the Console (or a future bug) can be missing fields the rest of the */
/* app assumes exist. Every collection gets defaulted here, once, so   */
/* every consumer downstream can keep trusting the TS shape.           */
/* ------------------------------------------------------------------ */

const DEFAULT_CAPABILITIES: ClientCapabilities = {
  ordering: 'unavailable',
  offers: 'unavailable',
  loyalty: 'unavailable',
  reservation: 'unavailable',
  eventOrdering: 'unavailable',
  inFramework: 'unavailable',
}

/**
 * Every date field in these collections is meant to be a plain ISO string —
 * but Firestore Console's "Add field" UI defaults to its native Timestamp
 * type, so a hand-created doc can have the *wrong type*, not just a missing
 * value. Coerce either shape to an ISO string instead of assuming.
 */
function coerceIso(value: unknown): string | null {
  if (typeof value === 'string') return value
  if (value && typeof value === 'object' && typeof (value as { toDate?: unknown }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate().toISOString()
  }
  return null
}
const isoOrNow = (value: unknown): string => coerceIso(value) ?? nowIso()
const isoOrNull = (value: unknown): string | null => (value == null ? null : coerceIso(value))

// Every field is listed explicitly (not spread-then-patched) so a doc
// missing ANY field — not just the ones we've previously hit — still comes
// out fully shaped.

function normalizeClient(raw: Client): Client {
  return {
    id: raw.id,
    name: raw.name ?? 'Untitled client',
    phone: raw.phone ?? '',
    location: raw.location ?? '',
    status: raw.status ?? 'in-progress',
    stage: raw.stage ?? 'onboarded',
    priority: raw.priority ?? 'medium',
    notes: raw.notes ?? '',
    capabilities: { ...DEFAULT_CAPABILITIES, ...raw.capabilities },
    createdAt: isoOrNow(raw.createdAt),
    updatedAt: isoOrNow(raw.updatedAt),
  }
}

function normalizeWebsite(raw: Website): Website {
  const domain = raw.domain ?? ''
  return {
    id: raw.id,
    name: raw.name ?? 'Untitled site',
    domain,
    clientId: raw.clientId ?? '',
    framework: raw.framework ?? 'react',
    orderingStatus: raw.orderingStatus ?? 'not-started',
    orderingStage: raw.orderingStage ?? 'Not scheduled',
    orderingStartDate: isoOrNull(raw.orderingStartDate),
    orderingCompletedDate: isoOrNull(raw.orderingCompletedDate),
    environment: raw.environment ?? 'Staging',
    qaSignoff: raw.qaSignoff ?? 'pending',
    liveUrl: raw.liveUrl || (domain ? `https://${domain}` : ''),
    figmaLink: raw.figmaLink ?? '',
    deployedDate: isoOrNull(raw.deployedDate),
    repoName: raw.repoName ?? '',
    devLatestBranch: raw.devLatestBranch ?? '',
    releaseBranch: raw.releaseBranch ?? '',
    addedAt: isoOrNow(raw.addedAt),
    updatedAt: isoOrNow(raw.updatedAt),
  }
}

function normalizeMigration(raw: Migration): Migration {
  return {
    id: raw.id,
    websiteId: raw.websiteId ?? '',
    developerId: raw.developerId ?? null,
    stage: raw.stage ?? 'planning',
    progress: raw.progress ?? 0,
    priority: raw.priority ?? 'medium',
    dueDate: (coerceIso(raw.dueDate) ?? nowIso()).slice(0, 10),
    order: raw.order ?? 0,
    quarter: raw.quarter ?? '',
    targetStack: raw.targetStack ?? 'nextjs',
    startedAt: isoOrNow(raw.startedAt),
    updatedAt: isoOrNow(raw.updatedAt),
  }
}

function normalizePriority(raw: PriorityItem): PriorityItem {
  return {
    id: raw.id,
    websiteId: raw.websiteId ?? '',
    weekStart: (coerceIso(raw.weekStart) ?? '').slice(0, 10),
    title: raw.title ?? 'Untitled',
    priority: raw.priority ?? 'medium',
    assignedToId: raw.assignedToId ?? null,
    dueDate: (coerceIso(raw.dueDate) ?? nowIso()).slice(0, 10),
    status: raw.status ?? 'not-started',
  }
}

/* ------------------------------------------------------------------ */
/* Store                                                               */
/* ------------------------------------------------------------------ */

export const useAppStore = create<AppState>()((set, get) => {
  /** Fire-and-forget audit log write — never blocks the action it documents. */
  const audit = (
    action: string,
    module: AuditLog['module'],
    recordName: string,
    previousValue: string,
    newValue: string,
  ) => {
    addNewDoc('auditLogs', {
      timestamp: nowIso(),
      actor: get().currentActorName,
      action,
      module,
      recordName,
      previousValue,
      newValue,
    }).catch((error) => console.error('Failed to write audit log', error))
  }

  return {
    clients: [],
    websites: [],
    migrations: [],
    priorities: [],
    teamMembers: [],
    auditLogs: [],
    notifications: [],
    lastRealtimeEvent: null,
    currentActorName: 'Admin',

    setCurrentActor: (name) => set({ currentActorName: name }),

    initFirestoreSync: () => {
      const unsubs: Array<() => void> = [
        subscribeCollection<Client>('clients', (items) => set({ clients: items.map(normalizeClient) })),
        subscribeCollection<Website>('websites', (items) => set({ websites: items.map(normalizeWebsite) })),
        subscribeCollection<Migration>('migrations', (items) => set({ migrations: items.map(normalizeMigration) })),
        subscribeCollection<PriorityItem>('priorities', (items) => set({ priorities: items.map(normalizePriority) })),
        subscribeCollection<AuditLog>(
          'auditLogs',
          (items) => set({ auditLogs: items }),
          { orderByField: 'timestamp', max: AUDIT_CAP },
        ),
        subscribeCollection<AppNotification>(
          'notifications',
          (items) => set({ notifications: items }),
          { orderByField: 'timestamp', max: 30 },
        ),
        subscribeUserProfiles((profiles) =>
          set({
            teamMembers: profiles.map(
              (p): TeamMember => ({
                id: p.uid,
                name: p.name,
                email: p.email,
                role: p.role,
                title: p.title,
                color: p.color,
                active: p.active,
                createdAt: p.createdAt,
              }),
            ),
          }),
        ),
      ]
      return () => unsubs.forEach((fn) => fn())
    },

    /* ---------------------------- Clients ---------------------------- */

    createClient: (values) =>
      withErrorToast(async () => {
        const clientRef = newRef('clients')
        const created = nowIso()
        const clientData: DocumentData = {
          name: values.name,
          phone: values.phone ?? '',
          location: values.location,
          status: values.status ?? 'in-progress',
          stage: values.stage ?? 'onboarded',
          priority: values.priority,
          notes: values.notes,
          capabilities: values.capabilities ?? DEFAULT_CAPABILITIES,
          createdAt: created,
          updatedAt: created,
        }
        const batch = newBatch()
        batch.set(clientRef, clientData)
        batch.set(newSubRef('clients', clientRef.id, 'activity'), {
          date: created,
          title: 'Client onboarded',
          description: 'Created from the Client Tracker',
        })

        // Website domain is optional — no domain means no website is created yet;
        // one can be added later from the client's Edit drawer.
        const domain = values.domain?.trim().toLowerCase()
        if (domain) {
          const websiteRef = newRef('websites')
          const websiteData: DocumentData = {
            name: values.name,
            domain,
            clientId: clientRef.id,
            framework: values.framework,
            orderingStatus: values.orderingStatus,
            orderingStage:
              values.orderingStage ||
              (values.orderingStatus === 'active'
                ? 'Live'
                : values.orderingStatus === 'in-progress'
                  ? 'Menu setup'
                  : values.orderingStatus === 'no-need'
                    ? 'Not required'
                    : 'Not scheduled'),
            orderingStartDate: values.orderingStatus === 'active' || values.orderingStatus === 'in-progress' ? created : null,
            orderingCompletedDate: values.orderingStatus === 'active' ? created : null,
            environment: values.environment ?? 'Staging',
            qaSignoff: values.qaSignoff ?? 'pending',
            liveUrl: values.liveUrl || `https://${domain}`,
            figmaLink: values.figmaLink ?? '',
            deployedDate: values.deployedDate ?? null,
            repoName: values.repoName ?? '',
            devLatestBranch: values.devLatestBranch ?? '',
            releaseBranch: values.releaseBranch ?? '',
            addedAt: created,
            updatedAt: created,
          }
          batch.set(websiteRef, websiteData)
          batch.set(newSubRef('clients', clientRef.id, 'activity'), {
            date: created,
            title: 'Website added',
            description: `${domain} registered in the tracker`,
          })

          if (values.migrationStage) {
            const migrationRef = newRef('migrations')
            batch.set(migrationRef, {
              websiteId: websiteRef.id,
              developerId: null,
              stage: values.migrationStage,
              progress: values.migrationStage === 'completed' ? 100 : STAGE_MIN_PROGRESS[values.migrationStage],
              priority: values.priority,
              dueDate: created.slice(0, 10),
              order: 0,
              quarter: values.migrationQuarter || '',
              targetStack: values.targetStack ?? 'nextjs',
              startedAt: created,
              updatedAt: created,
            })
          }
        }

        await batch.commit()
        audit('Created Client', 'Clients', values.name, '—', 'Created')
        return clientRef.id
      }, 'Could not create the client.'),

    updateClient: (id, patch) =>
      withErrorToast(async () => {
        const before = get().clients.find((c) => c.id === id)
        if (!before) return
        const changedStatus = patch.status && patch.status !== before.status
        await patchDoc('clients', id, { ...patch, updatedAt: nowIso() })
        audit(
          changedStatus ? 'Updated Client Status' : 'Updated Client',
          'Clients',
          before.name,
          changedStatus ? CLIENT_STATUS_LABELS[before.status] : 'Edited',
          changedStatus && patch.status ? CLIENT_STATUS_LABELS[patch.status] : 'Saved',
        )
      }, 'Could not save the client.'),

    deleteClient: (id) => get().deleteClients([id]),

    deleteClients: (ids) =>
      withErrorToast(async () => {
        const s = get()
        const idSet = new Set(ids)
        const names = s.clients.filter((c) => idSet.has(c.id)).map((c) => c.name)
        const siteIds = s.websites.filter((w) => idSet.has(w.clientId)).map((w) => w.id)
        const siteIdSet = new Set(siteIds)
        const migrationIds = s.migrations.filter((m) => siteIdSet.has(m.websiteId)).map((m) => m.id)
        const priorityIds = s.priorities.filter((p) => siteIdSet.has(p.websiteId)).map((p) => p.id)

        const batch = newBatch()
        for (const id of ids) {
          batch.delete(refAt('clients', id))
          for (const ref of await collectSubDocRefs('clients', id, 'activity')) batch.delete(ref)
        }
        for (const siteId of siteIds) batch.delete(refAt('websites', siteId))
        for (const mId of migrationIds) {
          batch.delete(refAt('migrations', mId))
          for (const ref of await collectSubDocRefs('migrations', mId, 'logs')) batch.delete(ref)
        }
        for (const pId of priorityIds) batch.delete(refAt('priorities', pId))
        await batch.commit()

        audit(
          ids.length > 1 ? 'Bulk Deleted Clients' : 'Deleted Client',
          'Clients',
          ids.length > 1 ? `${ids.length} clients` : (names[0] ?? 'Client'),
          'Existing',
          '—',
        )
      }, 'Could not delete the client(s).'),

    bulkUpdateClients: (ids, patch) =>
      withErrorToast(async () => {
        const idSet = new Set(ids)
        const now = nowIso()
        const parts: string[] = []
        if (patch.status) parts.push(`Status → ${CLIENT_STATUS_LABELS[patch.status]}`)
        if (patch.priority) parts.push(`Priority → ${PRIORITY_LABELS[patch.priority]}`)
        if (patch.orderingStatus) parts.push(`Ordering → ${ORDERING_STATUS_LABELS[patch.orderingStatus]}`)
        if (patch.framework) parts.push(`Framework → ${FRAMEWORK_LABELS[patch.framework]}`)
        if (patch.stage) parts.push(`Stage → ${patch.stage}`)

        const s = get()
        const clientPatch: DocumentData = { updatedAt: now }
        if (patch.status) clientPatch.status = patch.status
        if (patch.priority) clientPatch.priority = patch.priority
        if (patch.stage) clientPatch.stage = patch.stage

        const batch = newBatch()
        for (const id of ids) batch.update(refAt('clients', id), clientPatch)

        if (patch.orderingStatus || patch.framework) {
          const sitePatch: DocumentData = { updatedAt: now }
          if (patch.orderingStatus) sitePatch.orderingStatus = patch.orderingStatus
          if (patch.framework) sitePatch.framework = patch.framework
          for (const site of s.websites) if (idSet.has(site.clientId)) batch.update(refAt('websites', site.id), sitePatch)
        }
        if (patch.framework === 'nextjs') {
          for (const m of s.migrations) {
            const site = s.websites.find((w) => w.id === m.websiteId)
            if (site && idSet.has(site.clientId) && m.stage !== 'completed') {
              batch.update(refAt('migrations', m.id), { stage: 'completed', progress: 100, updatedAt: now })
            }
          }
        }
        await batch.commit()
        audit('Bulk Updated Clients', 'Clients', `${ids.length} clients`, 'Various', parts.join(', ') || 'Updated')
      }, 'Could not bulk update the clients.'),

    updateClientCapability: (id, capability, state) =>
      withErrorToast(async () => {
        const before = get().clients.find((c) => c.id === id)
        if (!before) return
        const previous = before.capabilities[capability]
        await patchDoc('clients', id, { [`capabilities.${capability}`]: state, updatedAt: nowIso() })
        audit(`Updated ${CAPABILITY_LABELS[capability]}`, 'Clients', before.name, CAPABILITY_STATE_LABELS[previous], CAPABILITY_STATE_LABELS[state])
      }, 'Could not update the feature.'),

    bulkUpdateClientCapability: (ids, capability, state) =>
      withErrorToast(async () => {
        const now = nowIso()
        const batch = newBatch()
        for (const id of ids) batch.update(refAt('clients', id), { [`capabilities.${capability}`]: state, updatedAt: now })
        await batch.commit()
        audit('Bulk Updated Clients', 'Clients', `${ids.length} clients`, CAPABILITY_LABELS[capability], CAPABILITY_STATE_LABELS[state])
      }, 'Could not update the feature.'),

    /* ---------------------------- Websites --------------------------- */

    addWebsite: (input) =>
      withErrorToast(async () => {
        const now = nowIso()
        const id = await addNewDoc('websites', { ...input, addedAt: now, updatedAt: now })
        audit('Created Website', 'Websites', input.name, '—', 'Created')
        return id
      }, 'Could not create the website.'),

    updateWebsite: (id, patch) =>
      withErrorToast(async () => {
        const before = get().websites.find((w) => w.id === id)
        if (!before) return
        const now = nowIso()
        const frameworkChanged = patch.framework && patch.framework !== before.framework
        const orderingChanged = patch.orderingStatus && patch.orderingStatus !== before.orderingStatus

        await patchDoc('websites', id, { ...patch, updatedAt: now })

        // Framework flip to Next.js completes any open migration; back to React reopens it.
        if (frameworkChanged) {
          const migration = get().migrations.find((m) => m.websiteId === id)
          if (migration) {
            if (patch.framework === 'nextjs' && migration.stage !== 'completed') {
              await patchDoc('migrations', migration.id, { stage: 'completed', progress: 100, updatedAt: now })
              await addSubDoc('migrations', migration.id, 'logs', {
                timestamp: now,
                title: 'Marked live on Next.js',
                detail: 'Framework switched from the admin panel',
              })
            } else if (patch.framework === 'react' && migration.stage === 'completed') {
              await patchDoc('migrations', migration.id, { stage: 'testing', progress: 90, updatedAt: now })
            }
          }
        }

        audit(
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
        )
      }, 'Could not save the website.'),

    deleteWebsite: (id) =>
      withErrorToast(async () => {
        const before = get().websites.find((w) => w.id === id)
        if (!before) return
        const batch = newBatch()
        batch.delete(refAt('websites', id))
        for (const m of get().migrations.filter((m) => m.websiteId === id)) {
          batch.delete(refAt('migrations', m.id))
          for (const ref of await collectSubDocRefs('migrations', m.id, 'logs')) batch.delete(ref)
        }
        for (const p of get().priorities.filter((p) => p.websiteId === id)) batch.delete(refAt('priorities', p.id))
        await batch.commit()
        audit('Deleted Website', 'Websites', before.name, 'Existing', '—')
      }, 'Could not delete the website.'),

    /* --------------------------- Migrations -------------------------- */

    addMigration: (input) =>
      withErrorToast(async () => {
        const now = nowIso()
        const order = Math.min(0, ...get().migrations.filter((m) => m.stage === input.stage).map((m) => m.order)) - 1
        const id = await addNewDoc('migrations', { ...input, order, startedAt: now, updatedAt: now })
        const site = get().websites.find((w) => w.id === input.websiteId)
        audit('Created Migration', 'Migration', site?.name ?? 'Website', '—', 'Created')
        return id
      }, 'Could not create the migration.'),

    updateMigration: (id, patch) =>
      withErrorToast(async () => {
        const before = get().migrations.find((m) => m.id === id)
        if (!before) return
        if (patch.stage && patch.stage !== before.stage) {
          // Stage transitions go through moveMigration so side-effects stay in one place.
          const { stage, ...rest } = patch
          if (Object.keys(rest).length > 0) {
            await patchDoc('migrations', id, { ...rest, updatedAt: nowIso() })
          }
          await get().moveMigration(id, stage)
          return
        }
        const site = get().websites.find((w) => w.id === before.websiteId)
        const progressChanged = patch.progress !== undefined && patch.progress !== before.progress
        await patchDoc('migrations', id, { ...patch, updatedAt: nowIso() })
        audit(
          progressChanged ? 'Updated Progress' : 'Updated Migration',
          'Migration',
          site?.name ?? 'Website',
          progressChanged ? `${before.progress}%` : 'Edited',
          progressChanged ? `${patch.progress}%` : 'Saved',
        )
      }, 'Could not save the migration.'),

    moveMigration: (id, stage, order) =>
      withErrorToast(async () => {
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
        const targetOrder =
          order !== undefined
            ? order
            : Math.min(0, ...s.migrations.filter((m) => m.stage === stage).map((m) => m.order)) - 1

        await patchDoc('migrations', id, { stage, order: targetOrder, progress, updatedAt: now })

        if (stageChanged) {
          await addSubDoc('migrations', id, 'logs', {
            timestamp: now,
            title: `Moved to ${MIGRATION_STAGE_LABELS[stage]}`,
            detail: `Stage changed from ${MIGRATION_STAGE_LABELS[before.stage]}`,
          })
          audit(
            'Updated Migration Status',
            'Migration',
            site?.name ?? 'Website',
            MIGRATION_STAGE_LABELS[before.stage],
            MIGRATION_STAGE_LABELS[stage],
          )

          // Completing a migration flips the website to Next.js (and vice versa).
          if (site) {
            if (stage === 'completed' && site.framework !== 'nextjs') {
              await patchDoc('websites', site.id, { framework: 'nextjs', updatedAt: now })
            } else if (before.stage === 'completed' && stage !== 'completed' && site.framework !== 'react') {
              await patchDoc('websites', site.id, { framework: 'react', updatedAt: now })
            }
          }

          if (stage === 'completed') {
            await addNewDoc('notifications', {
              title: `${site?.name ?? 'Website'} migrated to Next.js`,
              description: 'Migration marked completed — dashboard metrics updated.',
              timestamp: now,
              read: false,
              kind: 'success',
            })
          }
        }
      }, 'Could not update the migration status.'),

    appendMigrationLog: (id, title, detail) =>
      withErrorToast(async () => {
        const now = nowIso()
        await patchDoc('migrations', id, { updatedAt: now })
        await addSubDoc('migrations', id, 'logs', { timestamp: now, title, detail })
      }, 'Could not add the log entry.'),

    deleteMigrations: (ids) =>
      withErrorToast(async () => {
        const s = get()
        const idSet = new Set(ids)
        const names = s.migrations
          .filter((m) => idSet.has(m.id))
          .map((m) => s.websites.find((w) => w.id === m.websiteId)?.name ?? 'Website')
        const batch = newBatch()
        for (const id of ids) {
          batch.delete(refAt('migrations', id))
          for (const ref of await collectSubDocRefs('migrations', id, 'logs')) batch.delete(ref)
        }
        await batch.commit()
        audit(
          ids.length > 1 ? 'Bulk Deleted Migrations' : 'Deleted Migration',
          'Migration',
          ids.length > 1 ? `${ids.length} migrations` : (names[0] ?? 'Migration'),
          'Existing',
          '—',
        )
      }, 'Could not delete the migration(s).'),

    bulkUpdateMigrations: (ids, patch) =>
      withErrorToast(async () => {
        const { stage, ...rest } = patch
        if (Object.keys(rest).length > 0) {
          const now = nowIso()
          const parts: string[] = []
          if (rest.developerId !== undefined) parts.push(`Developer → ${memberName(get().teamMembers, rest.developerId)}`)
          if (rest.priority) parts.push(`Priority → ${PRIORITY_LABELS[rest.priority]}`)
          const batch = newBatch()
          for (const id of ids) batch.update(refAt('migrations', id), { ...rest, updatedAt: now })
          await batch.commit()
          audit('Bulk Updated Migrations', 'Migration', `${ids.length} migrations`, 'Various', parts.join(', ') || 'Updated')
        }
        if (stage) {
          for (const id of ids) await get().moveMigration(id, stage)
        }
      }, 'Could not bulk update the migrations.'),

    /* ----------------------- Weekly priorities ----------------------- */

    addPriority: (input) =>
      withErrorToast(async () => {
        const id = await addNewDoc('priorities', input)
        audit('Created Priority', 'Priorities', input.title, '—', 'Created')
        return id
      }, 'Could not create the priority.'),

    updatePriority: (id, patch) =>
      withErrorToast(async () => {
        const before = get().priorities.find((p) => p.id === id)
        if (!before) return
        const parts: string[] = []
        if (patch.status && patch.status !== before.status) parts.push(`Status → ${patch.status}`)
        if (patch.priority && patch.priority !== before.priority) parts.push(`Priority → ${PRIORITY_LABELS[patch.priority]}`)
        if (patch.assignedToId !== undefined && patch.assignedToId !== before.assignedToId)
          parts.push(`Assignee → ${memberName(get().teamMembers, patch.assignedToId)}`)
        if (patch.dueDate && patch.dueDate !== before.dueDate) parts.push(`Due → ${patch.dueDate}`)
        await patchDoc('priorities', id, patch)
        audit('Updated Priority', 'Priorities', before.title, 'Various', parts.join(', ') || 'Saved')
      }, 'Could not save the priority.'),

    deletePriority: (id) =>
      withErrorToast(async () => {
        const before = get().priorities.find((p) => p.id === id)
        if (!before) return
        await removeDoc('priorities', id)
        audit('Deleted Priority', 'Priorities', before.title, 'Existing', '—')
      }, 'Could not delete the priority.'),

    /* --------------------------- Notifications ----------------------- */

    addNotification: (n) =>
      withErrorToast(async () => {
        await addNewDoc('notifications', { ...n, timestamp: nowIso(), read: false })
      }, 'Could not add the notification.'),

    markNotificationRead: (id) =>
      withErrorToast(async () => {
        await patchDoc('notifications', id, { read: true })
      }, 'Could not update the notification.'),

    markAllNotificationsRead: () =>
      withErrorToast(async () => {
        const unread = get().notifications.filter((n) => !n.read)
        if (unread.length === 0) return
        const batch = newBatch()
        for (const n of unread) batch.update(refAt('notifications', n.id), { read: true })
        await batch.commit()
      }, 'Could not update notifications.'),
  }
})
