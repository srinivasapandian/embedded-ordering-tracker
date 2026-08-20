import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, NotebookPen, Plus, Trash2 } from 'lucide-react'
import type { Migration, MigrationLog, MigrationStage, Priority } from '@/types'
import { MIGRATION_STAGES_ORDERED, MIGRATION_STAGE_LABELS, PRIORITY_LABELS } from '@/types'
import { useAppStore } from '@/store/appStore'
import { toast } from '@/store/toastStore'
import { cn } from '@/utils/cn'
import { fmtDate, fmtTime, relativeDay, timeAgo } from '@/utils/date'
import { AnimatedNumber } from '@/components/common/AnimatedNumber'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { Drawer } from '@/components/common/Drawer'
import { FormField } from '@/components/common/FormField'
import { Input } from '@/components/common/Input'
import { PriorityBadge } from '@/components/common/PriorityBadge'
import { ProgressBar } from '@/components/common/ProgressBar'
import { Select } from '@/components/common/Select'
import { StatusBadge } from '@/components/common/StatusBadge'
import { STAGE_META } from './stageMeta'

const EMPTY_LOGS: MigrationLog[] = []

interface MigrationDrawerProps {
  migrationId: string | null
  onClose: () => void
}

/** Right-side drawer with inline editing, progress and the migration log feed. */
export function MigrationDrawer({ migrationId, onClose }: MigrationDrawerProps) {
  const live = useAppStore((s) =>
    migrationId ? s.migrations.find((m) => m.id === migrationId) : undefined,
  )
  const websites = useAppStore((s) => s.websites)
  const clients = useAppStore((s) => s.clients)
  const teamMembers = useAppStore((s) => s.teamMembers)
  const updateMigration = useAppStore((s) => s.updateMigration)
  const moveMigration = useAppStore((s) => s.moveMigration)
  const appendMigrationLog = useAppStore((s) => s.appendMigrationLog)
  const deleteMigrations = useAppStore((s) => s.deleteMigrations)

  // Keep the last snapshot so content stays visible during the exit animation.
  const lastRef = useRef<Migration | undefined>(undefined)
  if (live) lastRef.current = live
  const migration = live ?? lastRef.current
  const open = !!live

  const website = migration ? websites.find((w) => w.id === migration.websiteId) : undefined
  const client = website ? clients.find((c) => c.id === website.clientId) : undefined

  /* ------------------------- progress slider ------------------------- */
  const [sliderValue, setSliderValue] = useState(0)
  const slidingRef = useRef(false)
  const lastProgressToastRef = useRef(0)

  useEffect(() => {
    if (live && !slidingRef.current) setSliderValue(live.progress)
  }, [live])

  const commitProgress = () => {
    slidingRef.current = false
    if (!live || sliderValue === live.progress) return
    updateMigration(live.id, { progress: sliderValue })
    const now = Date.now()
    if (now - lastProgressToastRef.current > 1200) {
      lastProgressToastRef.current = now
      toast.success('Progress updated', `${website?.name ?? 'Migration'} is now at ${sliderValue}%`)
    }
  }

  /* ----------------------------- logs ------------------------------- */
  const [expandedLogs, setExpandedLogs] = useState<ReadonlySet<string>>(new Set())
  const [logTitle, setLogTitle] = useState('')
  const [logDetail, setLogDetail] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    // Reset transient UI state whenever a different migration is opened.
    setExpandedLogs(new Set())
    setLogTitle('')
    setLogDetail('')
    setConfirmDelete(false)
  }, [migrationId])

  const logGroups = useMemo(() => {
    const logs = migration?.logs ?? EMPTY_LOGS
    const sorted = [...logs].sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    const groups: Array<{ day: string; entries: MigrationLog[] }> = []
    for (const log of sorted) {
      const day = relativeDay(log.timestamp)
      const last = groups[groups.length - 1]
      if (last && last.day === day) last.entries.push(log)
      else groups.push({ day, entries: [log] })
    }
    return groups
  }, [migration?.logs])

  const toggleLog = (id: string) => {
    setExpandedLogs((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleAddLog = (e: React.FormEvent) => {
    e.preventDefault()
    if (!live || !logTitle.trim()) return
    appendMigrationLog(live.id, logTitle.trim(), logDetail.trim())
    toast.success('Log entry added', logTitle.trim())
    setLogTitle('')
    setLogDetail('')
  }

  /* --------------------------- field edits --------------------------- */
  const handleDeveloper = (value: string) => {
    if (!live) return
    updateMigration(live.id, { developerId: value || null })
    const member = teamMembers.find((m) => m.id === value)
    toast.success(
      'Developer updated',
      member ? `${website?.name ?? 'Migration'} assigned to ${member.name}` : 'Migration unassigned',
    )
  }

  const handlePriority = (value: Priority) => {
    if (!live) return
    updateMigration(live.id, { priority: value })
    toast.success('Priority updated', `${website?.name ?? 'Migration'} set to ${PRIORITY_LABELS[value]}`)
  }

  const handleStage = (value: MigrationStage) => {
    if (!live || value === live.stage) return
    moveMigration(live.id, value)
    toast.success('Migration status updated', `${website?.name ?? 'Website'} moved to ${MIGRATION_STAGE_LABELS[value]}`)
  }

  const handleDueDate = (value: string) => {
    if (!live || !value || value === live.dueDate) return
    updateMigration(live.id, { dueDate: value })
    toast.success('Due date updated', `Now due ${fmtDate(value)}`)
  }

  const handleDelete = () => {
    if (!migration) return
    deleteMigrations([migration.id])
    onClose()
    toast.success('Migration deleted', `${website?.name ?? 'Migration'} removed from the board`)
  }

  if (!migration) return null
  const meta = STAGE_META[migration.stage]

  return (
    <>
      <Drawer
        open={open}
        onClose={onClose}
        size="xl"
        title={website?.name ?? 'Migration'}
        description={website?.domain}
        headerExtra={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={migration.stage} />
            <PriorityBadge priority={migration.priority} />
            <span className="text-2xs text-faint">
              Started {fmtDate(migration.startedAt)} · Updated {timeAgo(migration.updatedAt)}
            </span>
          </div>
        }
        footer={
          <div className="flex w-full items-center justify-between">
            <Button variant="danger" size="sm" onClick={() => setConfirmDelete(true)}>
              <Trash2 className="h-3.5 w-3.5" aria-hidden />
              Delete migration
            </Button>
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        }
      >
        {/* ------------------------- Overview ------------------------- */}
        <section aria-label="Overview">
          <h3 className="text-2xs font-semibold uppercase tracking-wider text-faint">Overview</h3>
          <div className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-3.5">
            <ReadOnlyField label="Website" value={website?.name ?? 'Unknown website'} sub={website?.domain} />
            <ReadOnlyField label="Client" value={client?.name ?? 'Unknown client'} sub={client?.location} />

            <FormField label="Developer" htmlFor="mig-developer">
              <Select
                id="mig-developer"
                value={migration.developerId ?? ''}
                onChange={(e) => handleDeveloper(e.target.value)}
              >
                <option value="">Unassigned</option>
                {teamMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField label="Priority" htmlFor="mig-priority">
              <Select
                id="mig-priority"
                value={migration.priority}
                onChange={(e) => handlePriority(e.target.value as Priority)}
              >
                {(Object.keys(PRIORITY_LABELS) as Priority[]).map((p) => (
                  <option key={p} value={p}>
                    {PRIORITY_LABELS[p]}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField label="Stage" htmlFor="mig-stage">
              <Select
                id="mig-stage"
                value={migration.stage}
                onChange={(e) => handleStage(e.target.value as MigrationStage)}
              >
                {MIGRATION_STAGES_ORDERED.map((stage) => (
                  <option key={stage} value={stage}>
                    {MIGRATION_STAGE_LABELS[stage]}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField label="Due date" htmlFor="mig-due">
              <Input
                id="mig-due"
                type="date"
                value={migration.dueDate}
                onChange={(e) => handleDueDate(e.target.value)}
              />
            </FormField>

            <div className="col-span-2 space-y-1.5">
              <label htmlFor="mig-progress" className="block text-xs font-medium text-sub">
                Progress
              </label>
              <div className="flex items-center gap-3">
                <input
                  id="mig-progress"
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={sliderValue}
                  onChange={(e) => {
                    slidingRef.current = true
                    setSliderValue(Number(e.target.value))
                  }}
                  onPointerUp={commitProgress}
                  onKeyUp={commitProgress}
                  onBlur={commitProgress}
                  aria-valuetext={`${sliderValue}%`}
                  className="focus-ring w-full cursor-pointer accent-primary-600"
                />
                <span className="w-11 shrink-0 text-right text-sm font-semibold tabular-nums text-ink">
                  {sliderValue}%
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* --------------------- Migration Progress ------------------- */}
        <section aria-label="Migration progress" className="mt-5 rounded-xl border border-line bg-elev/40 p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-2xs font-semibold uppercase tracking-wider text-faint">Migration Progress</h3>
              <p className="mt-0.5 text-xs text-sub">
                {MIGRATION_STAGE_LABELS[migration.stage]} stage · due {fmtDate(migration.dueDate)}
              </p>
            </div>
            <AnimatedNumber
              value={migration.progress}
              format={(v) => `${Math.round(v)}%`}
              className="text-3xl font-bold tabular-nums tracking-tight text-ink"
            />
          </div>
          <ProgressBar
            value={migration.progress}
            tone={meta.bar}
            size="md"
            className="mt-3"
            aria-label="Overall migration progress"
          />
        </section>

        {/* ------------------------ Migration Logs -------------------- */}
        <section aria-label="Migration logs" className="mt-5">
          <div className="flex items-center gap-2">
            <h3 className="text-2xs font-semibold uppercase tracking-wider text-faint">Migration Logs</h3>
            <Badge tone="slate" className="tabular-nums">
              {migration.logs.length}
            </Badge>
          </div>

          <form
            onSubmit={handleAddLog}
            aria-label="Add log entry"
            className="mt-2.5 grid grid-cols-[1fr_1.4fr_auto] items-center gap-2"
          >
            <Input
              value={logTitle}
              onChange={(e) => setLogTitle(e.target.value)}
              placeholder="Log title"
              aria-label="Log title"
              className="h-8 text-xs"
            />
            <Input
              value={logDetail}
              onChange={(e) => setLogDetail(e.target.value)}
              placeholder="Detail (optional)"
              aria-label="Log detail"
              className="h-8 text-xs"
            />
            <Button type="submit" size="sm" variant="secondary" disabled={!logTitle.trim()}>
              <Plus className="h-3.5 w-3.5" aria-hidden />
              Add
            </Button>
          </form>

          {logGroups.length === 0 ? (
            <div className="mt-3 flex flex-col items-center rounded-lg border border-dashed border-line-strong/60 px-3 py-6 text-center">
              <NotebookPen className="h-4 w-4 text-faint" aria-hidden />
              <p className="mt-1.5 text-xs text-faint">No log entries yet</p>
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              {logGroups.map((group) => (
                <div key={group.day}>
                  <div className="flex items-center gap-2">
                    <span className="text-2xs font-semibold uppercase tracking-wider text-faint">{group.day}</span>
                    <span className="h-px flex-1 bg-line" aria-hidden />
                  </div>
                  <ul className="mt-1">
                    {group.entries.map((log) => {
                      const expanded = expandedLogs.has(log.id)
                      return (
                        <li key={log.id}>
                          <button
                            type="button"
                            onClick={() => toggleLog(log.id)}
                            aria-expanded={expanded}
                            className="focus-ring flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-elev/60"
                          >
                            <span className="w-16 shrink-0 text-2xs tabular-nums text-faint">
                              {fmtTime(log.timestamp)}
                            </span>
                            <span className="min-w-0 flex-1 truncate text-xs font-medium text-ink">{log.title}</span>
                            <ChevronDown
                              className={cn(
                                'h-3.5 w-3.5 shrink-0 text-faint transition-transform duration-150',
                                expanded && 'rotate-180',
                              )}
                              aria-hidden
                            />
                          </button>
                          <AnimatePresence initial={false}>
                            {expanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.18, ease: 'easeOut' }}
                                className="overflow-hidden"
                              >
                                <p className="px-2 pb-2 pl-[4.5rem] text-xs leading-relaxed text-sub">
                                  {log.detail || '—'}
                                </p>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </section>
      </Drawer>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        destructive
        title={`Delete migration for ${website?.name ?? 'this website'}?`}
        description="This action cannot be undone. All progress history and log entries for this migration will be removed."
        confirmLabel="Delete"
      />
    </>
  )
}

function ReadOnlyField({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="space-y-1.5">
      <span className="block text-xs font-medium text-sub">{label}</span>
      <div className="rounded-lg border border-line bg-elev/50 px-3 py-1.5">
        <p className="truncate text-sm font-medium text-ink">{value}</p>
        {sub ? <p className="truncate text-2xs text-faint">{sub}</p> : null}
      </div>
    </div>
  )
}
