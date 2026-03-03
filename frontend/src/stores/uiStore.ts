import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UiState {
  sidebarCollapsed: boolean
  themeMode: 'light' | 'dark'
  toggleSidebar: () => void
  setThemeMode: (mode: 'light' | 'dark') => void
  toggleTheme: () => void
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      themeMode: 'light',
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setThemeMode: (mode) => set({ themeMode: mode }),
      toggleTheme: () =>
        set((s) => ({ themeMode: s.themeMode === 'dark' ? 'light' : 'dark' })),
    }),
    { name: 'friday-ui' },
  ),
)
