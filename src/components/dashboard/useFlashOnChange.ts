import { useEffect, useRef, useState } from 'react'

/**
 * Returns true for `durationMs` after `value` changes (skips the initial
 * mount) — used to flash metric cards when live data moves underneath them.
 */
export function useFlashOnChange(value: number, durationMs = 1200): boolean {
  const prev = useRef(value)
  const [flash, setFlash] = useState(false)

  useEffect(() => {
    if (prev.current === value) return
    prev.current = value
    setFlash(true)
    const t = setTimeout(() => setFlash(false), durationMs)
    return () => clearTimeout(t)
  }, [value, durationMs])

  return flash
}
