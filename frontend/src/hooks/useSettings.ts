import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from '@/api/client'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UserProfile {
  id: string
  name?: string
  display_name?: string
  email?: string
  timezone?: string
  language?: string
  avatar_url?: string
}

export interface Organization {
  id: string
  name: string
  description?: string
  logo_url?: string
}

export interface Workspace {
  id: string
  name: string
  description?: string
  org_id: string
}

export interface WorkspaceMember {
  id: string
  user_id: string
  name?: string
  email?: string
  role?: string
}

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

export const settingsKeys = {
  profile: (userId: string | null) => ['settings', 'profile', userId] as const,
  preferences: ['settings', 'preferences'] as const,
  org: (orgId: string | null) => ['settings', 'org', orgId] as const,
  workspace: (wsId: string | null) => ['settings', 'workspace', wsId] as const,
  workspaceMembers: (wsId: string | null) => ['settings', 'workspace', wsId, 'members'] as const,
  notifications: ['settings', 'notifications'] as const,
  apiKeys: ['settings', 'apiKeys'] as const,
}

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

export function useProfile(userId: string | null) {
  return useQuery<UserProfile>({
    queryKey: settingsKeys.profile(userId),
    queryFn: async () => {
      const { data } = await client.get(`/users/${userId}`)
      return data
    },
    enabled: !!userId,
  })
}

export function useUpdateProfile() {
  const qc = useQueryClient()
  return useMutation<UserProfile, Error, { id: string; body: Partial<UserProfile> }>({
    mutationFn: async ({ id, body }) => {
      const { data } = await client.patch(`/users/${id}`, body)
      return data
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: settingsKeys.profile(data.id) })
    },
  })
}

// ---------------------------------------------------------------------------
// Organization
// ---------------------------------------------------------------------------

export function useOrganization(orgId: string | null) {
  return useQuery<Organization>({
    queryKey: settingsKeys.org(orgId),
    queryFn: async () => {
      const { data } = await client.get(`/orgs/${orgId}`)
      return data
    },
    enabled: !!orgId,
  })
}

export function useUpdateOrganization() {
  const qc = useQueryClient()
  return useMutation<Organization, Error, { id: string; body: Partial<Organization> }>({
    mutationFn: async ({ id, body }) => {
      const { data } = await client.patch(`/orgs/${id}`, body)
      return data
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: settingsKeys.org(data.id) })
    },
  })
}

// ---------------------------------------------------------------------------
// Workspace
// ---------------------------------------------------------------------------

export function useWorkspace(workspaceId: string | null) {
  return useQuery<Workspace>({
    queryKey: settingsKeys.workspace(workspaceId),
    queryFn: async () => {
      const { data } = await client.get(`/workspaces/${workspaceId}`)
      return data
    },
    enabled: !!workspaceId,
  })
}

export function useUpdateWorkspace() {
  const qc = useQueryClient()
  return useMutation<Workspace, Error, { id: string; body: Partial<Workspace> }>({
    mutationFn: async ({ id, body }) => {
      const { data } = await client.patch(`/workspaces/${id}`, body)
      return data
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: settingsKeys.workspace(data.id) })
    },
  })
}

export function useWorkspaceMembers(workspaceId: string | null) {
  return useQuery<WorkspaceMember[]>({
    queryKey: settingsKeys.workspaceMembers(workspaceId),
    queryFn: async () => {
      const { data } = await client.get(`/workspaces/${workspaceId}/members`)
      return data?.data ?? data
    },
    enabled: !!workspaceId,
  })
}
