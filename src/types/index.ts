/* ------------------------------------------------------------------ */
/* Core domain types — the single contract shared by every module.     */
/* ------------------------------------------------------------------ */

export type OrderingStatus = 'active' | 'in-progress' | 'no-need' | 'not-started'
export type Framework = 'react' | 'nextjs' | 'html' | 'shopify' | 'wordpress' | 'wix' | 'unknown'
export type MigrationStage = 'planning' | 'in-progress' | 'testing' | 'completed'
export type Priority = 'high' | 'medium' | 'low'
export type ClientStatus = 'active' | 'in-progress' | 'completed' | 'blocked'
export type ClientStage =
  | 'onboarded'
  | 'requirements'
  | 'ordering'
  | 'migration'
  | 'qa'
  | 'completed'
export type PriorityItemStatus =
  | 'not-started'
  | 'in-progress'
  | 'blocked'
  | 'review'
  | 'completed'
export type FeatureCategory =
  | 'ordering'
  | 'reservation'
  | 'seo'
  | 'analytics'
  | 'marketing'
  | 'uiux'
  | 'infrastructure'
export type DeploymentStatus = 'deployed' | 'testing' | 'planned'
export type Role = 'super-admin' | 'admin' | 'manager' | 'developer' | 'viewer'
export type Environment = 'Production' | 'Staging' | 'QA'
export type QaSignoff = 'signed-off' | 'pending' | 'not-required'
/** Rollout state for a per-client capability (Offers, Loyalty, Reservation, Event Ordering). */
export type CapabilityState = 'enabled' | 'in-progress' | 'unavailable'

/**
 * Firestore `users/{uid}` doc — keyed by Firebase Auth UID. This is the
 * Firebase-backed profile/role source; `TeamMember` below stays for the
 * still-local-only Zustand data until the rest of the store is wired to
 * Firestore.
 */
export interface UserProfile {
  uid: string
  name: string
  email: string
  role: Role
  title: string
  color: string
  active: boolean
  createdAt: string // ISO
}

export interface TeamMember {
  id: string
  name: string
  email: string
  role: Role
  title: string
  /** Tailwind bg class used by UserAvatar, e.g. 'bg-indigo-500' */
  color: string
  active: boolean
  createdAt: string // ISO
}

export interface ActivityEvent {
  id: string
  date: string // ISO
  title: string
  description?: string
}

/** Per-client rollout state for the capabilities the Admin Panel manages. */
export interface ClientCapabilities {
  ordering: CapabilityState
  offers: CapabilityState
  loyalty: CapabilityState
  reservation: CapabilityState
  eventOrdering: CapabilityState
  inFramework: CapabilityState
}

export interface Client {
  id: string
  name: string
  phone: string
  location: string
  status: ClientStatus
  /** Onboarding journey stage (drives the Timeline view) */
  stage: ClientStage
  priority: Priority
  notes: string
  /** Feature rollout state — edited from the Admin Panel's Features tab. */
  capabilities: ClientCapabilities
  createdAt: string
  updatedAt: string
}

export interface Website {
  id: string
  name: string
  domain: string
  clientId: string
  framework: Framework
  orderingStatus: OrderingStatus
  orderingStage: string // human label, e.g. 'Menu setup', 'Payments QA'
  orderingStartDate: string | null
  orderingCompletedDate: string | null
  /** Deployment tier this site currently runs in. */
  environment: Environment
  /** QA regression sign-off state. */
  qaSignoff: QaSignoff
  /** Public URL customers/reviewers use (defaults to https://{domain}). */
  liveUrl: string
  /** Figma design file URL for this website, if one exists. */
  figmaLink: string
  /** Date the site went live in production (distinct from ordering start/completion). */
  deployedDate: string | null
  /** Source repo for this website's codebase, if it has its own (e.g. 'org/client-site'). */
  repoName: string
  /** Branch actively being developed against. */
  devLatestBranch: string
  /** Branch deployed to production. */
  releaseBranch: string
  addedAt: string
  updatedAt: string
}

export interface Feature {
  id: string
  name: string
  description: string
  category: FeatureCategory
  status: DeploymentStatus
  enabled: boolean
  /** Client ids this feature is rolled out to */
  supportedClientIds: string[]
  createdAt: string
  updatedAt: string
}

export interface MigrationLog {
  id: string
  timestamp: string // ISO
  title: string
  detail: string
}

export interface Migration {
  id: string
  websiteId: string
  developerId: string | null
  stage: MigrationStage
  progress: number // 0..100
  priority: Priority
  dueDate: string // ISO date
  startedAt: string
  updatedAt: string
  /** Sort position inside its kanban column */
  order: number
  /** Target quarter for cutover, e.g. 'Q1 2026'. */
  quarter: string
  /** Framework this migration is moving the website to. */
  targetStack: Framework
}

export interface PriorityItem {
  id: string
  websiteId: string
  /** ISO date of the Monday that starts the week this item belongs to */
  weekStart: string
  title: string
  priority: Priority
  assignedToId: string | null
  dueDate: string
  status: PriorityItemStatus
}

export interface AuditLog {
  id: string
  timestamp: string
  actor: string
  action: string // e.g. 'Updated Migration Status'
  module: 'Clients' | 'Websites' | 'Features' | 'Migration' | 'Priorities' | 'Team' | 'System'
  recordName: string
  previousValue: string
  newValue: string
}

export interface AppNotification {
  id: string
  title: string
  description: string
  timestamp: string
  read: boolean
  kind: 'info' | 'success' | 'warning'
}

/* ------------------------------------------------------------------ */
/* Permission matrix (frontend-only simulation)                        */
/* ------------------------------------------------------------------ */

