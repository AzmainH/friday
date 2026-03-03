import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from '@/api/client'
import type { RoadmapPlan } from '@/types/api'

/* ------------------------------------------------------------------ */
/*  Query-key factories                                                */
/* ------------------------------------------------------------------ */

const roadmapKeys = {
  all: ['roadmaps'] as const,
  lists: (workspaceId: string) => ['roadmaps', 'list', workspaceId] as const,
  detail: (planId: string) => ['roadmaps', 'detail', planId] as const,
  timeline: (planId: string) => ['roadmaps', 'timeline', planId] as const,
}

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface RoadmapTimelineIssue {
  id: string
  issue_key: string
  summary: string
  start_date: string | null
  due_date: string | null
  assignee_id: string | null
  percent_complete: number
  priority: string
}

export interface RoadmapTimelineMilestone {
  id: string
  name: string
  due_date: string | null
  status: string
}

export interface RoadmapTimelineProject {
  id: string
  name: string
  key_prefix: string
  rag_status: string
  start_date: string | null
  target_date: string | null
  issues: RoadmapTimelineIssue[]
  milestones: RoadmapTimelineMilestone[]
}

export interface RoadmapTimeline {
  plan: RoadmapPlan
  projects: RoadmapTimelineProject[]
}

export interface RoadmapScenario {
  id: string
  plan_id: string
  name: string
  is_baseline: boolean
  overrides: ScenarioOverride[]
  created_at: string
}

export interface ScenarioOverride {
  issue_id: string
  start_date?: string | null
  due_date?: string | null
  assignee_id?: string | null
}

export interface CreateRoadmapInput {
  workspace_id: string
  name: string
  description?: string | null
  start_date?: string | null
  end_date?: string | null
}

export interface UpdateRoadmapInput {
  name?: string
  description?: string | null
  start_date?: string | null
  end_date?: string | null
}

export interface AddProjectToRoadmapInput {
  plan_id: string
  project_id: string
}

/* ------------------------------------------------------------------ */
/*  Query hooks                                                        */
/* ------------------------------------------------------------------ */

/** Fetch all roadmap plans for a workspace. */
export function useRoadmapPlans(workspaceId: string | undefined) {
  return useQuery<RoadmapPlan[]>({
    queryKey: roadmapKeys.lists(workspaceId ?? ''),
    queryFn: async () => {
      const { data } = await client.get('/roadmaps', {
        params: { workspace_id: workspaceId },
      })
      return (data?.data ?? data) ?? []
    },
    enabled: !!workspaceId,
  })
}

/** Fetch a single roadmap plan by ID. */
export function useRoadmapDetail(planId: string | undefined) {
  return useQuery<RoadmapPlan>({
    queryKey: roadmapKeys.detail(planId ?? ''),
    queryFn: async () => {
      const { data } = await client.get(`/roadmaps/${planId}`)
      return data
    },
    enabled: !!planId,
  })
}

/** Fetch timeline data (projects + issues + milestones) for a roadmap plan. */
export function useRoadmapTimeline(planId: string | undefined) {
  return useQuery<RoadmapTimeline>({
    queryKey: roadmapKeys.timeline(planId ?? ''),
    queryFn: async () => {
      const { data } = await client.get(`/roadmaps/${planId}/timeline`)
      return data
    },
    enabled: !!planId,
  })
}

/* ------------------------------------------------------------------ */
/*  Mutation hooks                                                     */
/* ------------------------------------------------------------------ */

/** Create a new roadmap plan. */
export function useCreateRoadmap() {
  const qc = useQueryClient()
  return useMutation<RoadmapPlan, Error, CreateRoadmapInput>({
    mutationFn: async (body) => {
      const { data } = await client.post('/roadmaps', body)
      return data
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: roadmapKeys.lists(variables.workspace_id) })
    },
  })
}

/** Update an existing roadmap plan. */
export function useUpdateRoadmap() {
  const qc = useQueryClient()
  return useMutation<RoadmapPlan, Error, { id: string; body: UpdateRoadmapInput }>({
    mutationFn: async ({ id, body }) => {
      const { data } = await client.patch(`/roadmaps/${id}`, body)
      return data
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: roadmapKeys.detail(data.id) })
      qc.invalidateQueries({ queryKey: roadmapKeys.all })
    },
  })
}

/** Add a project to a roadmap plan. */
export function useAddProjectToRoadmap() {
  const qc = useQueryClient()
  return useMutation<void, Error, AddProjectToRoadmapInput>({
    mutationFn: async ({ plan_id, project_id }) => {
      await client.post(`/roadmaps/${plan_id}/projects`, { project_id })
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: roadmapKeys.detail(variables.plan_id) })
      qc.invalidateQueries({ queryKey: roadmapKeys.timeline(variables.plan_id) })
    },
  })
}
