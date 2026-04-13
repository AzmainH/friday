import { useMutation, useQuery } from '@tanstack/react-query'
import client from '@/api/client'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TaskMatch {
  task_id: string
  task_summary: string
  matched_text: string
  percent_complete: number | null
  status: string | null
  revised_eta: string | null
  blockers: string[]
  confidence_score: number
}

export interface ParsedStatusUpdate {
  matches: TaskMatch[]
  raw_text: string
  project_id: string
}

export interface StatusConfirmResponse {
  updated_count: number
  variance_changes: Record<string, unknown>[]
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/** Parse a free-text status update against project tasks */
export function useParseStatusUpdate() {
  return useMutation<ParsedStatusUpdate, Error, { projectId: string; freeText: string }>({
    mutationFn: async ({ projectId, freeText }) => {
      const { data } = await client.post(`/projects/${projectId}/status/parse`, {
        project_id: projectId,
        free_text: freeText,
      })
      return data
    },
  })
}

/** Confirm and apply parsed status updates */
export function useConfirmStatusUpdate() {
  return useMutation<
    StatusConfirmResponse,
    Error,
    { projectId: string; confirmedUpdates: TaskMatch[] }
  >({
    mutationFn: async ({ projectId, confirmedUpdates }) => {
      const { data } = await client.post(`/projects/${projectId}/status/confirm`, {
        project_id: projectId,
        confirmed_updates: confirmedUpdates,
      })
      return data
    },
  })
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/** Fetch past status update history for a project */
export function useStatusHistory(projectId: string) {
  return useQuery<unknown[]>({
    queryKey: ['status-history', projectId],
    queryFn: async () => {
      const { data } = await client.get(`/projects/${projectId}/status/history`)
      return data
    },
    enabled: !!projectId,
  })
}
