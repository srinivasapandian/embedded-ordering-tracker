import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Boxes,
  CalendarClock,
  FlaskConical,
  GitCompare,
  Plus,
  Rocket,
  RotateCw,
  SearchX,
  X,
} from 'lucide-react'
import type { DeploymentStatus, Feature, FeatureCategory } from '@/types'
import { DEPLOYMENT_STATUS_LABELS, FEATURE_CATEGORY_LABELS } from '@/types'
import { useAppStore } from '@/store/appStore'
import { toast } from '@/store/toastStore'
import { featureSummary } from '@/utils/selectors'
import { pct } from '@/utils/format'
import { cn } from '@/utils/cn'
import { useSimulatedLoad } from '@/hooks/useSimulatedLoad'
import { Button } from '@/components/common/Button'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { MetricCard } from '@/components/common/MetricCard'
import { PageHeader } from '@/components/common/PageHeader'
import { SearchInput } from '@/components/common/SearchInput'
import { Skeleton, SkeletonCard } from '@/components/common/Skeleton'
import { CategorySection } from '@/components/features/CategorySection'
import { CompareBar } from '@/components/features/CompareBar'
import { CompareModal } from '@/components/features/CompareModal'
import { FeatureFormModal } from '@/components/features/FeatureFormModal'

const CATEGORIES = Object.keys(FEATURE_CATEGORY_LABELS) as FeatureCategory[]
const STATUSES = Object.keys(DEPLOYMENT_STATUS_LABELS) as DeploymentStatus[]

const STATUS_DOTS: Record<DeploymentStatus, string> = {
  deployed: 'bg-emerald-500',
  testing: 'bg-amber-500',
  planned: 'bg-sky-500',
}

const COMPARE_LIMIT = 4

