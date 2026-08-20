import { AnimatePresence, motion } from 'framer-motion'
import { GitCompare } from 'lucide-react'
import { Button } from '@/components/common/Button'

interface CompareBarProps {
  /** Bar is shown while compare mode is active. */
  visible: boolean
  count: number
  onCompare: () => void
  onClear: () => void
}

/** Floating bottom action bar shown while compare mode is active. */
export function CompareBar({ visible, count, onCompare, onClear }: CompareBarProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="compare-bar"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="pointer-events-none fixed inset-x-0 bottom-5 z-40 flex justify-center px-4"
        >
          <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-line bg-card py-1.5 pl-4 pr-1.5 shadow-pop">
            <span className="whitespace-nowrap text-sm font-medium text-ink" aria-live="polite">
              <span className="tabular-nums">{count}</span> selected
              <span className="font-normal text-faint"> · max 4</span>
            </span>
            <span className="mx-1 h-4 w-px bg-line" aria-hidden />
            <Button size="sm" variant="ghost" onClick={onClear} disabled={count === 0} className="rounded-full">
              Clear
            </Button>
            <Button size="sm" variant="primary" onClick={onCompare} disabled={count < 2} className="rounded-full">
              <GitCompare className="h-3.5 w-3.5" aria-hidden />
              Compare
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
