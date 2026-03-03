import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from '@/api/client'
import type { Decision } from '@/types/api'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CreateDecisionInput {
  project_id: string
  title: string
  description?: string | null
  status?: string
  decided_date?: string | null
}

export interface UpdateDecisionInput {
  id: string
  body: {
    title?: string
    description?: string | null
    status?: string
    decided_date?: string | null
    outcome?: string | null
    rationale?: string | null
  }
}

// Extend the base Decision type with optional fields the detail endpoint may return
export interface DecisionDetail extends Decision {
  outcome: string | null
  rationale: string | null
  linked_issue_ids: string[]
}

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

const decisionKeys = {
  all: (projectId: string) => ['decisions', projectId] as const,
  detail: (id: string) => ['decisions', 'detail', id] as const,
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export function useDecisions(projectId: string) {
  return useQuery<Decision[]>({
    queryKey: decisionKeys.all(projectId),
    queryFn: async () => {
      const { data } = await client.get(`/projects/${projectId}/decisions?limit=100`)
      return data?.data ?? data
    },
    enabled: !!projectId,
  })
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export function useCreateDecision() {
  const qc = useQueryClient()
  return useMutation<Decision, Error, CreateDecisionInput>({
    mutationFn: async (input) => {
      const { project_id, ...body } = input
      const { data } = await client.post(`/projects/${project_id}/decisions`, body)
      return data
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: decisionKeys.all(variables.project_id) })
    },
  })
}

export function useUpdateDecision() {
  const qc = useQueryClient()
  return useMutation<DecisionDetail, Error, UpdateDecisionInput>({
    mutationFn: async ({ id, body }) => {
      const { data } = await client.patch(`/decisions/${id}`, body)
      return data
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: decisionKeys.all(data.project_id) })
      qc.invalidateQueries({ queryKey: decisionKeys.detail(data.id) })
    },
  })
}
