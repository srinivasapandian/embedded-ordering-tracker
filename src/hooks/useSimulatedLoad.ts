import { useCallback, useEffect, useRef, useState } from 'react'

interface SimulatedLoad {
  /** True while the fake fetch is in flight — render skeletons. */
  loading: boolean
  /** True when the fake fetch "failed" — render an error state. */
  error: boolean
  /** Re-run the fake fetch; pass { fail: true } to force the error state. */
  reload: (opts?: { fail?: boolean }) => void
}

/**
 * Simulates an initial data fetch so pages can show skeleton and error states.
 * `failChance` (0..1) lets refresh actions occasionally demonstrate error UI.
 */
export function useSimulatedLoad(delayMs = 550, failChance = 0): SimulatedLoad {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const run = useCallback(
    (opts?: { fail?: boolean }) => {
      if (timer.current) clearTimeout(timer.current)
      setLoading(true)
      setError(false)
      timer.current = setTimeout(() => {
        const failed = opts?.fail ?? Math.random() < failChance
        setError(failed)
        setLoading(false)
      }, delayMs)
    },
    [delayMs, failChance],
  )

  useEffect(() => {
    // First load never fails — errors are for explicit refresh demos.
    run({ fail: false })
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [run])

  return { loading, error, reload: run }
}
