import { create } from 'zustand'

interface OrgState {
  currentOrgId: string | null
  currentWorkspaceId: string | null
  setOrg: (id: string) => void
  setWorkspace: (id: string) => void
}

export const useOrgStore = create<OrgState>((set) => ({
  currentOrgId: null,
  currentWorkspaceId: null,
  setOrg: (id) => set({ currentOrgId: id }),
  setWorkspace: (id) => set({ currentWorkspaceId: id }),
}))
