import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UiState {
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  commandPaletteOpen: boolean
  setCommandPaletteOpen: (open: boolean) => void
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      commandPaletteOpen: false,
      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
    }),
    {
      name: 'eot-ui',
      partialize: (s) => ({ sidebarCollapsed: s.sidebarCollapsed }) as UiState,
    },
  ),
)
