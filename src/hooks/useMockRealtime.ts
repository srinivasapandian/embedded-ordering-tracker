import { useEffect } from 'react'
import { useAppStore } from '@/store/appStore'
import { toast } from '@/store/toastStore'

/**
 * Simulates realtime backend updates: every `intervalMs` an in-progress
 * migration gains a little progress (occasionally logging and notifying).
 * Mounted once in AppLayout. Pauses while the tab is hidden.
 * Consumers can react to changes via useAppStore((s) => s.lastRealtimeEvent).
 */
export function useMockRealtime(intervalMs = 25_000) {
  const tickRealtime = useAppStore((s) => s.tickRealtime)

  useEffect(() => {
    let n = 0
    const timer = setInterval(() => {
      if (document.hidden) return
      const message = tickRealtime()
      n += 1
      // Only toast occasionally so the simulation stays subtle.
      if (message && n % 4 === 0) toast.info('Live update', message)
    }, intervalMs)
    return () => clearInterval(timer)
  }, [intervalMs, tickRealtime])
}
