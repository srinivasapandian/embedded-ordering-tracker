import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '@/store/appStore'
import { timeAgo } from '@/utils/date'

/**
 * "Live" pill in the dashboard header. Pulses whenever the mock realtime
 * feed pushes an event and shows how long ago the last event landed.
 */
export function LiveIndicator() {
  const event = useAppStore((s) => s.lastRealtimeEvent)

  // Re-render every 30s so the "Xm ago" label stays fresh between events.
  const [, setTick] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 30_000)
    return () => clearInterval(t)
  }, [])

  return (
    <motion.div
      key={event?.id ?? 'live-idle'}
      initial={false}
      animate={{ scale: [1, 1.05, 1] }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      role="status"
      aria-live="off"
      title={event ? event.message : 'Waiting for realtime activity'}
      className="flex h-8 select-none items-center gap-2 rounded-full border border-line bg-card px-3 shadow-card"
    >
      <span className="relative flex h-2 w-2" aria-hidden>
        <motion.span
          key={event?.id ?? 'ping-idle'}
          className="absolute inline-flex h-full w-full rounded-full bg-emerald-400"
          initial={{ opacity: 0.75, scale: 1 }}
          animate={{ opacity: 0, scale: 2.6 }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
        />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
      </span>
      <span className="text-xs font-semibold text-ink">Live</span>
      {event && (
        <span className="text-2xs tabular-nums text-faint">
          {timeAgo(new Date(event.at).toISOString())}
        </span>
      )}
    </motion.div>
  )
}
