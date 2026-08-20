import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import type { Client, Feature, FeatureCategory } from '@/types'
import { FEATURE_CATEGORY_LABELS } from '@/types'
import { Badge } from '@/components/common/Badge'
import { FeatureCard } from './FeatureCard'

interface CategorySectionProps {
  category: FeatureCategory
  /** Features in this category, already filtered by the toolbar. */
  features: Feature[]
  clients: Client[]
  collapsed: boolean
  onToggleCollapsed: (category: FeatureCategory) => void
  compareMode: boolean
  compareIds: string[]
  onToggleSelect: (id: string) => void
  onEdit: (feature: Feature) => void
  onDuplicate: (feature: Feature) => void
  onDelete: (feature: Feature) => void
}

export function CategorySection({
  category,
  features,
  clients,
  collapsed,
  onToggleCollapsed,
  compareMode,
  compareIds,
  onToggleSelect,
  onEdit,
  onDuplicate,
  onDelete,
}: CategorySectionProps) {
  const enabledCount = features.filter((f) => f.enabled).length
  const contentId = `feature-section-${category}`

  return (
    <section aria-label={FEATURE_CATEGORY_LABELS[category]}>
      {/* Sticky-feel header sits just below the 56px topbar. */}
      <div className="sticky top-14 z-10 -mx-1 bg-canvas/95 px-1 py-1 backdrop-blur">
        <button
          type="button"
          onClick={() => onToggleCollapsed(category)}
          aria-expanded={!collapsed}
          aria-controls={contentId}
          className="focus-ring flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-elev/70"
        >
          <motion.span
            animate={{ rotate: collapsed ? -90 : 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="flex shrink-0"
          >
            <ChevronDown className="h-4 w-4 text-faint" aria-hidden />
          </motion.span>
          <span className="section-heading">{FEATURE_CATEGORY_LABELS[category]}</span>
          <Badge tone="slate">{features.length}</Badge>
          <span className="text-2xs text-faint">
            {enabledCount} of {features.length} enabled
          </span>
        </button>
      </div>

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            key="content"
            id={contentId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-2 gap-4 px-0.5 pb-4 pt-1.5 xl:grid-cols-3 2xl:grid-cols-4">
              {features.map((feature, i) => (
                <FeatureCard
                  key={feature.id}
                  feature={feature}
                  clients={clients}
                  index={i}
                  compareMode={compareMode}
                  selected={compareIds.includes(feature.id)}
                  onToggleSelect={onToggleSelect}
                  onEdit={onEdit}
                  onDuplicate={onDuplicate}
                  onDelete={onDelete}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
