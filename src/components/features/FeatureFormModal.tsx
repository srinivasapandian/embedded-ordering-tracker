import { useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Search } from 'lucide-react'
import type { DeploymentStatus, Feature, FeatureCategory } from '@/types'
import { DEPLOYMENT_STATUS_LABELS, FEATURE_CATEGORY_LABELS } from '@/types'
import { useAppStore } from '@/store/appStore'
import { toast } from '@/store/toastStore'
import { Button } from '@/components/common/Button'
import { Checkbox } from '@/components/common/Checkbox'
import { FormField } from '@/components/common/FormField'
import { Input, Textarea } from '@/components/common/Input'
import { Modal } from '@/components/common/Modal'
import { Select } from '@/components/common/Select'
import { Switch } from '@/components/common/Switch'

const CATEGORY_VALUES = Object.keys(FEATURE_CATEGORY_LABELS) as [FeatureCategory, ...FeatureCategory[]]
const STATUS_VALUES = Object.keys(DEPLOYMENT_STATUS_LABELS) as [DeploymentStatus, ...DeploymentStatus[]]

function buildSchema(takenNames: string[]) {
  return z.object({
    name: z
      .string()
      .trim()
      .min(3, 'Name must be at least 3 characters')
      .refine((v) => !takenNames.includes(v.toLowerCase()), 'A feature with this name already exists'),
    description: z.string().trim().min(10, 'Description must be at least 10 characters'),
    category: z.enum(CATEGORY_VALUES),
    status: z.enum(STATUS_VALUES),
    enabled: z.boolean(),
    supportedClientIds: z.array(z.string()),
  })
}

type FormValues = z.infer<ReturnType<typeof buildSchema>>

const EMPTY_VALUES: FormValues = {
  name: '',
  description: '',
  category: 'ordering',
  status: 'planned',
  enabled: false,
  supportedClientIds: [],
}

interface FeatureFormModalProps {
  open: boolean
  onClose: () => void
  /** Feature being edited, or null to create a new one. */
  feature: Feature | null
}

export function FeatureFormModal({ open, onClose, feature }: FeatureFormModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={feature ? 'Edit Feature' : 'Add Feature'}
      description={
        feature ? `Update details for ${feature.name}` : 'Define a platform capability and its rollout'
      }
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form="feature-form">
            {feature ? 'Save Changes' : 'Create Feature'}
          </Button>
        </>
      }
    >
      {/* Modal mounts children only while open, so the form state starts fresh every time. */}
      <FeatureForm feature={feature} onClose={onClose} />
    </Modal>
  )
}

