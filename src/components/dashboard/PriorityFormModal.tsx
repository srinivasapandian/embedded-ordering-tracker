import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { addDays, format, parseISO } from 'date-fns'
import { Button } from '@/components/common/Button'
import { FormField } from '@/components/common/FormField'
import { Input } from '@/components/common/Input'
import { Modal } from '@/components/common/Modal'
import { Select } from '@/components/common/Select'
import { useAppStore } from '@/store/appStore'
import { toast } from '@/store/toastStore'
import {
  PRIORITY_ITEM_STATUS_LABELS,
  PRIORITY_LABELS,
  type Priority,
  type PriorityItem,
  type PriorityItemStatus,
} from '@/types'
import { weekLabel, weekRangeLabel } from '@/utils/date'

const prioritySchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters'),
  websiteId: z.string().min(1, 'Select a website'),
  priority: z.enum(['high', 'medium', 'low']),
  dueDate: z
    .string()
    .min(1, 'Due date is required')
    .refine((v) => !Number.isNaN(new Date(v).getTime()), 'Enter a valid date'),
  status: z.enum(['not-started', 'in-progress', 'blocked', 'review', 'completed']),
})

type PriorityFormValues = z.infer<typeof prioritySchema>

const EMPTY_VALUES: PriorityFormValues = {
  title: '',
  websiteId: '',
  priority: 'medium',
  dueDate: '',
  status: 'not-started',
}

/** Friday of the given week — a friendly default due date for new items. */
function defaultDueDate(weekStart: string): string {
  return format(addDays(parseISO(weekStart), 4), 'yyyy-MM-dd')
}

interface PriorityFormModalProps {
  open: boolean
  onClose: () => void
  /** Item being edited, or null for create mode. */
  editing: PriorityItem | null
  /** Week new items are scheduled into (create mode). */
  weekStart: string
}

export function PriorityFormModal({ open, onClose, editing, weekStart }: PriorityFormModalProps) {
  const websites = useAppStore((s) => s.websites)
  const addPriority = useAppStore((s) => s.addPriority)
  const updatePriority = useAppStore((s) => s.updatePriority)

  const sortedWebsites = useMemo(
    () => [...websites].sort((a, b) => a.name.localeCompare(b.name)),
    [websites],
  )

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PriorityFormValues>({
    resolver: zodResolver(prioritySchema),
    defaultValues: EMPTY_VALUES,
  })

  // Re-seed the form every time the modal opens (add vs edit mode).
  useEffect(() => {
    if (!open) return
    reset(
      editing
        ? {
            title: editing.title,
            websiteId: editing.websiteId,
            priority: editing.priority,
            dueDate: editing.dueDate,
            status: editing.status,
          }
        : { ...EMPTY_VALUES, dueDate: defaultDueDate(weekStart) },
    )
  }, [open, editing, weekStart, reset])

  const onSubmit = (values: PriorityFormValues) => {
    const payload = {
      title: values.title.trim(),
      websiteId: values.websiteId,
      priority: values.priority,
      assignedToId: null,
      dueDate: values.dueDate,
      status: values.status,
    }
    if (editing) {
      updatePriority(editing.id, payload)
      toast.success('Priority updated', `"${payload.title}" has been saved.`)
    } else {
      addPriority({ ...payload, weekStart })
      toast.success('Priority added', `Scheduled for ${weekLabel(weekStart)}.`)
    }
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Edit priority' : 'Add priority'}
      description={
        editing
          ? `Update this task for ${weekLabel(editing.weekStart)}.`
          : `Plan a task for ${weekLabel(weekStart)} (${weekRangeLabel(weekStart)}).`
      }
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form="priority-form" loading={isSubmitting}>
            {editing ? 'Save changes' : 'Add priority'}
          </Button>
        </>
      }
    >
      <form id="priority-form" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <FormField label="Title" htmlFor="pf-title" required error={errors.title?.message}>
          <Input
            id="pf-title"
            placeholder="e.g. QA regression round 2"
            invalid={!!errors.title}
            aria-describedby={errors.title ? 'pf-title-error' : undefined}
            {...register('title')}
          />
        </FormField>

        <FormField label="Website" htmlFor="pf-website" required error={errors.websiteId?.message}>
          <Select
            id="pf-website"
            invalid={!!errors.websiteId}
            aria-describedby={errors.websiteId ? 'pf-website-error' : undefined}
            {...register('websiteId')}
          >
            <option value="">Select a website…</option>
            {sortedWebsites.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name} ({w.domain})
              </option>
            ))}
          </Select>
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Priority" htmlFor="pf-priority" required error={errors.priority?.message}>
            <Select id="pf-priority" {...register('priority')}>
              {(Object.keys(PRIORITY_LABELS) as Priority[]).map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_LABELS[p]}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Due date" htmlFor="pf-due" required error={errors.dueDate?.message}>
            <Input
              id="pf-due"
              type="date"
              invalid={!!errors.dueDate}
              aria-describedby={errors.dueDate ? 'pf-due-error' : undefined}
              {...register('dueDate')}
            />
          </FormField>

          <FormField label="Status" htmlFor="pf-status" required error={errors.status?.message}>
            <Select id="pf-status" {...register('status')}>
              {(Object.keys(PRIORITY_ITEM_STATUS_LABELS) as PriorityItemStatus[]).map((s) => (
                <option key={s} value={s}>
                  {PRIORITY_ITEM_STATUS_LABELS[s]}
                </option>
              ))}
            </Select>
          </FormField>
        </div>
      </form>
    </Modal>
  )
}
