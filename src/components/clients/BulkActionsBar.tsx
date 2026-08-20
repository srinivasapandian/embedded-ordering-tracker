import { useState } from 'react'
import { motion } from 'framer-motion'
import { Flag, GitBranch, ListChecks, ShoppingCart, Trash2, UserPlus, X } from 'lucide-react'
import type { ClientStatus, Framework, OrderingStatus, Priority, TeamMember } from '@/types'
import {
  CLIENT_STATUS_LABELS,
  FRAMEWORK_LABELS,
  ORDERING_STATUS_LABELS,
  PRIORITY_LABELS,
} from '@/types'
import { useAppStore, type BulkClientPatch } from '@/store/appStore'
import { toast } from '@/store/toastStore'
import { Button } from '@/components/common/Button'
import { Modal } from '@/components/common/Modal'
import { Select } from '@/components/common/Select'
import { FormField } from '@/components/common/FormField'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'

type BulkKind = 'status' | 'assignee' | 'priority' | 'ordering' | 'framework'

const KIND_CONFIG: Record<BulkKind, { title: string; label: string; defaultValue: string }> = {
  status: { title: 'Change Status', label: 'Client status', defaultValue: 'active' },
  assignee: { title: 'Assign Member', label: 'Assigned member', defaultValue: '' },
  priority: { title: 'Change Priority', label: 'Priority', defaultValue: 'medium' },
  ordering: { title: 'Change Ordering Status', label: 'Ordering status', defaultValue: 'in-progress' },
  framework: { title: 'Change Migration Status', label: 'Framework', defaultValue: 'react' },
}

interface BulkActionsBarProps {
  selectedIds: string[]
  members: TeamMember[]
  onClearSelection: () => void
}

/** Slide-in bar shown while table rows are selected. */
export function BulkActionsBar({ selectedIds, members, onClearSelection }: BulkActionsBarProps) {
  const bulkUpdateClients = useAppStore((s) => s.bulkUpdateClients)
  const deleteClients = useAppStore((s) => s.deleteClients)

  const [kind, setKind] = useState<BulkKind | null>(null)
  const [value, setValue] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  const n = selectedIds.length
  const clientsWord = n === 1 ? 'client' : 'clients'

  const openKind = (k: BulkKind) => {
    setValue(KIND_CONFIG[k].defaultValue)
    setKind(k)
  }

  const displayValue = (k: BulkKind, v: string): string => {
    switch (k) {
      case 'status':
        return CLIENT_STATUS_LABELS[v as ClientStatus]
      case 'priority':
        return PRIORITY_LABELS[v as Priority]
      case 'ordering':
        return ORDERING_STATUS_LABELS[v as OrderingStatus]
      case 'framework':
        return FRAMEWORK_LABELS[v as Framework]
      case 'assignee':
        return v === '' ? 'Unassigned' : (members.find((m) => m.id === v)?.name ?? 'Unknown')
    }
  }

  const apply = () => {
    if (!kind) return
    const patch: BulkClientPatch =
      kind === 'status'
        ? { status: value as ClientStatus }
        : kind === 'priority'
          ? { priority: value as Priority }
          : kind === 'ordering'
            ? { orderingStatus: value as OrderingStatus }
            : kind === 'framework'
              ? { framework: value as Framework }
              : { assignedToId: value === '' ? null : value }
    bulkUpdateClients(selectedIds, patch)
    toast.success(
      `${n} ${clientsWord} updated`,
      `${KIND_CONFIG[kind].label} set to ${displayValue(kind, value)}`,
    )
    setKind(null)
    onClearSelection()
  }

  const handleDelete = () => {
    deleteClients(selectedIds)
    toast.success(`${n} ${clientsWord} deleted`, 'Related websites, migrations and priorities were removed')
    onClearSelection()
  }

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="overflow-hidden border-b border-line bg-primary-50/60 dark:bg-primary-500/5"
    >
      <div className="flex flex-wrap items-center gap-2 px-3 py-2" role="toolbar" aria-label="Bulk actions">
        <span className="text-xs font-semibold tabular-nums text-primary-700 dark:text-primary-300">
          {n} selected
        </span>
        <span className="mx-0.5 h-4 w-px bg-line-strong/70" aria-hidden />
        <Button size="xs" variant="outline" onClick={() => openKind('status')}>
          <ListChecks className="h-3.5 w-3.5" aria-hidden />
          Change Status
        </Button>
        <Button size="xs" variant="outline" onClick={() => openKind('assignee')}>
          <UserPlus className="h-3.5 w-3.5" aria-hidden />
          Assign Member
        </Button>
        <Button size="xs" variant="outline" onClick={() => openKind('priority')}>
          <Flag className="h-3.5 w-3.5" aria-hidden />
          Change Priority
        </Button>
        <Button size="xs" variant="outline" onClick={() => openKind('ordering')}>
          <ShoppingCart className="h-3.5 w-3.5" aria-hidden />
          Change Ordering Status
        </Button>
        <Button size="xs" variant="outline" onClick={() => openKind('framework')}>
          <GitBranch className="h-3.5 w-3.5" aria-hidden />
          Change Migration Status
        </Button>
        <Button size="xs" variant="danger" onClick={() => setConfirmDelete(true)}>
          <Trash2 className="h-3.5 w-3.5" aria-hidden />
          Delete
        </Button>
        <Button size="xs" variant="ghost" className="ml-auto" onClick={onClearSelection}>
          <X className="h-3.5 w-3.5" aria-hidden />
          Clear selection
        </Button>
      </div>

      {/* One small shared modal for every bulk field change */}
      <Modal
        open={kind !== null}
        onClose={() => setKind(null)}
        size="sm"
        title={kind ? KIND_CONFIG[kind].title : ''}
        description={`Applies to ${n} selected ${clientsWord}.`}
        footer={
          <>
            <Button variant="outline" onClick={() => setKind(null)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={apply}>
              Apply
            </Button>
          </>
        }
      >
        {kind && (
          <FormField label={KIND_CONFIG[kind].label} htmlFor="bulk-field-value">
            <Select id="bulk-field-value" value={value} onChange={(e) => setValue(e.target.value)}>
              {kind === 'status' &&
                Object.entries(CLIENT_STATUS_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              {kind === 'priority' &&
                Object.entries(PRIORITY_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              {kind === 'ordering' &&
                Object.entries(ORDERING_STATUS_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              {kind === 'framework' &&
                Object.entries(FRAMEWORK_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              {kind === 'assignee' && (
                <>
                  <option value="">Unassigned</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </>
              )}
            </Select>
          </FormField>
        )}
      </Modal>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        destructive
        title={`Delete ${n} ${clientsWord}?`}
        description="This action cannot be undone."
        confirmLabel="Delete"
      />
    </motion.div>
  )
}
