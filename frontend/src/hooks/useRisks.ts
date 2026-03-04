import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from '@/api/client'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RiskCategory =
  | 'technical'
  | 'schedule'
  | 'resource'
  | 'budget'
  | 'scope'
  | 'external'
  | 'quality'

export type RiskLevel = 'very_low' | 'low' | 'medium' | 'high' | 'very_high'

export type RiskStatus =
  | 'identified'
  | 'analyzing'
  | 'mitigating'
  | 'monitoring'
  | 'resolved'
  | 'closed'

export type RiskResponseType = 'avoid' | 'mitigate' | 'transfer' | 'accept'

export interface Risk {
  id: string
  project_id: string
  title: string
  description: string | null
  category: RiskCategory
  probability: RiskLevel
  impact: RiskLevel
  risk_score: number
  status: RiskStatus
  owner_id: string | null
  mitigation_plan: string | null
  contingency_plan: string | null
  trigger_conditions: string | null
  due_date: string | null
  resolved_at: string | null
  created_at: string
  updated_at: string
}

export interface RiskMatrixCell {
  probability: string
  impact: string
  probability_score: number
  impact_score: number
  count: number
}

export interface RiskMatrixData {
  cells: RiskMatrixCell[]
}

export interface RiskSummary {
  total: number
  average_score: number
  by_status: Record<string, number>
  by_category: Record<string, number>
}

export interface RiskResponse {
  id: string
  risk_id: string
  response_type: RiskResponseType
  description: string | null
  status: string
  assigned_to: string | null
  created_at: string
  updated_at: string
}

export interface CreateRiskInput {
  project_id: string
  title: string
  description?: string | null
  category?: string
  probability?: string
  impact?: string
  status?: string
  owner_id?: string | null
  mitigation_plan?: string | null
  contingency_plan?: string | null
  trigger_conditions?: string | null
  due_date?: string | null
}

export interface UpdateRiskInput {
  riskId: string
  body: Partial<Omit<CreateRiskInput, 'project_id'>>
}

export interface CreateRiskResponseInput {
  riskId: string
  response_type?: string
  description?: string | null
  status?: string
  assigned_to?: string | null
}

export interface UpdateRiskResponseInput {
  responseId: string
  riskId: string
  body: {
    response_type?: string
    description?: string | null
    status?: string
    assigned_to?: string | null
  }
}

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

const riskKeys = {
  all: ['risks'] as const,
  byProject: (projectId: string) => ['risks', 'project', projectId] as const,
  detail: (riskId: string) => ['risks', 'detail', riskId] as const,
  matrix: (projectId: string) => ['risks', 'matrix', projectId] as const,
  summary: (projectId: string) => ['risks', 'summary', projectId] as const,
  responses: (riskId: string) => ['risks', 'responses', riskId] as const,
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export function useProjectRisks(projectId: string) {
  return useQuery<Risk[]>({
    queryKey: riskKeys.byProject(projectId),
    queryFn: async () => {
      const { data } = await client.get(`/projects/${projectId}/risks?limit=200&include_count=false`)
      return data?.data ?? data
    },
    enabled: !!projectId,
  })
}

export function useRisk(riskId: string) {
  return useQuery<Risk>({
    queryKey: riskKeys.detail(riskId),
    queryFn: async () => {
      const { data } = await client.get(`/risks/${riskId}`)
      return data
    },
    enabled: !!riskId,
  })
}

export function useRiskMatrix(projectId: string) {
  return useQuery<RiskMatrixData>({
    queryKey: riskKeys.matrix(projectId),
    queryFn: async () => {
      const { data } = await client.get(`/projects/${projectId}/risks/matrix`)
      return data
    },
    enabled: !!projectId,
  })
}

export function useRiskSummary(projectId: string) {
  return useQuery<RiskSummary>({
    queryKey: riskKeys.summary(projectId),
    queryFn: async () => {
      const { data } = await client.get(`/projects/${projectId}/risks/summary`)
      return data
    },
    enabled: !!projectId,
  })
}

export function useRiskResponses(riskId: string) {
  return useQuery<RiskResponse[]>({
    queryKey: riskKeys.responses(riskId),
    queryFn: async () => {
      const { data } = await client.get(`/risks/${riskId}/responses`)
      return data?.data ?? data
    },
    enabled: !!riskId,
  })
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export function useCreateRisk() {
  const qc = useQueryClient()
  return useMutation<Risk, Error, CreateRiskInput>({
    mutationFn: async (input) => {
      const { project_id, ...body } = input
      const { data } = await client.post(`/projects/${project_id}/risks`, body)
      return data
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: riskKeys.byProject(variables.project_id) })
      qc.invalidateQueries({ queryKey: riskKeys.matrix(variables.project_id) })
      qc.invalidateQueries({ queryKey: riskKeys.summary(variables.project_id) })
    },
  })
}

export function useUpdateRisk() {
  const qc = useQueryClient()
  return useMutation<Risk, Error, UpdateRiskInput>({
    mutationFn: async ({ riskId, body }) => {
      const { data } = await client.patch(`/risks/${riskId}`, body)
      return data
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: riskKeys.byProject(data.project_id) })
      qc.invalidateQueries({ queryKey: riskKeys.detail(data.id) })
      qc.invalidateQueries({ queryKey: riskKeys.matrix(data.project_id) })
      qc.invalidateQueries({ queryKey: riskKeys.summary(data.project_id) })
    },
  })
}

export function useDeleteRisk() {
  const qc = useQueryClient()
  return useMutation<void, Error, { riskId: string; projectId: string }>({
    mutationFn: async ({ riskId }) => {
      await client.delete(`/risks/${riskId}`)
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: riskKeys.byProject(variables.projectId) })
      qc.invalidateQueries({ queryKey: riskKeys.matrix(variables.projectId) })
      qc.invalidateQueries({ queryKey: riskKeys.summary(variables.projectId) })
    },
  })
}

export function useCreateRiskResponse() {
  const qc = useQueryClient()
  return useMutation<RiskResponse, Error, CreateRiskResponseInput>({
    mutationFn: async ({ riskId, ...body }) => {
      const { data } = await client.post(`/risks/${riskId}/responses`, body)
      return data
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: riskKeys.responses(variables.riskId) })
      qc.invalidateQueries({ queryKey: riskKeys.detail(variables.riskId) })
    },
  })
}

export function useUpdateRiskResponse() {
  const qc = useQueryClient()
  return useMutation<RiskResponse, Error, UpdateRiskResponseInput>({
    mutationFn: async ({ responseId, body }) => {
      const { data } = await client.patch(`/risk-responses/${responseId}`, body)
      return data
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: riskKeys.responses(variables.riskId) })
    },
  })
}

export function useDeleteRiskResponse() {
  const qc = useQueryClient()
  return useMutation<void, Error, { responseId: string; riskId: string }>({
    mutationFn: async ({ responseId }) => {
      await client.delete(`/risk-responses/${responseId}`)
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: riskKeys.responses(variables.riskId) })
    },
  })
}
