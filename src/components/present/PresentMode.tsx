import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, CalendarClock, GitBranch, Presentation, Users, X } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { clientSummary, onboardingMetrics, prioritiesForWeek } from '@/utils/selectors'
import { MIGRATABLE_FRAMEWORKS } from '@/types'
import { fmtFullDate, weekKeyOf, weekLabel } from '@/utils/date'
import { AnimatedNumber } from '@/components/common/AnimatedNumber'
import { Button } from '@/components/common/Button'
import { ProgressBar } from '@/components/common/ProgressBar'

interface PresentModeProps {
  open: boolean
  onClose: () => void
}

/**
 * Full-screen, founder-facing slideshow built from live data. Deliberately
 * plain-language and stripped of admin/ops detail — for presenting progress
 * in a meeting, not for working the data.
 */
export function PresentMode({ open, onClose }: PresentModeProps) {
  const clients = useAppStore((s) => s.clients)
  const websites = useAppStore((s) => s.websites)
  const migrations = useAppStore((s) => s.migrations)
  const priorities = useAppStore((s) => s.priorities)

  const [slide, setSlide] = useState(0)

  const clients_ = useMemo(() => clientSummary(clients), [clients])
  const ordering = useMemo(() => onboardingMetrics(websites), [websites])
  const thisWeek = useMemo(() => {
    const key = weekKeyOf()
    return { key, items: prioritiesForWeek(priorities, key) }
  }, [priorities])

  const orderingPct = ordering.total ? Math.round((ordering.active / ordering.total) * 100) : 0

  const clientNames = useMemo(
    () => ({
      total: clients.map((c) => c.name).sort((a, b) => a.localeCompare(b)),
      live: clients.filter((c) => c.status === 'active').map((c) => c.name).sort((a, b) => a.localeCompare(b)),
      inProgress: clients.filter((c) => c.status === 'in-progress').map((c) => c.name).sort((a, b) => a.localeCompare(b)),
    }),
    [clients],
  )

  // A site counts as "live" the moment its framework is Next.js, regardless
  // of whether a formal migration record was ever created for it (several
  // imported sites started life on Next.js with no migration to track).
  // Splitting on that same signal keeps the three buckets — and the
  // migration % above them — adding up to the same total.
  const migrationGroups = useMemo(() => {
    const inScope = websites.filter((w) => MIGRATABLE_FRAMEWORKS.includes(w.framework) || migrations.some((m) => m.websiteId === w.id))
    const nameOf = (w: (typeof websites)[number]) => clients.find((c) => c.id === w.clientId)?.name ?? w.name
    const live = inScope.filter((w) => w.framework === 'nextjs').map(nameOf).sort((a, b) => a.localeCompare(b))
    const withRecord = inScope.filter((w) => w.framework !== 'nextjs' && migrations.some((m) => m.websiteId === w.id))
    const noRecord = inScope.filter((w) => w.framework !== 'nextjs' && !migrations.some((m) => m.websiteId === w.id))
    return {
      total: inScope.length,
      live,
      building: withRecord.map(nameOf).sort((a, b) => a.localeCompare(b)),
      notStarted: noRecord.map(nameOf).sort((a, b) => a.localeCompare(b)),
    }
  }, [websites, clients, migrations])

  const migrationPct = migrationGroups.total ? Math.round((migrationGroups.live.length / migrationGroups.total) * 100) : 0

  const slides = [
    <TitleSlide key="title" />,
    <ClientsSlide key="clients" summary={clients_} names={clientNames} orderingPct={orderingPct} orderingTotal={ordering.total} />,
    <MigrationSlide key="migration" pct={migrationPct} total={migrationGroups.total} names={migrationGroups} />,
    <PrioritiesSlide key="priorities" weekLabel={weekLabel(thisWeek.key)} items={thisWeek.items} websites={websites} />,
    <ClosingSlide key="closing" />,
  ]

  useEffect(() => {
    if (open) setSlide(0)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight' || e.key === ' ') setSlide((s) => Math.min(s + 1, slides.length - 1))
      else if (e.key === 'ArrowLeft') setSlide((s) => Math.max(s - 1, 0))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // slides.length is static
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-canvas text-ink">
      <div className="flex items-center justify-between px-6 py-4">
        <span className="inline-flex items-center gap-2 text-xs font-medium text-faint">
          <Presentation className="h-3.5 w-3.5" aria-hidden />
          Present mode
        </span>
        <button
          type="button"
          onClick={onClose}
          className="focus-ring inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-sub transition-colors hover:bg-elev hover:text-ink"
        >
          <X className="h-3.5 w-3.5" aria-hidden />
          Exit
        </button>
      </div>

      <div className="relative flex flex-1 items-center justify-center overflow-hidden px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="w-full max-w-3xl"
          >
            {slides[slide]}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-center gap-4 pb-8">
        <Button variant="outline" size="sm" onClick={() => setSlide((s) => Math.max(s - 1, 0))} disabled={slide === 0}>
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          Back
        </Button>
        <div className="flex items-center gap-1.5" role="tablist" aria-label="Slides">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === slide}
              aria-label={`Slide ${i + 1}`}
              onClick={() => setSlide(i)}
              className={`h-1.5 rounded-full transition-all ${i === slide ? 'w-6 bg-primary-500' : 'w-1.5 bg-line-strong/60 hover:bg-line-strong'}`}
            />
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSlide((s) => Math.min(s + 1, slides.length - 1))}
          disabled={slide === slides.length - 1}
        >
          Next
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Button>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Slides                                                              */
/* ------------------------------------------------------------------ */

function TitleSlide() {
  return (
    <div className="text-center">
      <p className="text-sm font-medium uppercase tracking-widest text-faint">Brisque Ops</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight text-ink sm:text-5xl">Weekly Update</h1>
      <p className="mt-3 text-base text-sub">{fmtFullDate()}</p>
    </div>
  )
}

function StatTile({ value, label, names }: { value: number; label: string; names?: string[] }) {
  const [open, setOpen] = useState(false)
  const clickable = !!names && names.length > 0
  return (
    <>
      <button
        type="button"
        disabled={!clickable}
        onClick={() => setOpen(true)}
        className={`w-full rounded-2xl border border-line bg-card px-5 py-4 text-center transition-colors ${clickable ? 'focus-ring cursor-pointer hover:border-line-strong hover:bg-elev' : ''}`}
      >
        <AnimatedNumber value={value} className="block text-3xl font-bold tabular-nums tracking-tight text-ink" />
        <p className="mt-1 text-xs font-medium text-sub">{label}</p>
      </button>
      {clickable && open && <NameListPopup title={label} names={names} onClose={() => setOpen(false)} />}
    </>
  )
}

function NameListPopup({ title, names, onClose }: { title: string; names: string[]; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-6"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="max-h-[70vh] w-full max-w-sm overflow-hidden rounded-2xl border border-line bg-card shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <p className="text-sm font-semibold text-ink">
            {title} <span className="font-normal text-faint">({names.length})</span>
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="focus-ring rounded-md p-1 text-faint transition-colors hover:bg-elev hover:text-ink"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
        <ul className="max-h-[calc(70vh-49px)] divide-y divide-line overflow-y-auto">
          {names.map((name) => (
            <li key={name} className="px-4 py-2 text-sm text-ink">
              {name}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function ClientsSlide({
  summary,
  names,
  orderingPct,
  orderingTotal,
}: {
  summary: { total: number; active: number; inProgress: number; completed: number }
  names: { total: string[]; live: string[]; inProgress: string[] }
  orderingPct: number
  orderingTotal: number
}) {
  return (
    <div>
      <SlideHeading icon={Users} eyebrow="Clients" title="Who we're working with" />
      <div className="mt-8 grid grid-cols-3 gap-3">
        <StatTile value={summary.total} label="Total clients" names={names.total} />
        <StatTile value={summary.active} label="Live" names={names.live} />
        <StatTile value={summary.inProgress} label="In progress" names={names.inProgress} />
      </div>
      <div className="mt-6 rounded-2xl border border-line bg-card px-5 py-4">
        <div className="flex items-baseline justify-between">
          <p className="text-sm font-medium text-sub">Online ordering rollout</p>
          <p className="text-sm font-semibold tabular-nums text-ink">{orderingPct}%</p>
        </div>
        <ProgressBar value={orderingPct} tone="emerald" size="md" className="mt-2" aria-label="Embedded ordering rollout" />
        <p className="mt-2 text-xs text-faint">
          {orderingTotal ? `Ordering is live for ${orderingPct}% of client sites.` : 'No client sites registered yet.'}
        </p>
      </div>
    </div>
  )
}

function MigrationSlide({
  pct,
  total,
  names,
}: {
  pct: number
  total: number
  names: { live: string[]; building: string[]; notStarted: string[] }
}) {
  return (
    <div>
      <SlideHeading icon={GitBranch} eyebrow="Platform migration" title="Moving every client site to Next.js" />
      <div className="mt-8 text-center">
        <AnimatedNumber value={pct} format={(v) => `${Math.round(v)}%`} className="text-6xl font-bold tabular-nums tracking-tight text-ink" />
        <p className="mt-1 text-sm text-sub">of client sites are on Next.js</p>
        <ProgressBar value={pct} tone="primary" size="md" className="mx-auto mt-4 max-w-sm" aria-label="Migration completion" />
      </div>
      <div className="mt-8 grid grid-cols-3 gap-3">
        <StatTile value={names.live.length} label="Live" names={names.live} />
        <StatTile value={names.building.length} label="In progress" names={names.building} />
        <StatTile value={names.notStarted.length} label="Not started" names={names.notStarted} />
      </div>
      <p className="mt-4 text-center text-xs text-faint">{total} client sites total</p>
    </div>
  )
}

function PrioritiesSlide({
  weekLabel: label,
  items,
  websites,
}: {
  weekLabel: string
  items: { id: string; title: string; websiteId: string; status: string }[]
  websites: { id: string; name: string }[]
}) {
  const shown = items.slice(0, 6)
  const extra = items.length - shown.length
  const STATUS_TEXT: Record<string, string> = {
    'not-started': 'Not started',
    'in-progress': 'In progress',
    blocked: 'Blocked',
    review: 'In review',
    completed: 'Done',
  }
  return (
    <div>
      <SlideHeading icon={CalendarClock} eyebrow={label} title="What the team is focused on" />
      {shown.length === 0 ? (
        <p className="mt-8 text-center text-sm text-faint">No priorities logged for this week yet.</p>
      ) : (
        <ul className="mt-6 space-y-2">
          {shown.map((item) => {
            const site = websites.find((w) => w.id === item.websiteId)
            return (
              <li
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-line bg-card px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{item.title}</p>
                  {site && <p className="truncate text-xs text-faint">{site.name}</p>}
                </div>
                <span className="shrink-0 rounded-full border border-line-strong/60 px-2.5 py-1 text-2xs font-medium text-sub">
                  {STATUS_TEXT[item.status] ?? item.status}
                </span>
              </li>
            )
          })}
        </ul>
      )}
      {extra > 0 && <p className="mt-3 text-center text-xs text-faint">+{extra} more this week</p>}
    </div>
  )
}

function ClosingSlide() {
  return (
    <div className="text-center">
      <h2 className="text-3xl font-bold tracking-tight text-ink">Thank you</h2>
      <p className="mt-3 text-sm text-sub">Questions?</p>
    </div>
  )
}

function SlideHeading({ icon: Icon, eyebrow, title }: { icon: typeof Users; eyebrow: string; title: string }) {
  return (
    <div className="text-center">
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-faint">
        <Icon className="h-3.5 w-3.5" aria-hidden />
        {eyebrow}
      </span>
      <h2 className="mt-2 text-2xl font-bold tracking-tight text-ink sm:text-3xl">{title}</h2>
    </div>
  )
}
