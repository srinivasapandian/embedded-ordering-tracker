# Brisque Ops Console — Architecture & Module Contract

Frontend-only React 19 + Vite + TypeScript admin dashboard. No backend: all data
lives in a centralized Zustand store persisted to localStorage.

## Stack

React 19, Vite, TypeScript (strict), Tailwind CSS 3.4 (class dark mode),
react-router-dom v7, zustand v5 (+persist), lucide-react, recharts 2,
framer-motion, @tanstack/react-table v8, @dnd-kit (core/sortable),
react-hook-form + zod (@hookform/resolvers), date-fns v4.

Path alias: `@/` → `src/`.

## Design conventions (MUST follow)

- Semantic tokens (defined in `src/index.css`, mapped in `tailwind.config.js`):
  `bg-canvas` (page), `bg-card` (panels), `bg-elev` (hover/wells),
  `border-line`, `border-line-strong`, `text-ink`, `text-sub`, `text-faint`,
  `primary-*` (indigo scale). These auto-switch for dark mode — NEVER hardcode
  `bg-white`/`text-slate-900` for surfaces/text; use tokens. Status colors use
  vanilla Tailwind (emerald/amber/red/sky/violet) WITH `dark:` variants —
  prefer the shared badge components which already handle this.
- Utility classes: `.app-card` (card shell), `.focus-ring` (a11y focus),
  `.th-cell` / `.td-cell` (dense table cells), shadow tokens `shadow-card`,
  `shadow-pop`, `shadow-drawer`, text size `text-2xs`.
- `cn(...)` from `@/utils/cn` for conditional classes.
- Density: desktop-first; `text-sm` body, `text-xs` secondary, compact paddings
  (h-8/h-9 controls). Page titles `text-xl font-bold`. Do not use huge type.
- Animations: fast + subtle (framer-motion, 0.15–0.3s). Entrance stagger ≤ 0.05s.
- Icons: lucide-react, 14–18px inside controls, `aria-hidden` always.
- Every interactive element needs an accessible name; status is always dot+text
  (never color alone). Modals/drawers/popovers from common components already
  handle Escape/focus.

## Data model (src/types/index.ts)

Core entities and relations (ids are strings):

- `Client` —(1:N)→ `Website` (via `website.clientId`). A client's FIRST website
  in the array is its "primary" site shown on tracker rows.
- `Website.framework`: `'react' | 'nextjs'`; `Website.orderingStatus`:
  `'active' | 'in-progress' | 'no-need' | 'not-started'`. Dashboard metrics
  derive from websites.
- `Migration` —(N:1)→ `Website` (`migration.websiteId`), has `stage`
  (`planning | in-progress | testing | completed`), `progress` 0..100, `logs`,
  `order` (kanban sort within column), `developerId`.
- `PriorityItem` —(N:1)→ `Website`; `weekStart` = Monday `'yyyy-MM-dd'` key.
- `Feature` (category, deployment status, enabled, supportedClientIds).
- `TeamMember` (role: super-admin/admin/manager/developer/viewer; `color` is a
  Tailwind bg class for avatars).
- `AuditLog`, `AppNotification`.
- Label maps + ordered lists exported from types: `ORDERING_STATUS_LABELS`,
  `FRAMEWORK_LABELS`, `MIGRATION_STAGE_LABELS`, `PRIORITY_LABELS`,
  `CLIENT_STATUS_LABELS`, `CLIENT_STAGE_LABELS`, `CLIENT_STAGES_ORDERED`,
  `PRIORITY_ITEM_STATUS_LABELS`, `FEATURE_CATEGORY_LABELS`,
  `DEPLOYMENT_STATUS_LABELS`, `MIGRATION_STAGES_ORDERED`, `ROLE_LABELS`,
  `ROLE_PERMISSIONS`, `PERMISSION_LABELS`.

## Centralized store — `useAppStore` (src/store/appStore.ts)

Single source of truth; persisted (`eot-data`). EVERY mutation already writes
an audit entry automatically — do NOT write audit logs manually.

State: `clients, websites, features, migrations, priorities, teamMembers,
auditLogs, notifications, baseline, currentUserId, actingRole,
lastRealtimeEvent`.

Key cross-module semantics (already implemented — rely on them):
- `moveMigration(id, stage, order?)`: sets stage/order, bumps progress floors,
  appends a stage log; **completed → website.framework becomes 'nextjs'** (and
  leaving completed reverts to 'react'), fires a notification. Dashboard charts
  update automatically because they derive from websites.
- `updateWebsite(id, {framework})`: framework flip syncs any open migration
  (nextjs ⇒ completed, react ⇒ back to testing).
- `saveClientForm(clientId|null, values: ClientFormValues)`: create-or-update
  of client + primary website in one call (the Client modal should use this).