function FeatureForm({ feature, onClose }: { feature: Feature | null; onClose: () => void }) {
  const features = useAppStore((s) => s.features)
  const clients = useAppStore((s) => s.clients)
  const addFeature = useAppStore((s) => s.addFeature)
  const updateFeature = useAppStore((s) => s.updateFeature)

  const [clientQuery, setClientQuery] = useState('')

  const schema = useMemo(
    () =>
      buildSchema(
        features
          .filter((f) => f.id !== feature?.id)
          .map((f) => f.name.trim().toLowerCase()),
      ),
    [features, feature],
  )

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: feature
      ? {
          name: feature.name,
          description: feature.description,
          category: feature.category,
          status: feature.status,
          enabled: feature.enabled,
          supportedClientIds: feature.supportedClientIds,
        }
      : EMPTY_VALUES,
  })

  const sortedClients = useMemo(
    () => [...clients].sort((a, b) => a.name.localeCompare(b.name)),
    [clients],
  )

  const onSubmit = handleSubmit((values) => {
    if (feature) {
      updateFeature(feature.id, values)
      if (feature.status !== 'deployed' && values.status === 'deployed') {
        toast.success('Feature deployed', values.name)
      } else {
        toast.success('Feature updated', values.name)
      }
    } else {
      addFeature(values)
      toast.success('Feature created', values.name)
    }
    onClose()
  })

  return (
    <form id="feature-form" onSubmit={onSubmit} noValidate className="space-y-4">
      <FormField label="Name" htmlFor="feature-name" required error={errors.name?.message}>
        <Input
          id="feature-name"
          placeholder="e.g. Gift Card Checkout"
          invalid={!!errors.name}
          {...register('name')}
        />
      </FormField>

      <FormField
        label="Description"
        htmlFor="feature-description"
        required
        error={errors.description?.message}
      >
        <Textarea
          id="feature-description"
          rows={3}
          placeholder="What this capability does and who it serves…"
          invalid={!!errors.description}
          {...register('description')}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Category" htmlFor="feature-category" required error={errors.category?.message}>
          <Select id="feature-category" invalid={!!errors.category} {...register('category')}>
            {CATEGORY_VALUES.map((c) => (
              <option key={c} value={c}>
                {FEATURE_CATEGORY_LABELS[c]}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField
          label="Deployment status"
          htmlFor="feature-status"
          required
          error={errors.status?.message}
        >
          <Select id="feature-status" invalid={!!errors.status} {...register('status')}>
            {STATUS_VALUES.map((s) => (
              <option key={s} value={s}>
                {DEPLOYMENT_STATUS_LABELS[s]}
              </option>
            ))}
          </Select>
        </FormField>
      </div>

      <Controller
        control={control}
        name="enabled"
        render={({ field }) => (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-line bg-elev/40 px-3 py-2.5">
            <div>
              <p className="text-sm font-medium text-ink">Enabled</p>
              <p className="text-xs text-faint">Feature is switched on for its supported clients</p>
            </div>
            <Switch checked={field.value} onChange={field.onChange} aria-label="Enabled" />
          </div>
        )}
      />

      <Controller
        control={control}
        name="supportedClientIds"
        render={({ field }) => {
          const selected = new Set(field.value)
          const q = clientQuery.trim().toLowerCase()
          const visibleClients = q
            ? sortedClients.filter(
                (c) => c.name.toLowerCase().includes(q) || c.location.toLowerCase().includes(q),
              )
            : sortedClients
          const toggle = (id: string) => {
            field.onChange(
              selected.has(id) ? field.value.filter((v) => v !== id) : [...field.value, id],
            )
          }
          return (
            <FormField
              label="Supported clients"
              htmlFor="feature-client-search"
              hint={`${field.value.length} of ${clients.length} clients selected`}
            >
              <div className="overflow-hidden rounded-lg border border-line-strong/70 bg-card">
                <div className="relative border-b border-line">
                  <Search
                    className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-faint"
                    aria-hidden
                  />
                  <input
                    id="feature-client-search"
                    type="text"
                    role="searchbox"
                    value={clientQuery}
                    onChange={(e) => setClientQuery(e.target.value)}
                    placeholder="Search clients…"
                    className="focus-ring h-8 w-full bg-transparent pl-8 pr-3 text-sm text-ink placeholder:text-faint"
                  />
                </div>
                <div
                  className="max-h-48 overflow-y-auto bg-elev/30 p-1"
                  role="group"
                  aria-label="Supported clients"
                >
                  {visibleClients.map((c) => (
                    <label
                      key={c.id}
                      className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 transition-colors hover:bg-elev"
                    >
                      <Checkbox checked={selected.has(c.id)} onChange={() => toggle(c.id)} />
                      <span className="min-w-0 flex-1 truncate text-sm text-ink">{c.name}</span>
                      <span className="truncate text-2xs text-faint">{c.location}</span>
                    </label>
                  ))}
                  {visibleClients.length === 0 && (
                    <p className="px-2 py-4 text-center text-xs text-faint">
                      No clients match “{clientQuery}”
                    </p>
                  )}
                </div>
              </div>
            </FormField>
          )
        }}
      />
    </form>
  )
}
