import { motion } from 'framer-motion'
import { cn } from '@/utils/cn'
import { clamp } from '@/utils/format'

type Tone = 'primary' | 'emerald' | 'amber' | 'red' | 'sky' | 'slate' | 'violet'

const toneClasses: Record<Tone, string> = {
  primary: 'bg-primary-500',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
  sky: 'bg-sky-500',
  slate: 'bg-slate-400',
  violet: 'bg-violet-500',
}

interface ProgressBarProps {
  /** 0..100 */
  value: number
  tone?: Tone
  size?: 'xs' | 'sm' | 'md'
  showLabel?: boolean
  className?: string
  'aria-label'?: string
}

export function ProgressBar({
  value,
  tone = 'primary',
  size = 'sm',
  showLabel = false,
  className,
  ...aria
}: ProgressBarProps) {
  const v = clamp(Math.round(value), 0, 100)
  const height = size === 'md' ? 'h-2.5' : size === 'sm' ? 'h-1.5' : 'h-1'
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        role="progressbar"
        aria-valuenow={v}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={aria['aria-label'] ?? 'Progress'}
        className={cn('w-full overflow-hidden rounded-full bg-elev', height)}
      >
        <motion.div
          className={cn('h-full rounded-full', toneClasses[tone])}
          initial={{ width: 0 }}
          animate={{ width: `${v}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
      {showLabel && <span className="w-9 shrink-0 text-right text-xs font-medium tabular-nums text-sub">{v}%</span>}
    </div>
  )
}