- `bulkUpdateClients(ids, patch)` supports status/priority/assignee/stage plus
  `orderingStatus`/`framework` (applied to all of the clients' websites).
- Actions available (see file for exact signatures): saveClientForm,
  updateClient, deleteClient(s), duplicateClient, bulkUpdateClients,
  addWebsite, updateWebsite, deleteWebsite, addFeature, updateFeature,
  deleteFeature, duplicateFeature, toggleFeature, addMigration,
  updateMigration, moveMigration, appendMigrationLog, deleteMigrations,
  bulkUpdateMigrations, addPriority, updatePriority, deletePriority,
  addTeamMember, updateTeamMember, deleteTeamMember, addNotification,
  markNotificationRead, markAllNotificationsRead, resetAll, tickRealtime,
  setActingRole, can(permission).
- `baseline` holds last-week snapshot numbers for dashboard trend deltas.
- Subscribe narrowly: `useAppStore((s) => s.clients)` etc. Never snapshot store
  data into local state for CRUD — derive with `useMemo`.

Toasts: `import { toast } from '@/store/toastStore'` →
`toast.success|error|info|warning(title, description?)`. Components fire
toasts after actions (store does not).

## Selectors (src/utils/selectors.ts)

`onboardingMetrics(websites)`, `migrationMetrics(websites, migrations)`,
`clientSummary(clients)`, `featureSummary(features)`, `memberById`,
`websiteById`, `clientById`, `primaryWebsite(websites, clientId)`,
`websitesForClient`, `migrationForWebsite`, `prioritiesForWeek(priorities, weekKey)`.

## Date utils (src/utils/date.ts)

`fmtDate, fmtDateTime, fmtTime, fmtFullDate, relativeDay ('Today'/'Yesterday'/'Aug 18'),
timeAgo, weekKeyOf(), shiftWeekKey(key, n), weekLabel(key) → 'August 3rd Week',
weekRangeLabel, isOverdue, isoDaysFromNow, isoMinutesAgo`.
Also `pct(part,total)`, `pctNumber`, `initials`, `clamp`, `titleCase` from
`@/utils/format`; `uid(prefix)` from `@/utils/id`.

## Common components (src/components/common/) — USE THESE, don't rebuild

- `Button` (variant: primary/secondary/outline/ghost/danger; size xs/sm/md;
  loading), `IconButton` (needs aria-label)
- `Input`, `Textarea`, `Select` (native styled), `Checkbox` (indeterminate),
  `Switch` (animated, needs aria-label), `FormField` (label+error wrapper —
  pass `htmlFor`, `error`)
- `Badge` (tone), `StatusBadge` (accepts ANY status literal incl. frameworks),
  `PriorityBadge`, `UserAvatar` (member, size, showName, tooltip)
- `MetricCard` (title/value/icon/tone/percent/progress/trend/loading/index),
  `AnimatedNumber`, `ProgressBar`, `DonutChart` (slices need concrete hex colors)
- `Modal` (title/footer/size sm-xl), `Drawer` (right side, size md/lg/xl,
  headerExtra), `ConfirmDialog` (destructive), `Popover`, `DropdownMenu`
  (trigger fn + groups), `FilterDropdown` (multi-select filter chips),
  `SearchInput`, `Tabs` (underline/pills, give unique layoutId), `Pagination`
- `Skeleton`, `SkeletonCard`, `SkeletonTable`, `SkeletonChart`, `EmptyState`,
  `ErrorState`, `ErrorBoundary`, `Toaster` (already mounted), `Kbd`,
  `Tooltip` (single React element child), `Timeline` (entries w/ dateLabel),
  `PageHeader` (title/description/actions/children)
- TanStack helpers in `common/table.tsx`: `TableShell`, `SortableHeader`,
  `ColumnToggleMenu`, `DataTablePagination`. Use `.th-cell`/`.td-cell` classes,
  row hover `hover:bg-elev/60`, header row `border-b border-line bg-elev/40`.
  Set `meta: { label: '...' }` on columns for the visibility menu.

## Hooks

- `useSimulatedLoad(delayMs?, failChance?)` → `{loading, error, reload}` —
  gate page content with skeletons; wire "Refresh" buttons to `reload()` and
  demo error states via `reload({fail:true})` when appropriate.
- `useDebounce(value, ms)`, `useHotkey(key, fn, {ctrlOrCmd})`.
- `useMockRealtime()` is mounted globally in AppLayout — do NOT mount again.
  React to `useAppStore((s) => s.lastRealtimeEvent)` to flash "Updated"
  indicators (it carries `migrationId`).

## Cross-page URL params (implemented by page components)

- `/clients?new=1` opens the Create Client modal; `/clients?highlight=<id>`
  scrolls/expands that client. `/features?new=1`, `/features?q=<text>`,
  `/migration?new=1`, `/admin?tab=<clients|websites|features|migrations|priorities|team|roles|audit|settings>`,
  `/admin?tab=websites&q=<text>`.
  Read via `useSearchParams`; clear the param after consuming it.

## Hard rules

- No export/CSV/PDF/print features. No dashboard widget customization.
- No new dependencies. No backend calls. No lorem ipsum.
- Every button/filter/action must actually work against the store.
- Loading skeletons + empty states + error states for all data views.
- Destructive actions require ConfirmDialog.
- WCAG-minded: labels, focus-visible, keyboard paths, aria on status.
- TypeScript strict must pass (`npm run typecheck`).
