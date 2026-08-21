import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react'
import { cn } from '@/utils/cn'
import { useToastStore, type ToastItem, type ToastKind } from '@/store/toastStore'

const kindConfig: Record<ToastKind, { Icon: typeof Info; classes: string }> = {
  success: { Icon: CheckCircle2, classes: 'text-emerald-500' },
  error: { Icon: XCircle, classes: 'text-red-500' },
  warning: { Icon: AlertTriangle, classes: 'text-amber-500' },
  info: { Icon: Info, classes: 'text-slate-400' },
}

function Toast({ toast }: { toast: ToastItem }) {
  const dismiss = useToastStore((s) => s.dismiss)
  const { Icon, classes } = kindConfig[toast.kind]

  useEffect(() => {
    const t = setTimeout(() => dismiss(toast.id), toast.duration)
    return () => clearTimeout(t)
  }, [toast.id, toast.duration, dismiss])

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.97 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      role="status"
      className="pointer-events-auto flex w-80 items-start gap-3 rounded-xl border border-line bg-card p-3.5 shadow-pop"
    >
      <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', classes)} aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-snug text-ink">{toast.title}</p>
        {toast.description && <p className="mt-0.5 text-xs leading-snug text-sub">{toast.description}</p>}
      </div>
      <button
        type="button"
        aria-label="Dismiss notification"
        onClick={() => dismiss(toast.id)}
        className="focus-ring shrink-0 rounded p-0.5 text-faint transition-colors hover:text-ink"
      >
        <X className="h-3.5 w-3.5" aria-hidden />
      </button>
    </motion.div>
  )
}

/** Mount once in the app layout. */
export function Toaster() {
  const toasts = useToastStore((s) => s.toasts)
  return createPortal(
    <div aria-live="polite" className="pointer-events-none fixed bottom-4 right-4 z-[90] flex flex-col items-end gap-2">
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          <Toast key={t.id} toast={t} />
        ))}
      </AnimatePresence>
    </div>,
    document.body,
  )
}
