import { motion } from 'framer-motion'
import { cn } from '@/utils/cn'

interface PageHeaderProps {
  title: string
  description?: React.ReactNode
  /** Right-aligned actions (buttons). */
  actions?: React.ReactNode
  /** Extra content below the title row (meta line, tabs, filters). */
  children?: React.ReactNode
  className?: string
}

export function PageHeader({ title, description, actions, children, className }: PageHeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={cn('mb-5', className)}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight text-ink">{title}</h1>
          {description && <div className="mt-0.5 text-sm text-sub">{description}</div>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children}
    </motion.header>
  )
}
