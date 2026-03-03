import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from '@/api/client'
import type { AutomationRule } from '@/types/api'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CreateAutomationInput {
  name: string
  trigger_type: string
  trigger_config: Record<string, unknown>
  condition_config?: Record<string, unknown> | null
  action_type: string
  action_config: Record<string, unknown>
  is_enabled?: boolean
}

export interface UpdateAutomationInput {
  name?: string
  trigger_type?: string
  trigger_config?: Record<string, unknown>
  condition_config?: Record<string, unknown> | null
  action_type?: string
  action_config?: Record<string, unknown>
  is_enabled?: boolean
}

export interface AutomationLogEntry {
  id: string
  rule_id: string
  issue_id: string
  issue_key: string
  trigger_type: string
  success: boolean
  error_message: string | null
  executed_at: string
}

export interface AutomationTestResult {
  matched: boolean
  would_execute: boolean
  details: string
}

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

const automationKeys = {
  all: (projectId: string) => ['automations', projectId] as const,
  detail: (ruleId: string) => ['automations', 'detail', ruleId] as const,
  logs: (ruleId: string) => ['automations', 'logs', ruleId] as const,
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/** Fetch all automation rules for a project */
export function useAutomations(projectId: string) {
  return useQuery<AutomationRule[]>({
    queryKey: automationKeys.all(projectId),
    queryFn: async () => {
      const { data } = await client.get(`/projects/${projectId}/automations`)
      return data.data ?? data
    },
    enabled: !!projectId,
  })
}

/** Fetch execution logs for an automation rule */
export function useAutomationLogs(ruleId: string) {
  return useQuery<AutomationLogEntry[]>({
    queryKey: automationKeys.logs(ruleId),
    queryFn: async () => {
      const { data } = await client.get(`/automations/${ruleId}/logs`)
      return data.data ?? data
    },
    enabled: !!ruleId,
  })
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/** Create a new automation rule */
export function useCreateAutomation(projectId: string) {
  const qc = useQueryClient()
  return useMutation<AutomationRule, Error, CreateAutomationInput>({
    mutationFn: async (body) => {
      const { data } = await client.post(`/projects/${projectId}/automations`, body)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: automationKeys.all(projectId) })
    },
  })
}

/** Update an existing automation rule */
export function useUpdateAutomation(projectId: string) {
  const qc = useQueryClient()
  return useMutation<AutomationRule, Error, { id: string; body: UpdateAutomationInput }>({
    mutationFn: async ({ id, body }) => {
      const { data } = await client.patch(`/automations/${id}`, body)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: automationKeys.all(projectId) })
    },
  })
}

/** Delete an automation rule */
export function useDeleteAutomation(projectId: string) {
  const qc = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      await client.delete(`/automations/${id}`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: automationKeys.all(projectId) })
    },
  })
}

/** Test an automation rule against a specific issue */
export function useTestAutomation() {
  return useMutation<AutomationTestResult, Error, { ruleId: string; issueId: string }>({
    mutationFn: async ({ ruleId, issueId }) => {
      const { data } = await client.post(`/automations/${ruleId}/test`, {
        issue_id: issueId,
      })
      return data
    },
  })
}
