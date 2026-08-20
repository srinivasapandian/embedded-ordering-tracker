import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/utils/cn'
import { IconButton } from './Button'

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

/** Shared focus/scroll management for Modal and Drawer. */
export function useOverlayBehavior(open: boolean, onClose: () => void, panelRef: React.RefObject<HTMLElement | null>) {
  const restoreRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return
    restoreRef.current = document.activeElement as HTMLElement
    document.body.style.overflow = 'hidden'

    // Focus the first focusable element (or the panel itself).
    const t = setTimeout(() => {
      const panel = panelRef.current
      if (!panel) return
      const first = panel.querySelector<HTMLElement>(FOCUSABLE)
      ;(first ?? panel).focus()
    }, 30)

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
        return
      }
      if (e.key !== 'Tab') return
      // Simple focus trap
      const panel = panelRef.current
      if (!panel) return
      const focusables = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null,
      )
      if (focusables.length === 0) return
      const first = focusables[0]!
      const last = focusables[focusables.length - 1]!
      const active = document.activeElement as HTMLElement
      if (e.shiftKey && (active === first || !panel.contains(active))) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && active === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      clearTimeout(t)
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
      restoreRef.current?.focus?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])
}

type ModalSize = 'sm' | 'md' | 'lg' | 'xl'

const sizeClasses: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
}

interface ModalProps {
  open: boolean
  onClose: () => void
  title: React.ReactNode
  description?: React.ReactNode
  size?: ModalSize
  children: React.ReactNode
  /** Sticky footer content (action buttons). */
  footer?: React.ReactNode
  /** Hide the default header close button. */
  hideClose?: boolean
}

export function Modal({ open, onClose, title, description, size = 'md', children, footer, hideClose }: ModalProps) {
  const panelRef = useRef<HTMLDivElement | null>(null)
  useOverlayBehavior(open, onClose, panelRef)

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto p-4 pt-[8vh]">
          <motion.div
            className="fixed inset-0 bg-slate-950/45 backdrop-blur-[2px]"
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
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className={cn('relative z-10 w-full rounded-xl border border-line bg-card shadow-pop', sizeClasses[size])}
          >
            <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
              <div>
                <h2 className="text-base font-semibold text-ink">{title}</h2>
                {description && <p className="mt-0.5 text-sm text-sub">{description}</p>}
              </div>
              {!hideClose && (
                <IconButton size="sm" aria-label="Close dialog" onClick={onClose}>
                  <X className="h-4 w-4" aria-hidden />
                </IconButton>
              )}
            </div>
            <div className="max-h-[65vh] overflow-y-auto px-5 py-4">{children}</div>
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
