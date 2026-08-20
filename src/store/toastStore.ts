import { create } from 'zustand'
import { uid } from '@/utils/id'

export type ToastKind = 'success' | 'error' | 'info' | 'warning'

export interface ToastItem {
  id: string
  kind: ToastKind
  title: string
  description?: string
  /** ms; defaults to 4200 */
  duration: number
}

interface ToastState {
  toasts: ToastItem[]
  push: (kind: ToastKind, title: string, description?: string, duration?: number) => string
  dismiss: (id: string) => void
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (kind, title, description, duration = 4200) => {
    const id = uid('t')
    set((s) => ({ toasts: [...s.toasts, { id, kind, title, description, duration }].slice(-5) }))
    return id
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))

/** Imperative helpers — usable anywhere, including outside components. */
export const toast = {
  success: (title: string, description?: string) => useToastStore.getState().push('success', title, description),
  error: (title: string, description?: string) => useToastStore.getState().push('error', title, description),
  info: (title: string, description?: string) => useToastStore.getState().push('info', title, description),
  warning: (title: string, description?: string) => useToastStore.getState().push('warning', title, description),
}
