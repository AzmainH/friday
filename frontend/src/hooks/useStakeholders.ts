import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from '@/api/client'
import type { Stakeholder } from '@/types/api'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StakeholderMatrixEntry {
  id: string
  name: string
  role: string | null
  interest_level: number
  influence_level: number
}

export interface CreateStakeholderInput {
  project_id: string
  name: string
  role?: string | null
  interest_level: number
  influence_level: number
}

export interface UpdateStakeholderInput {
  id: string
  body: {
    name?: string
    role?: string | null
    interest_level?: number
    influence_level?: number
  }
}

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

const stakeholderKeys = {
  all: (projectId: string) => ['stakeholders', projectId] as const,
  matrix: (projectId: string) => ['stakeholders', projectId, 'matrix'] as const,
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export function useStakeholders(projectId: string) {
  return useQuery<Stakeholder[]>({
    queryKey: stakeholderKeys.all(projectId),
    queryFn: async () => {
      const { data } = await client.get(`/projects/${projectId}/stakeholders?limit=100`)
      return data?.data ?? data
    },
    enabled: !!projectId,
  })
}

export function useStakeholderMatrix(projectId: string) {
  return useQuery<StakeholderMatrixEntry[]>({
    queryKey: stakeholderKeys.matrix(projectId),
    queryFn: async () => {
      const { data } = await client.get(`/projects/${projectId}/stakeholders/matrix`)
      return data?.data ?? data
    },
    enabled: !!projectId,
  })
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export function useCreateStakeholder() {
  const qc = useQueryClient()
  return useMutation<Stakeholder, Error, CreateStakeholderInput>({
    mutationFn: async (input) => {
      const { project_id, ...body } = input
      const { data } = await client.post(`/projects/${project_id}/stakeholders`, body)
      return data
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: stakeholderKeys.all(variables.project_id) })
      qc.invalidateQueries({ queryKey: stakeholderKeys.matrix(variables.project_id) })
    },
  })
}

export function useUpdateStakeholder() {
  const qc = useQueryClient()
  return useMutation<Stakeholder, Error, UpdateStakeholderInput>({
    mutationFn: async ({ id, body }) => {
      const { data } = await client.patch(`/stakeholders/${id}`, body)
      return data
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: stakeholderKeys.all(data.project_id) })
      qc.invalidateQueries({ queryKey: stakeholderKeys.matrix(data.project_id) })
    },
  })
}