export default function Features() {
  const features = useAppStore((s) => s.features)
  const clients = useAppStore((s) => s.clients)
  const deleteFeature = useAppStore((s) => s.deleteFeature)
  const duplicateFeature = useAppStore((s) => s.duplicateFeature)

  const { loading, error, reload } = useSimulatedLoad(600, 0.2)

  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState(() => searchParams.get('q') ?? '')
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const [categoryFilter, setCategoryFilter] = useState<string[]>([])
  const [enabledFilter, setEnabledFilter] = useState<string[]>([])
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  const [compareMode, setCompareMode] = useState(false)
  const [compareIds, setCompareIds] = useState<string[]>([])
  const [compareOpen, setCompareOpen] = useState(false)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Feature | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Feature | null>(null)

  // Consume ?q= (already pre-seeded into search state) and ?new=1, then clear them.
  useEffect(() => {
    const hasQ = searchParams.has('q')
    const isNew = searchParams.get('new') === '1'
    if (!hasQ && !searchParams.has('new')) return
    if (isNew) {
      setEditing(null)
      setFormOpen(true)
    }
    const next = new URLSearchParams(searchParams)
    next.delete('q')
    next.delete('new')
    setSearchParams(next, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const summary = useMemo(() => featureSummary(features), [features])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return features.filter((f) => {
      if (q && !f.name.toLowerCase().includes(q) && !f.description.toLowerCase().includes(q)) return false
      if (statusFilter.length > 0 && !statusFilter.includes(f.status)) return false
      if (categoryFilter.length > 0 && !categoryFilter.includes(f.category)) return false
      if (enabledFilter.length > 0 && !enabledFilter.includes(f.enabled ? 'enabled' : 'disabled')) return false
      return true
    })
  }, [features, search, statusFilter, categoryFilter, enabledFilter])

  const grouped = useMemo(() => {
    const map = new Map<FeatureCategory, Feature[]>()
    for (const c of CATEGORIES) map.set(c, [])
    for (const f of filtered) map.get(f.category)?.push(f)
    return map
  }, [filtered])

  const visibleCategories = CATEGORIES.filter((c) => (grouped.get(c)?.length ?? 0) > 0)

  const hasActiveFilters =
    search.trim() !== '' || statusFilter.length > 0 || categoryFilter.length > 0 || enabledFilter.length > 0

  const clearFilters = () => {
    setSearch('')
    setStatusFilter([])
    setCategoryFilter([])
    setEnabledFilter([])
  }

  /* ----------------------------- Compare ----------------------------- */

  const toggleCompareMode = () => {
    if (compareMode) {
      setCompareIds([])
      setCompareOpen(false)
    }
    setCompareMode(!compareMode)
  }

  const toggleCompareSelect = (id: string) => {
    const isSelected = compareIds.includes(id)
    if (!isSelected && compareIds.length >= COMPARE_LIMIT) {
      toast.warning('Compare limit reached', `You can compare up to ${COMPARE_LIMIT} features at a time`)
      return
    }
    setCompareIds(isSelected ? compareIds.filter((x) => x !== id) : [...compareIds, id])
  }

  const compareFeatures = useMemo(
    () =>
      compareIds
        .map((id) => features.find((f) => f.id === id))
        .filter((f): f is Feature => Boolean(f)),
    [compareIds, features],
  )

  /* ------------------------------ CRUD ------------------------------- */

  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const openEdit = (feature: Feature) => {
    setEditing(feature)
    setFormOpen(true)
  }

  const handleDuplicate = (feature: Feature) => {
    duplicateFeature(feature.id)
    toast.success('Feature duplicated', `${feature.name} (Copy)`)
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    deleteFeature(deleteTarget.id)
    setCompareIds((prev) => prev.filter((id) => id !== deleteTarget.id))
    toast.success('Feature deleted', deleteTarget.name)
  }

  const toggleSection = (category: FeatureCategory) =>
    setCollapsed((prev) => ({ ...prev, [category]: !prev[category] }))

  /* ------------------------------ Render ----------------------------- */

  return (
    <>
      <PageHeader
        title="Features"
        description="Platform capabilities and rollout status across clients"
        actions={
          <>
            <Button
              variant="outline"
              onClick={toggleCompareMode}
              aria-pressed={compareMode}
              className={cn(
                compareMode &&
                  'border-primary-300 bg-primary-50 text-primary-700 hover:bg-primary-100 dark:border-primary-800 dark:bg-primary-950/40 dark:text-primary-300 dark:hover:bg-primary-950/60',
              )}
            >
              <GitCompare className="h-4 w-4" aria-hidden />
              {compareMode ? `Compare (${compareIds.length})` : 'Compare'}
            </Button>
            <Button variant="primary" onClick={openCreate}>
              <Plus className="h-4 w-4" aria-hidden />
              Add Feature
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <MetricCard
          title="Total Features"
          value={summary.total}
          icon={Boxes}
          tone="indigo"
          caption={`Across ${CATEGORIES.length} categories`}
          loading={loading}
          index={0}
        />
        <MetricCard
          title="Deployed"
          value={summary.deployed}
          icon={Rocket}
          tone="emerald"
          percent={pct(summary.deployed, summary.total, 0)}
          caption="Live in production"
          loading={loading}
          index={1}
        />
        <MetricCard
          title="Testing"
          value={summary.testing}
          icon={FlaskConical}
          tone="amber"
          percent={pct(summary.testing, summary.total, 0)}
          caption="In validation"
          loading={loading}
          index={2}
        />
        <MetricCard
          title="Planned"
          value={summary.planned}
          icon={CalendarClock}
          tone="sky"
          percent={pct(summary.planned, summary.total, 0)}
          caption="On the roadmap"
          loading={loading}
          index={3}
        />
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search features…"
          className="w-64"
          aria-label="Search features"
        />
        <FilterDropdown
          label="Deployment Status"
          options={STATUSES.map((s) => ({
            value: s,
            label: DEPLOYMENT_STATUS_LABELS[s],
            render: <span className={cn('h-2 w-2 shrink-0 rounded-full', STATUS_DOTS[s])} aria-hidden />,
          }))}
          selected={statusFilter}
          onChange={setStatusFilter}
        />
        <FilterDropdown
          label="Category"
          options={CATEGORIES.map((c) => ({ value: c, label: FEATURE_CATEGORY_LABELS[c] }))}
          selected={categoryFilter}
          onChange={setCategoryFilter}
        />
        <FilterDropdown
          label="Enabled"
          options={[
            { value: 'enabled', label: 'Enabled' },
            { value: 'disabled', label: 'Disabled' },
          ]}
          selected={enabledFilter}
          onChange={setEnabledFilter}
        />
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-3.5 w-3.5" aria-hidden />
            Clear filters
          </Button>
        )}
        <div className="ml-auto flex items-center gap-2">
          {!loading && !error && (
            <span className="whitespace-nowrap text-xs tabular-nums text-faint">
              {filtered.length} of {features.length} features
            </span>
          )}
          <Button variant="ghost" size="sm" onClick={() => reload()}>
            <RotateCw className="h-3.5 w-3.5" aria-hidden />
            Refresh
          </Button>
        </div>
      </div>

      <div className={cn('mt-4', compareMode && 'pb-16')}>
        {loading ? (
          <div className="space-y-6" aria-hidden>
            {[0, 1].map((section) => (
              <div key={section} className="space-y-3">
                <Skeleton className="h-5 w-44" />
                <div className="grid grid-cols-2 gap-4 xl:grid-cols-3 2xl:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="app-card">
            <ErrorState
              title="Unable to load features"
              description="The feature catalog could not be refreshed. Please try again."
              onRetry={() => reload()}
            />
          </div>
        ) : visibleCategories.length === 0 ? (
          <div className="app-card">
            {hasActiveFilters ? (
              <EmptyState
                icon={SearchX}
                title="No features found"
                description="Try changing your filters"
                actionLabel="Clear Filters"
                onAction={clearFilters}
              />
            ) : (
              <EmptyState
                icon={Boxes}
                title="No features yet"
                description="Add your first platform capability to start tracking rollout across clients."
                actionLabel="Add Feature"
                onAction={openCreate}
              />
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {visibleCategories.map((category) => (
              <CategorySection
                key={category}
                category={category}
                features={grouped.get(category) ?? []}
                clients={clients}
                collapsed={!!collapsed[category]}
                onToggleCollapsed={toggleSection}
                compareMode={compareMode}
                compareIds={compareIds}
                onToggleSelect={toggleCompareSelect}
                onEdit={openEdit}
                onDuplicate={handleDuplicate}
                onDelete={setDeleteTarget}
              />
            ))}
          </div>
        )}
      </div>

      <CompareBar
        visible={compareMode}
        count={compareIds.length}
        onCompare={() => setCompareOpen(true)}
        onClear={() => setCompareIds([])}
      />

      <CompareModal open={compareOpen} onClose={() => setCompareOpen(false)} features={compareFeatures} />

      <FeatureFormModal open={formOpen} onClose={() => setFormOpen(false)} feature={editing} />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        destructive
        title="Delete feature"
        confirmLabel="Delete"
        description={
          <>
            This will permanently remove{' '}
            <span className="font-semibold text-ink">{deleteTarget?.name}</span> and its client rollout
            list. This action cannot be undone.
          </>
        }
      />
    </>
  )
}
