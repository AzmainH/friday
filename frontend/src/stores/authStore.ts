import { create } from 'zustand'

interface AuthState {
  currentUserId: string | null
  permissions: string[]
  token: string | null
  setCurrentUser: (id: string) => void
  setToken: (token: string) => void
  clearUser: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  currentUserId: null,
  permissions: [],
  token: null,
  setCurrentUser: (id) => set({ currentUserId: id }),
  setToken: (token) => set({ token }),
  clearUser: () => set({ currentUserId: null, permissions: [], token: null }),
}))
