import { useMutation } from '@tanstack/react-query'
import client from '@/api/client'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ProjectPlanRequest {
  description: string
  constraints?: string | null
}

export interface PlanTask {
  summary: string
  description?: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  estimated_hours: number
  planned_start?: string
  planned_end?: string
  deliverable?: string
}

export interface PlanDeliverable {
  name: string
  description: string
  acceptance_criteria?: string[]
}

export interface PlanRole {
  title: string
  responsibilities: string[]
  count: number
}

export interface PlanMilestone {
  name: string
  target_date: string
  deliverables: string[]
}

export interface PlanTimeline {
  start_date: string
  end_date: string
  milestones: PlanMilestone[]
}

export interface PlanWorkflow {
  name: string
  category: string
  order?: number
}

export interface ProjectPlanResponse {
  summary: string
  deliverables: PlanDeliverable[]
  workflows: PlanWorkflow[]
  tasks: PlanTask[]
  roles: PlanRole[]
  timeline: PlanTimeline
}

export interface PlanRefinementRequest {
  plan_id: string
  corrections: string
}

export interface ApplyPlanRequest {
  plan: ProjectPlanResponse
  workspace_id: string
  project_name: string
}

export interface ApplyPlanResponse {
  project_id: string
  project_name: string
  issues_created: number
  total_tasks: number
}

export interface BaselineLockRequest {
  project_id: string
  name?: string
}

export interface BaselineLockResponse {
  baseline_id: string
  snapshot_count: number
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/** Generate a structured project plan from a natural language description */
export function useGeneratePlan() {
  return useMutation<ProjectPlanResponse, Error, ProjectPlanRequest>({
    mutationFn: async (body) => {
      const { data } = await client.post('/projects/generate', body)
      return data
    },
  })
}

/** Refine an existing plan with natural language corrections */
export function useRefinePlan(projectId: string) {
  return useMutation<ProjectPlanResponse, Error, PlanRefinementRequest>({
    mutationFn: async (body) => {
      const { data } = await client.post(`/projects/${projectId}/refine`, body)
      return data
    },
  })
}

/** Materialize a generated plan into real project entities */
export function useApplyPlan() {
  return useMutation<ApplyPlanResponse, Error, ApplyPlanRequest>({
    mutationFn: async (body) => {
      const { data } = await client.post('/projects/generate/apply', body)
      return data
    },
  })
}

/** Lock a baseline snapshot for all current issues in a project */
export function useLockBaseline(projectId: string) {
  return useMutation<BaselineLockResponse, Error, BaselineLockRequest>({
    mutationFn: async (body) => {
      const { data } = await client.post(
        `/projects/${projectId}/lock-baseline`,
        body,
      )
      return data
    },
  })
}
