import { useEffect, useId, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/utils/cn'

interface PopoverProps {
  /** Render the trigger; `open` lets it style itself. */
  trigger: (props: {
    ref: React.RefObject<HTMLButtonElement | null>
    onClick: () => void
    'aria-expanded': boolean
    'aria-haspopup': true
    'aria-controls': string
  }) => React.ReactNode
  children: React.ReactNode | ((close: () => void) => React.ReactNode)
  align?: 'start' | 'end'
  /** Extra classes on the floating panel. */
  panelClassName?: string
  onOpenChange?: (open: boolean) => void
}

/**
 * Lightweight popover: panel positioned under the trigger, closes on
 * outside click and Escape. Foundation for dropdown menus and filters.
 */
export function Popover({ trigger, children, align = 'start', panelClassName, onOpenChange }: PopoverProps) {
  const [open, setOpenState] = useState(false)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const panelRef = useRef<HTMLDivElement | null>(null)
  const id = useId()

  const setOpen = (v: boolean) => {
    setOpenState(v)
    onOpenChange?.(v)
  }

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      const t = e.target as Node
      if (panelRef.current?.contains(t) || triggerRef.current?.contains(t)) return
      setOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  return (
    <div className="relative inline-block">
      {trigger({
        ref: triggerRef,
        onClick: () => setOpen(!open),
        'aria-expanded': open,
        'aria-haspopup': true,
        'aria-controls': id,
      })}
      <AnimatePresence>
        {open && (
          <motion.div
            ref={panelRef}
            id={id}
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.13, ease: 'easeOut' }}
            className={cn(
              'absolute z-50 mt-1.5 min-w-44 rounded-xl border border-line bg-card p-1 shadow-pop',
              align === 'end' ? 'right-0' : 'left-0',
              panelClassName,
            )}
          >
            {typeof children === 'function' ? children(() => setOpen(false)) : children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
