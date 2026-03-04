import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from '@/api/client'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Sprint {
  id: string
  project_id: string
  name: string
  goal: string | null
  start_date: string
  end_date: string
  status: 'planning' | 'active' | 'completed' | 'cancelled'
  velocity: number | null
  created_at: string
  updated_at: string
}

export interface SprintBurndown {
  sprint_id: string
  sprint_name: string
  start_date: string
  end_date: string
  total_points: number
  completed_points: number
  remaining_points: number
  total_issues: number
  completed_issues: number
}

export interface CreateSprintInput {
  project_id: string
  name: string
  start_date: string
  end_date: string
  goal?: string
}

export interface UpdateSprintInput {
  sprintId: string
  body: {
    name?: string
    goal?: string | null
    start_date?: string
    end_date?: string
    status?: string
  }
}

export interface AddIssuesInput {
  sprintId: string
  issue_ids: string[]
}

export interface RemoveIssueInput {
  sprintId: string
  issueId: string
}

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

const sprintKeys = {
  all: ['sprints'] as const,
  byProject: (projectId: string) => ['sprints', 'project', projectId] as const,
  detail: (sprintId: string) => ['sprints', 'detail', sprintId] as const,
  burndown: (sprintId: string) => ['sprints', 'burndown', sprintId] as const,
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export function useProjectSprints(projectId: string, status?: string) {
  return useQuery<Sprint[]>({
    queryKey: [...sprintKeys.byProject(projectId), status],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (status) params.set('status', status)
      const { data } = await client.get(
        `/projects/${projectId}/sprints${params.toString() ? `?${params}` : ''}`,
      )
      return data?.data ?? data
    },
    enabled: !!projectId,
  })
}

export function useSprint(sprintId: string) {
  return useQuery<Sprint>({
    queryKey: sprintKeys.detail(sprintId),
    queryFn: async () => {
      const { data } = await client.get(`/sprints/${sprintId}`)
      return data
    },
    enabled: !!sprintId,
  })
}

export function useSprintBurndown(sprintId: string) {
  return useQuery<SprintBurndown>({
    queryKey: sprintKeys.burndown(sprintId),
    queryFn: async () => {
      const { data } = await client.get(`/sprints/${sprintId}/burndown`)
      return data
    },
    enabled: !!sprintId,
  })
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export function useCreateSprint() {
  const qc = useQueryClient()
  return useMutation<Sprint, Error, CreateSprintInput>({
    mutationFn: async (input) => {
      const { project_id, ...body } = input
      const { data } = await client.post(`/projects/${project_id}/sprints`, body)
      return data
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: sprintKeys.byProject(variables.project_id) })
    },
  })
}

export function useUpdateSprint() {
  const qc = useQueryClient()
  return useMutation<Sprint, Error, UpdateSprintInput>({
    mutationFn: async ({ sprintId, body }) => {
      const { data } = await client.patch(`/sprints/${sprintId}`, body)
      return data
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: sprintKeys.byProject(data.project_id) })
      qc.invalidateQueries({ queryKey: sprintKeys.detail(data.id) })
    },
  })
}

export function useStartSprint() {
  const qc = useQueryClient()
  return useMutation<Sprint, Error, string>({
    mutationFn: async (sprintId) => {
      const { data } = await client.post(`/sprints/${sprintId}/start`)
      return data
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: sprintKeys.byProject(data.project_id) })
      qc.invalidateQueries({ queryKey: sprintKeys.detail(data.id) })
    },
  })
}

export function useCompleteSprint() {
  const qc = useQueryClient()
  return useMutation<Sprint, Error, string>({
    mutationFn: async (sprintId) => {
      const { data } = await client.post(`/sprints/${sprintId}/complete`)
      return data
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: sprintKeys.byProject(data.project_id) })
      qc.invalidateQueries({ queryKey: sprintKeys.detail(data.id) })
      qc.invalidateQueries({ queryKey: sprintKeys.burndown(data.id) })
    },
  })
}

export function useDeleteSprint() {
  const qc = useQueryClient()
  return useMutation<void, Error, { sprintId: string; projectId: string }>({
    mutationFn: async ({ sprintId }) => {
      await client.delete(`/sprints/${sprintId}`)
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: sprintKeys.byProject(variables.projectId) })
    },
  })
}

export function useAddIssuesToSprint() {
  const qc = useQueryClient()
  return useMutation<void, Error, AddIssuesInput>({
    mutationFn: async ({ sprintId, issue_ids }) => {
      await client.post(`/sprints/${sprintId}/issues`, { issue_ids })
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: sprintKeys.detail(variables.sprintId) })
      qc.invalidateQueries({ queryKey: sprintKeys.burndown(variables.sprintId) })
    },
  })
}

export function useRemoveIssueFromSprint() {
  const qc = useQueryClient()
  return useMutation<void, Error, RemoveIssueInput>({
    mutationFn: async ({ sprintId, issueId }) => {
      await client.delete(`/sprints/${sprintId}/issues/${issueId}`)
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: sprintKeys.detail(variables.sprintId) })
      qc.invalidateQueries({ queryKey: sprintKeys.burndown(variables.sprintId) })
    },
  })
}
