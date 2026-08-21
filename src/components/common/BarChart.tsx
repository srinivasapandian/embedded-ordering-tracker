import { motion } from 'framer-motion'
import { cn } from '@/utils/cn'

export interface BarDatum {
  label: string
  value: number
  /** Concrete CSS color (hex/rgb). */
  color: string
  /** Optional trailing caption, e.g. "mock". */
  caption?: string
}

interface BarChartProps {
  data: BarDatum[]
  className?: string
  /** Format the trailing value label. Defaults to the raw number. */
  formatValue?: (value: number) => string
}

/** Clean horizontal bar chart — no axis chrome, just label / bar / value. */
export function BarChart({ data, className, formatValue }: BarChartProps) {
  const max = Math.max(1, ...data.map((d) => d.value))
  return (
    <div className={cn('space-y-3', className)}>
      {data.map((d, i) => (
        <div key={d.label} className="flex items-center gap-3">
          <span className="w-24 shrink-0 truncate text-xs font-medium text-sub">{d.label}</span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-elev">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: d.color }}
              initial={{ width: 0 }}
              animate={{ width: `${(d.value / max) * 100}%` }}
              transition={{ duration: 0.5, delay: i * 0.05, ease: 'easeOut' }}
            />
          </div>
          <span className="w-14 shrink-0 text-right text-xs font-semibold tabular-nums text-ink">
            {formatValue ? formatValue(d.value) : d.value}
          </span>
          {d.caption && <span className="w-10 shrink-0 text-2xs text-faint">{d.caption}</span>}
        </div>
      ))}
    </div>
  )
}
