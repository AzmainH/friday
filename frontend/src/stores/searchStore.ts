import { create } from 'zustand'

interface SearchState {
  isOpen: boolean
  query: string
  selectedIndex: number
  open: () => void
  close: () => void
  setQuery: (query: string) => void
  moveUp: () => void
  moveDown: () => void
  reset: () => void
}

export const useSearchStore = create<SearchState>((set) => ({
  isOpen: false,
  query: '',
  selectedIndex: 0,
  open: () => set({ isOpen: true, query: '', selectedIndex: 0 }),
  close: () => set({ isOpen: false }),
  setQuery: (query) => set({ query, selectedIndex: 0 }),
  moveUp: () => set((s) => ({ selectedIndex: Math.max(0, s.selectedIndex - 1) })),
  moveDown: () => set((s) => ({ selectedIndex: s.selectedIndex + 1 })),
  reset: () => set({ isOpen: false, query: '', selectedIndex: 0 }),
}))