export type Permission =
  | 'view-dashboard'
  | 'create-client'
  | 'edit-client'
  | 'delete-client'
  | 'manage-features'
  | 'manage-migration'
  | 'manage-users'

export const PERMISSION_LABELS: Record<Permission, string> = {
  'view-dashboard': 'View Dashboard',
  'create-client': 'Create Client',
  'edit-client': 'Edit Client',
  'delete-client': 'Delete Client',
  'manage-features': 'Manage Features',
  'manage-migration': 'Manage Migration',
  'manage-users': 'Manage Users',
}

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  'super-admin': [
    'view-dashboard',
    'create-client',
    'edit-client',
    'delete-client',
    'manage-features',
    'manage-migration',
    'manage-users',
  ],
  admin: [
    'view-dashboard',
    'create-client',
    'edit-client',
    'delete-client',
    'manage-features',
    'manage-migration',
    'manage-users',
  ],
  manager: ['view-dashboard', 'create-client', 'edit-client', 'manage-features', 'manage-migration'],
  developer: ['view-dashboard', 'edit-client', 'manage-migration'],
  viewer: ['view-dashboard'],
}

export const ROLE_LABELS: Record<Role, string> = {
  'super-admin': 'Super Admin',
  admin: 'Admin',
  manager: 'Manager',
  developer: 'Developer',
  viewer: 'Viewer',
}

/* ------------------------------------------------------------------ */
/* Display label maps (used by badges, filters, forms)                 */
/* ------------------------------------------------------------------ */

export const ORDERING_STATUS_LABELS: Record<OrderingStatus, string> = {
  active: 'Active',
  'in-progress': 'In Progress',
  'no-need': 'No Need',
  'not-started': 'Not Started',
}

export const FRAMEWORK_LABELS: Record<Framework, string> = {
  react: 'React',
  nextjs: 'Next.js',
  html: 'HTML',
  shopify: 'Shopify',
  wordpress: 'WordPress',
  wix: 'WIX',
  unknown: 'Unknown',
}

/** Frameworks in scope for the React → Next.js migration pipeline (everything else is tracked but not migrated). */
export const MIGRATABLE_FRAMEWORKS: Framework[] = ['react', 'nextjs']

export const MIGRATION_STAGE_LABELS: Record<MigrationStage, string> = {
  planning: 'Planning',
  'in-progress': 'In Progress',
  testing: 'Testing',
  completed: 'Completed',
}

export const PRIORITY_LABELS: Record<Priority, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}

export const CLIENT_STATUS_LABELS: Record<ClientStatus, string> = {
  active: 'Active',
  'in-progress': 'In Progress',
  completed: 'Completed',
  blocked: 'Blocked',
}

export const CLIENT_STAGE_LABELS: Record<ClientStage, string> = {
  onboarded: 'Onboarded',
  requirements: 'Requirements',
  ordering: 'Ordering',
  migration: 'Migration',
  qa: 'QA',
  completed: 'Completed',
}

export const CLIENT_STAGES_ORDERED: ClientStage[] = [
  'onboarded',
  'requirements',
  'ordering',
  'migration',
  'qa',
  'completed',
]

export const PRIORITY_ITEM_STATUS_LABELS: Record<PriorityItemStatus, string> = {
  'not-started': 'Not Started',
  'in-progress': 'In Progress',
  blocked: 'Blocked',
  review: 'Review',
  completed: 'Completed',
}

export const FEATURE_CATEGORY_LABELS: Record<FeatureCategory, string> = {
  ordering: 'Ordering',
  reservation: 'Reservation',
  seo: 'SEO',
  analytics: 'Analytics',
  marketing: 'Marketing',
  uiux: 'UI/UX',
  infrastructure: 'Infrastructure',
}

export const DEPLOYMENT_STATUS_LABELS: Record<DeploymentStatus, string> = {
  deployed: 'Deployed',
  testing: 'Testing',
  planned: 'Planned',
}

export const MIGRATION_STAGES_ORDERED: MigrationStage[] = [
  'planning',
  'in-progress',
  'testing',
  'completed',
]

export const ENVIRONMENT_LABELS: Record<Environment, string> = {
  Production: 'Production',
  Staging: 'Staging',
  QA: 'QA',
}

export const ENVIRONMENTS_ORDERED: Environment[] = ['Production', 'Staging', 'QA']

export const QA_SIGNOFF_LABELS: Record<QaSignoff, string> = {
  'signed-off': 'Signed Off',
  pending: 'Pending',
  'not-required': 'Not Required',
}

export const QA_SIGNOFF_ORDERED: QaSignoff[] = ['signed-off', 'pending', 'not-required']

export const CAPABILITY_STATE_LABELS: Record<CapabilityState, string> = {
  enabled: 'Enabled',
  'in-progress': 'In Progress',
  unavailable: 'Not Available',
}

export const CAPABILITY_STATES_ORDERED: CapabilityState[] = ['enabled', 'in-progress', 'unavailable']

export const CAPABILITY_LABELS: Record<keyof ClientCapabilities, string> = {
  ordering: 'Ordering',
  offers: 'Offers',
  loyalty: 'Loyalty',
  reservation: 'Reservation',
  eventOrdering: 'Event Ordering',
  inFramework: 'In Framework',
}

/** Quarter options offered by Migration Quarter pickers (current year ± 1). */
export function quarterOptions(centerYear = new Date().getFullYear()): string[] {
  const years = [centerYear - 1, centerYear, centerYear + 1]
  return years.flatMap((y) => ['Q1', 'Q2', 'Q3', 'Q4'].map((q) => `${q} ${y}`))
}
