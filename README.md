# Maghil Ops Console

A frontend-only, desktop-first admin dashboard for managing website onboarding,
client tracking, feature rollout, and React → Next.js migrations across the
Maghil restaurant client portfolio.

**100% frontend** — no backend, no APIs, no auth server. All data is realistic
mock data managed in a centralized Zustand store and persisted to
`localStorage`. Realtime activity is simulated on the client.

## Modules

- **Dashboard** — onboarding + migration overview metrics, donut chart, weekly
  priority table with week navigation
- **Client Tracker** — advanced TanStack table (search, filters, sorting,
  column visibility, row expansion, bulk edit), onboarding-journey timeline
  view, full client CRUD with Zod validation
- **Features** — collapsible category groups, feature cards with animated
  toggles, comparison view, full CRUD
- **Migration** — drag-and-drop kanban (dnd-kit), details drawer with
  migration logs, React vs Next.js comparison, batch actions
- **Admin Panel** — unified data management with inline editing, users & roles
  with a permission matrix, live audit trail, system settings

## Stack

React 19 · Vite · TypeScript (strict) · Tailwind CSS · React Router ·
Zustand (+persist) · TanStack Table · dnd-kit · Recharts · Framer Motion ·
React Hook Form + Zod · Lucide icons · date-fns

## Getting started

```bash
npm install
npm run dev        # http://localhost:5199
```

Other scripts: `npm run build`, `npm run typecheck`, `npm run lint`,
`npm run preview`.

## Notes

- Theme (light/dark), sidebar state, and all data edits persist across
  reloads via `localStorage`. Use **profile menu → Reset demo data** (or Admin
  Panel → System Settings) to restore the seed dataset.
- `Ctrl/Cmd + K` opens the global command palette (navigation, quick create,
  entity search, theme toggle).
- Architecture and module contracts are documented in
  [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
