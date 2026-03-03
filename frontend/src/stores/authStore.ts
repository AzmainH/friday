import { create } from 'zustand'

interface AuthState {
  currentUserId: string | null
  permissions: string[]
  setCurrentUser: (id: string) => void
  clearUser: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  currentUserId: null,
  permissions: [],
  setCurrentUser: (id) => set({ currentUserId: id }),
  clearUser: () => set({ currentUserId: null, permissions: [] }),
}))
