import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import client from '@/api/client'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AdjustedTask {
  task_id: string
  task_summary: string
  old_planned_start: string | null
  old_planned_end: string | null
  new_planned_start: string | null
  new_planned_end: string | null
  variance_days: number
}

export interface ReforecastResult {
  project_id: string
  adjusted_tasks: AdjustedTask[]
  total_tasks_affected: number
}

export interface CriticalPathTask {
  task_id: string
  summary: string
  planned_start: string | null
  planned_end: string | null
  percent_complete: number
  duration_days: number
}

export interface CriticalPath {
  project_id: string
  path: string[]
  total_duration_days: number
  tasks: CriticalPathTask[]
}

export interface VarianceAlert {
  task_id: string
  task_summary: string
  alert_type: 'overdue' | 'blocker_aged' | 'critical_path_slip' | 'no_update'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  variance_days: number | null
}

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

const reforecastKeys = {
  criticalPath: (projectId: string) => ['reforecast', 'critical-path', projectId] as const,
  varianceAlerts: (projectId: string) => ['reforecast', 'variance-alerts', projectId] as const,
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useReforecast() {
  const qc = useQueryClient()
  return useMutation<ReforecastResult, Error, { projectId: string; updatedTaskIds: string[] }>({
    mutationFn: async ({ projectId, updatedTaskIds }) => {
      const { data } = await client.post(`/projects/${projectId}/reforecast`, {
        updated_task_ids: updatedTaskIds,
      })
      return data
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: reforecastKeys.criticalPath(data.project_id) })
      qc.invalidateQueries({ queryKey: reforecastKeys.varianceAlerts(data.project_id) })
    },
  })
}

export function useCriticalPath(projectId: string | undefined) {
  return useQuery<CriticalPath>({
    queryKey: reforecastKeys.criticalPath(projectId ?? ''),
    queryFn: async () => {
      const { data } = await client.get(`/projects/${projectId}/critical-path`)
      return data
    },
    enabled: !!projectId,
  })
}

export function useVarianceAlerts(projectId: string | undefined) {
  return useQuery<VarianceAlert[]>({
    queryKey: reforecastKeys.varianceAlerts(projectId ?? ''),
    queryFn: async () => {
      const { data } = await client.get(`/projects/${projectId}/variance-alerts`)
      return data
    },
    enabled: !!projectId,
  })
}
