import { useRef } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/utils/cn'
import { IconButton } from './Button'
import { useOverlayBehavior } from './Modal'

type DrawerSize = 'md' | 'lg' | 'xl'

const sizeClasses: Record<DrawerSize, string> = {
  md: 'max-w-md',
  lg: 'max-w-xl',
  xl: 'max-w-2xl',
}

interface DrawerProps {
  open: boolean
  onClose: () => void
  title: React.ReactNode
  description?: React.ReactNode
  size?: DrawerSize
  children: React.ReactNode
  footer?: React.ReactNode
  /** Extra header content under the title (badges, meta). */
  headerExtra?: React.ReactNode
}

/** Right-side sliding drawer (migration details, filter panels…). */
export function Drawer({ open, onClose, title, description, size = 'lg', children, footer, headerExtra }: DrawerProps) {
  const panelRef = useRef<HTMLDivElement | null>(null)
  useOverlayBehavior(open, onClose, panelRef)

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60]">
          <motion.div
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={typeof title === 'string' ? title : undefined}
            tabIndex={-1}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 40 }}
            className={cn(
              'absolute inset-y-0 right-0 flex w-full flex-col border-l border-line bg-card shadow-drawer',
              sizeClasses[size],
            )}
          >
            <div className="border-b border-line px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="truncate text-base font-semibold text-ink">{title}</h2>
                  {description && <p className="mt-0.5 text-sm text-sub">{description}</p>}
                </div>
                <IconButton size="sm" aria-label="Close drawer" onClick={onClose}>
                  <X className="h-4 w-4" aria-hidden />
                </IconButton>
              </div>
              {headerExtra && <div className="mt-3">{headerExtra}</div>}
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
            {footer && (
              <div className="flex items-center justify-end gap-2 border-t border-line px-5 py-3.5">{footer}</div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
