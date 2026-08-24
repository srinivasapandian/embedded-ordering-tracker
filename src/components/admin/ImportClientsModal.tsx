import { useMemo, useState } from 'react'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { CLIENT_IMPORT_SOURCE } from '@/data/clientImportSource'
import { mapImportRow } from '@/utils/clientImportMapping'
import { FRAMEWORK_LABELS, MIGRATION_STAGE_LABELS, ORDERING_STATUS_LABELS } from '@/types'
import { useAppStore } from '@/store/appStore'
import { toast } from '@/store/toastStore'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { Checkbox } from '@/components/common/Checkbox'
import { Modal } from '@/components/common/Modal'
import { Tooltip } from '@/components/common/Tooltip'

export function ImportClientsModal({ onClose }: { onClose: () => void }) {
  const clients = useAppStore((s) => s.clients)
  const websites = useAppStore((s) => s.websites)
  const createClient = useAppStore((s) => s.createClient)

  const existingNames = useMemo(() => new Set(clients.map((c) => c.name.trim().toLowerCase())), [clients])
  const existingDomains = useMemo(() => new Set(websites.map((w) => w.domain.toLowerCase())), [websites])

  const rows = useMemo(() => CLIENT_IMPORT_SOURCE.map(mapImportRow), [])

  const [selected, setSelected] = useState<Set<number>>(() => {
    const init = new Set<number>()
    rows.forEach((row, i) => {
      if (!row.values) return
      const dup = existingNames.has(row.values.name.trim().toLowerCase())
      const domainDup = row.values.domain ? existingDomains.has(row.values.domain.toLowerCase()) : false
      if (!dup && !domainDup) init.add(i)
    })
    return init
  })

  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [done, setDone] = useState<{ ok: number; failed: string[] } | null>(null)

  const toggle = (i: number) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })

  const selectedCount = selected.size

  const handleImport = async () => {
    setImporting(true)
    setProgress(0)
    let ok = 0
    const failed: string[] = []
    const targets = rows.filter((_, i) => selected.has(i))
    for (const row of targets) {
      if (!row.values) continue
      try {
        await createClient(row.values)
        ok++
      } catch {
        failed.push(row.values.name)
      }
      setProgress((p) => p + 1)
    }
    setDone({ ok, failed })
    setImporting(false)
    if (failed.length === 0) {
      toast.success('Import complete', `${ok} clients were added.`)
    }
  }

  return (
    <Modal
      open
      onClose={importing ? () => {} : onClose}
      title="Import clients from spreadsheet"
      description={`${rows.length} rows read from the source sheet — review before importing.`}
      size="xl"
      footer={
        done ? (
          <Button variant="primary" onClick={onClose}>
            Close
          </Button>
        ) : (
          <>
            <Button variant="outline" onClick={onClose} disabled={importing}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => void handleImport()} disabled={importing || selectedCount === 0}>
              {importing ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                  Importing {progress}/{selectedCount}…
                </>
              ) : (
                `Import ${selectedCount} client${selectedCount === 1 ? '' : 's'}`
              )}
            </Button>
          </>
        )
      }
    >
      {done ? (
        <div className="py-4 text-center">
          <p className="text-sm font-medium text-ink">{done.ok} clients imported.</p>
          {done.failed.length > 0 && (
            <p className="mt-2 text-xs text-red-600 dark:text-red-400">
              Failed to import: {done.failed.join(', ')}
            </p>
          )}
        </div>
      ) : (
        <div className="max-h-[60vh] overflow-auto rounded-lg border border-line">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-elev text-2xs uppercase tracking-wide text-faint">
              <tr>
                <th className="w-8 px-2 py-2" />
                <th className="px-2 py-2">Client</th>
                <th className="px-2 py-2">Location</th>
                <th className="px-2 py-2">Domain</th>
                <th className="px-2 py-2">Ordering</th>
                <th className="px-2 py-2">Stack</th>
                <th className="px-2 py-2">Migration</th>
                <th className="px-2 py-2">Flags</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                if (!row.values) {
                  return (
                    <tr key={i} className="border-t border-line text-faint">
                      <td className="px-2 py-1.5" />
                      <td className="px-2 py-1.5" colSpan={7}>
                        Skipped — {row.notes.join('; ')}
                      </td>
                    </tr>
                  )
                }
                const v = row.values
                const isDup =
                  existingNames.has(v.name.trim().toLowerCase()) ||
                  (v.domain ? existingDomains.has(v.domain.toLowerCase()) : false)
                return (
                  <tr key={i} className="border-t border-line hover:bg-elev/50">
                    <td className="px-2 py-1.5">
                      <Checkbox checked={selected.has(i)} onChange={() => toggle(i)} aria-label={`Import ${v.name}`} />
                    </td>
                    <td className="px-2 py-1.5 font-medium text-ink">{v.name}</td>
                    <td className="px-2 py-1.5 text-sub">{v.location || '—'}</td>
                    <td className="px-2 py-1.5 text-sub">{v.domain || '—'}</td>
                    <td className="px-2 py-1.5 text-sub">{ORDERING_STATUS_LABELS[v.orderingStatus]}</td>
                    <td className="px-2 py-1.5 text-sub">{FRAMEWORK_LABELS[v.framework]}</td>
                    <td className="px-2 py-1.5 text-sub">
                      {v.migrationStage ? MIGRATION_STAGE_LABELS[v.migrationStage] : '—'}
                    </td>
                    <td className="px-2 py-1.5">
                      <div className="flex flex-wrap items-center gap-1">
                        {isDup && <Badge tone="amber">Already exists</Badge>}
                        {row.notes.length > 0 && (
                          <Tooltip content={row.notes.join(' · ')}>
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" aria-hidden />
                          </Tooltip>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  )
}
