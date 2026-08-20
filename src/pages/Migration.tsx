import { useMemo, useState } from 'react'
import { CheckSquare, ListChecks, X } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { toast } from '@/store/toastStore'
import { MIGRATION_STAGE_LABELS, PRIORITY_LABELS, type MigrationStage, type Priority } from '@/types'
import { Button } from '@/components/common/Button'
import { PageHeader } from '@/components/common/PageHeader'
import { MigrationBoard } from '@/components/migration/MigrationBoard'
import { MigrationDrawer } from '@/components/migration/MigrationDrawer'

export default function Migration() {
  const migrations = useAppStore((s) => s.migrations)
  const websites = useAppStore((s) => s.websites)
  const clients = useAppStore((s) => s.clients)
  const teamMembers = useAppStore((s) => s.teamMembers)
  const bulkUpdateMigrations = useAppStore((s) => s.bulkUpdateMigrations)
  const [batchMode, setBatchMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [drawerId, setDrawerId] = useState<string | null>(null)

  const websiteMap = useMemo(() => new Map(websites.map((website) => [website.id, website])), [websites])
  const clientMap = useMemo(() => new Map(clients.map((client) => [client.id, client])), [clients])
  const memberMap = useMemo(() => new Map(teamMembers.map((member) => [member.id, member])), [teamMembers])

  const toggleSelection = (id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const clearSelection = () => setSelectedIds(new Set())

  const applyBulkUpdate = (patch: { stage?: MigrationStage; priority?: Priority }) => {
    if (selectedIds.size === 0) return
    bulkUpdateMigrations([...selectedIds], patch)
    const field = patch.stage ? MIGRATION_STAGE_LABELS[patch.stage] : PRIORITY_LABELS[patch.priority ?? 'medium']
    toast.success('Migrations updated', `${selectedIds.size} selected migrations set to ${field}`)
    clearSelection()
    setBatchMode(false)
  }

  return (
    <>
      <PageHeader
        title="Migration"
        description="Move seeded migration work through the React to Next.js workflow"
        actions={
          <Button
            variant={batchMode ? 'primary' : 'outline'}
            onClick={() => {
              setBatchMode((current) => !current)
              clearSelection()
            }}
            aria-pressed={batchMode}
          >
            <CheckSquare className="h-4 w-4" aria-hidden />
            {batchMode ? 'Exit selection' : 'Select migrations'}
          </Button>
        }
      />

      {batchMode && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-line bg-card px-3 py-2">
          <span className="mr-1 text-xs font-semibold text-ink">{selectedIds.size} selected</span>
          <Button size="xs" variant="outline" onClick={() => applyBulkUpdate({ stage: 'in-progress' })}>
            <ListChecks className="h-3.5 w-3.5" aria-hidden />
            Mark in progress
          </Button>
          <Button size="xs" variant="outline" onClick={() => applyBulkUpdate({ stage: 'testing' })}>
            Mark testing
          </Button>
          <Button size="xs" variant="outline" onClick={() => applyBulkUpdate({ priority: 'high' })}>
            Set high priority
          </Button>
          <Button size="xs" variant="ghost" onClick={clearSelection}>
            <X className="h-3.5 w-3.5" aria-hidden />
            Clear
          </Button>
        </div>
      )}

      <MigrationBoard
        migrations={migrations}
        websiteMap={websiteMap}
        clientMap={clientMap}
        memberMap={memberMap}
        batchMode={batchMode}
        selectedIds={selectedIds}
        onToggleSelect={toggleSelection}
        onOpenDetails={setDrawerId}
      />
      <MigrationDrawer migrationId={drawerId} onClose={() => setDrawerId(null)} />
    </>
  )
}
