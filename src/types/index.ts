/* ------------------------------------------------------------------ */
/* Core domain types — the single contract shared by every module.     */
/* ------------------------------------------------------------------ */

export type OrderingStatus = 'active' | 'in-progress' | 'no-need' | 'not-started'
export type Framework = 'react' | 'nextjs'
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

export interface Client {
  id: string
  name: string
  contactName: string
  email: string
  phone: string
  location: string
  status: ClientStatus
  /** Onboarding journey stage (drives the Timeline view) */
  stage: ClientStage
  priority: Priority
  assignedToId: string | null
  notes: string
  activity: ActivityEvent[]
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
  logs: MigrationLog[]
  /** Sort position inside its kanban column */
  order: number
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
}

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
