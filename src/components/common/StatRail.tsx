import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { AnimatedNumber } from './AnimatedNumber'
import { cn } from '@/utils/cn'

export type StatRailTone = 'violet' | 'emerald' | 'amber' | 'primary' | 'sky' | 'rose'

const TONE_ICON_WRAP: Record<StatRailTone, string> = {
  violet: 'bg-violet-500 text-white',
  emerald: 'bg-emerald-500 text-white',
  amber: 'bg-amber-500 text-white',
  primary: 'bg-primary-600 text-white',
  sky: 'bg-sky-500 text-white',
  rose: 'bg-rose-500 text-white',
}

export interface StatRailItemData {
  icon: LucideIcon
  tone: StatRailTone
  label: string
  value: number
}

function StatRailItem({ icon: Icon, tone, label, value, index }: StatRailItemData & { index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04, ease: 'easeOut' }}
      className="flex flex-1 items-center gap-3 px-4 py-4 first:pl-5 last:pr-5 sm:px-5"
    >
      <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full shadow-sm', TONE_ICON_WRAP[tone])}>
        <Icon className="h-[18px] w-[18px]" aria-hidden />
      </span>
      <div className="min-w-0">
        <AnimatedNumber value={value} className="block text-xl font-bold leading-none tabular-nums tracking-tight text-white" />
        <p className="mt-1 truncate text-2xs font-medium text-slate-400">{label}</p>
      </div>
    </motion.div>
  )
}

/** Dark "spotlight" stat strip — a row of at-a-glance numbers in one continuous bar. */
export function StatRail({ items, className }: { items: StatRailItemData[]; className?: string }) {
  return (
    <div
      className={cn(
        'flex flex-wrap divide-y divide-white/10 overflow-hidden rounded-2xl bg-slate-900 shadow-float sm:flex-nowrap sm:divide-x sm:divide-y-0',
        className,
      )}
    >
      {items.map((item, i) => (
        <StatRailItem key={item.label} {...item} index={i} />
      ))}
    </div>
  )
}
