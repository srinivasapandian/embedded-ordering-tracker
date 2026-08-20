import { useEffect } from 'react'

interface HotkeyOptions {
  ctrlOrCmd?: boolean
  /** Fire even when focus is inside an input/textarea/select. */
  allowInInputs?: boolean
  enabled?: boolean
}

/** Registers a global keydown hotkey. Key comparison is case-insensitive. */
export function useHotkey(key: string, handler: (e: KeyboardEvent) => void, options: HotkeyOptions = {}) {
  const { ctrlOrCmd = false, allowInInputs = false, enabled = true } = options
  useEffect(() => {
    if (!enabled) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== key.toLowerCase()) return
      if (ctrlOrCmd && !(e.ctrlKey || e.metaKey)) return
      if (!ctrlOrCmd && (e.ctrlKey || e.metaKey || e.altKey)) return
      if (!allowInInputs) {
        const el = e.target as HTMLElement
        const tag = el.tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable) return
      }
      handler(e)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [key, handler, ctrlOrCmd, allowInInputs, enabled])
}
