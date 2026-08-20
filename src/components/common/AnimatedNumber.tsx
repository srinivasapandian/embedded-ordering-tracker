import { useEffect, useRef, useState } from 'react'

interface AnimatedNumberProps {
  value: number
  /** Formatter for the displayed value (default: rounded integer). */
  format?: (v: number) => string
  durationMs?: number
  className?: string
}

/** Tweens between values whenever `value` changes (metric counters). */
export function AnimatedNumber({ value, format = (v) => String(Math.round(v)), durationMs = 550, className }: AnimatedNumberProps) {
  const [display, setDisplay] = useState(value)
  const fromRef = useRef(value)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const from = fromRef.current
    if (from === value) return
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs)
      const eased = 1 - Math.pow(1 - t, 3) // easeOutCubic
      setDisplay(from + (value - from) * eased)
      if (t < 1) rafRef.current = requestAnimationFrame(tick)
      else fromRef.current = value
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      fromRef.current = value
    }
  }, [value, durationMs])

  return <span className={className}>{format(display)}</span>
}
