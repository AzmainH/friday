import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from '@/api/client'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type IntegrationType = 'webhook' | 'github' | 'slack'

export interface Integration {
  id: string
  project_id: string
  type: IntegrationType
  name: string
  config_json: string
  is_active: boolean
  last_triggered_at: string | null
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
}

export interface WebhookLog {
  id: string
  integration_id: string
  event_type: string
  payload_json: string
  status_code: number | null
  response_body: string | null
  success: boolean
  created_at: string
}

export interface CreateIntegrationInput {
  project_id: string
  type: IntegrationType
  name: string
  config_json: string
  is_active?: boolean
}

export interface UpdateIntegrationInput {
  id: string
  name?: string
  config_json?: string
  is_active?: boolean
}

export interface TestWebhookResult {
  success: boolean
  status_code: number | null
  response_body: string | null
}

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

const integrationKeys = {
  all: ['integrations'] as const,
  list: (projectId: string) => ['integrations', projectId] as const,
  detail: (id: string) => ['integrations', 'detail', id] as const,
  logs: (id: string) => ['integrations', id, 'logs'] as const,
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export function useIntegrations(projectId: string) {
  return useQuery<Integration[]>({
    queryKey: integrationKeys.list(projectId),
    queryFn: async () => {
      const { data } = await client.get(
        `/projects/${projectId}/integrations?limit=100&include_count=false`,
      )
      return data?.data ?? data
    },
    enabled: !!projectId,
  })
}

export function useIntegration(integrationId: string) {
  return useQuery<Integration>({
    queryKey: integrationKeys.detail(integrationId),
    queryFn: async () => {
      const { data } = await client.get(`/integrations/${integrationId}`)
      return data
    },
    enabled: !!integrationId,
  })
}

export function useWebhookLogs(integrationId: string) {
  return useQuery<WebhookLog[]>({
    queryKey: integrationKeys.logs(integrationId),
    queryFn: async () => {
      const { data } = await client.get(
        `/integrations/${integrationId}/logs?limit=100&include_count=false`,
      )
      return data?.data ?? data
    },
    enabled: !!integrationId,
  })
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export function useCreateIntegration() {
  const qc = useQueryClient()
  return useMutation<Integration, Error, CreateIntegrationInput>({
    mutationFn: async (input) => {
      const { project_id, ...body } = input
      const { data } = await client.post(`/projects/${project_id}/integrations`, body)
      return data
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: integrationKeys.list(variables.project_id) })
    },
  })
}

export function useUpdateIntegration(projectId: string) {
  const qc = useQueryClient()
  return useMutation<Integration, Error, UpdateIntegrationInput>({
    mutationFn: async ({ id, ...body }) => {
      const { data } = await client.patch(`/integrations/${id}`, body)
      return data
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: integrationKeys.list(projectId) })
      qc.invalidateQueries({ queryKey: integrationKeys.detail(variables.id) })
    },
  })
}

export function useDeleteIntegration(projectId: string) {
  const qc = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      await client.delete(`/integrations/${id}`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: integrationKeys.list(projectId) })
    },
  })
}

export function useTestWebhook() {
  const qc = useQueryClient()
  return useMutation<TestWebhookResult, Error, { id: string; event_type?: string }>({
    mutationFn: async ({ id, event_type }) => {
      const { data } = await client.post(`/integrations/${id}/test`, {
        event_type: event_type ?? 'test',
      })
      return data
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: integrationKeys.logs(variables.id) })
    },
  })
}
