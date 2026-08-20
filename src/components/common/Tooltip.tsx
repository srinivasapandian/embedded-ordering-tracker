import { cloneElement, isValidElement, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'

interface TooltipProps {
  content: React.ReactNode
  side?: 'top' | 'right' | 'bottom'
  disabled?: boolean
  children: React.ReactElement
}

/**
 * Portal-based tooltip so it never clips inside scroll containers
 * (e.g. the collapsed sidebar). Shows on hover and keyboard focus.
 */
export function Tooltip({ content, side = 'top', disabled = false, children }: TooltipProps) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const show = (el: HTMLElement) => {
    const r = el.getBoundingClientRect()
    if (side === 'right') setPos({ x: r.right + 8, y: r.top + r.height / 2 })
    else if (side === 'bottom') setPos({ x: r.left + r.width / 2, y: r.bottom + 8 })
    else setPos({ x: r.left + r.width / 2, y: r.top - 8 })
  }

  const onEnter = (e: React.MouseEvent | React.FocusEvent) => {
    if (disabled) return
    const el = e.currentTarget as HTMLElement
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => show(el), 150)
  }

  const onLeave = () => {
    if (timer.current) clearTimeout(timer.current)
    setPos(null)
  }

  if (!isValidElement(children)) return children

  const childProps = {
    onMouseEnter: onEnter,
    onMouseLeave: onLeave,
    onFocus: onEnter,
    onBlur: onLeave,
  }

  const transform =
    side === 'right' ? 'translate(0, -50%)' : side === 'bottom' ? 'translate(-50%, 0)' : 'translate(-50%, -100%)'

  return (
    <>
      {cloneElement(children as React.ReactElement<Record<string, unknown>>, childProps)}
      {createPortal(
        <AnimatePresence>
          {pos && !disabled && (
            <motion.div
              role="tooltip"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.12 }}
              style={{ left: pos.x, top: pos.y, transform }}
              className="pointer-events-none fixed z-[80] max-w-60 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-xs font-medium text-white shadow-pop dark:bg-slate-100 dark:text-slate-900"
            >
              {content}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  )
}
