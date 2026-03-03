import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from '@/api/client'
import type {
  Project,
  Workflow,
  WorkflowStatus,
  IssueType,
  Label,
  User,
} from '@/types/api'
import { useProjectStore } from '@/stores/projectStore'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ProjectMember {
  id: string
  project_id: string
  user_id: string
  role: 'admin' | 'member' | 'viewer'
  capacity_pct: number
  hours_per_week: number
  user?: User
}

export interface WorkflowTransition {
  id: string
  workflow_id: string
  from_status_id: string
  to_status_id: string
  name: string
}

export interface WorkflowDetail extends Workflow {
  statuses: WorkflowStatus[]
  transitions: WorkflowTransition[]
}

export interface CustomFieldDefinition {
  id: string
  project_id: string
  name: string
  field_type: 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'checkbox' | 'url' | 'user'
  options: string[] | null
  is_required: boolean
  sort_order: number
}

// ---------------------------------------------------------------------------
// Project detail
// ---------------------------------------------------------------------------

export function useProjectDetail(projectId: string | undefined) {
  const setCurrentProject = useProjectStore((s) => s.setCurrentProject)

  return useQuery<Project>({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const { data } = await client.get(`/projects/${projectId}`)
      setCurrentProject(data)
      return data
    },
    enabled: !!projectId,
  })
}

// ---------------------------------------------------------------------------
// Update project (PATCH)
// ---------------------------------------------------------------------------

export function useUpdateProject() {
  const qc = useQueryClient()
  const setCurrentProject = useProjectStore((s) => s.setCurrentProject)

  return useMutation<Project, Error, { projectId: string; body: Partial<Project> }>({
    mutationFn: async ({ projectId, body }) => {
      const { data } = await client.patch(`/projects/${projectId}`, body)
      return data
    },
    onSuccess: (updated) => {
      setCurrentProject(updated)
      qc.setQueryData(['project', updated.id], updated)
      qc.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}

// ---------------------------------------------------------------------------
// Project members
// ---------------------------------------------------------------------------

export function useProjectMembers(projectId: string | undefined) {
  return useQuery<ProjectMember[]>({
    queryKey: ['projectMembers', projectId],
    queryFn: async () => {
      const { data } = await client.get(`/projects/${projectId}/members`)
      return Array.isArray(data) ? data : data.data ?? []
    },
    enabled: !!projectId,
  })
}

export function useAddProjectMember() {
  const qc = useQueryClient()
  return useMutation<
    ProjectMember,
    Error,
    { projectId: string; body: { user_id: string; role: string; capacity_pct?: number; hours_per_week?: number } }
  >({
    mutationFn: async ({ projectId, body }) => {
      const { data } = await client.post(`/projects/${projectId}/members`, body)
      return data
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['projectMembers', variables.projectId] })
    },
  })
}

export function useUpdateProjectMember() {
  const qc = useQueryClient()
  return useMutation<ProjectMember, Error, { memberId: string; projectId: string; body: Partial<ProjectMember> }>({
    mutationFn: async ({ memberId, body }) => {
      const { data } = await client.patch(`/project-members/${memberId}`, body)
      return data
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['projectMembers', variables.projectId] })
    },
  })
}

export function useRemoveProjectMember() {
  const qc = useQueryClient()
  return useMutation<void, Error, { memberId: string; projectId: string }>({
    mutationFn: async ({ memberId }) => {
      await client.delete(`/project-members/${memberId}`)
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['projectMembers', variables.projectId] })
    },
  })
}

// ---------------------------------------------------------------------------
// Issue types
// ---------------------------------------------------------------------------

export function useIssueTypes(projectId: string | undefined) {
  const setIssueTypes = useProjectStore((s) => s.setIssueTypes)

  return useQuery<IssueType[]>({
    queryKey: ['issueTypes', projectId],
    queryFn: async () => {
      const { data } = await client.get(`/projects/${projectId}/issue-types`)
      const list = Array.isArray(data) ? data : data.data ?? []
      setIssueTypes(list)
      return list
    },
    enabled: !!projectId,
  })
}

export function useCreateIssueType() {
  const qc = useQueryClient()
  return useMutation<IssueType, Error, { projectId: string; body: Partial<IssueType> }>({
    mutationFn: async ({ projectId, body }) => {
      const { data } = await client.post(`/projects/${projectId}/issue-types`, body)
      return data
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['issueTypes', variables.projectId] })
    },
  })
}

export function useUpdateIssueType() {
  const qc = useQueryClient()
  return useMutation<IssueType, Error, { issueTypeId: string; projectId: string; body: Partial<IssueType> }>({
    mutationFn: async ({ issueTypeId, body }) => {
      const { data } = await client.patch(`/issue-types/${issueTypeId}`, body)
      return data
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['issueTypes', variables.projectId] })
    },
  })
}

export function useDeleteIssueType() {
  const qc = useQueryClient()
  return useMutation<void, Error, { issueTypeId: string; projectId: string }>({
    mutationFn: async ({ issueTypeId }) => {
      await client.delete(`/issue-types/${issueTypeId}`)
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['issueTypes', variables.projectId] })
    },
  })
}

// ---------------------------------------------------------------------------
// Labels
// ---------------------------------------------------------------------------

export function useLabels(projectId: string | undefined) {
  return useQuery<Label[]>({
    queryKey: ['labels', projectId],
    queryFn: async () => {
      const { data } = await client.get(`/projects/${projectId}/labels`)
      return Array.isArray(data) ? data : data.data ?? []
    },
    enabled: !!projectId,
  })
}

export function useCreateLabel() {
  const qc = useQueryClient()
  return useMutation<Label, Error, { projectId: string; body: Partial<Label> }>({
    mutationFn: async ({ projectId, body }) => {
      const { data } = await client.post(`/projects/${projectId}/labels`, body)
      return data
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['labels', variables.projectId] })
    },
  })
}

export function useUpdateLabel() {
  const qc = useQueryClient()
  return useMutation<Label, Error, { labelId: string; projectId: string; body: Partial<Label> }>({
    mutationFn: async ({ labelId, body }) => {
      const { data } = await client.patch(`/labels/${labelId}`, body)
      return data
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['labels', variables.projectId] })
    },
  })
}

export function useDeleteLabel() {
  const qc = useQueryClient()
  return useMutation<void, Error, { labelId: string; projectId: string }>({
    mutationFn: async ({ labelId }) => {
      await client.delete(`/labels/${labelId}`)
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['labels', variables.projectId] })
    },
  })
}

// ---------------------------------------------------------------------------
// Workflow
// ---------------------------------------------------------------------------

export function useWorkflow(projectId: string | undefined) {
  const setWorkflow = useProjectStore((s) => s.setWorkflow)
  const setStatuses = useProjectStore((s) => s.setStatuses)

  return useQuery<WorkflowDetail>({
    queryKey: ['workflow', projectId],
    queryFn: async () => {
      const { data } = await client.get(`/projects/${projectId}/workflows`)
      // API may return a single workflow or an array; normalise
      const wf: WorkflowDetail = Array.isArray(data) ? data[0] : data
      setWorkflow(wf)
      setStatuses(wf.statuses ?? [])
      return wf
    },
    enabled: !!projectId,
  })
}

export function useSaveWorkflow() {
  const qc = useQueryClient()
  return useMutation<
    WorkflowDetail,
    Error,
    {
      projectId: string
      workflowId: string
      body: { statuses: Partial<WorkflowStatus>[]; transitions: Partial<WorkflowTransition>[] }
    }
  >({
    mutationFn: async ({ workflowId, body }) => {
      const { data } = await client.put(`/workflows/${workflowId}`, body)
      return data
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['workflow', variables.projectId] })
    },
  })
}

// ---------------------------------------------------------------------------
// Custom field definitions
// ---------------------------------------------------------------------------

export function useCustomFields(projectId: string | undefined) {
  return useQuery<CustomFieldDefinition[]>({
    queryKey: ['customFields', projectId],
    queryFn: async () => {
      const { data } = await client.get(`/projects/${projectId}/custom-fields`)
      return Array.isArray(data) ? data : data.data ?? []
    },
    enabled: !!projectId,
  })
}

export function useCreateCustomField() {
  const qc = useQueryClient()
  return useMutation<CustomFieldDefinition, Error, { projectId: string; body: Partial<CustomFieldDefinition> }>({
    mutationFn: async ({ projectId, body }) => {
      const { data } = await client.post(`/projects/${projectId}/custom-fields`, body)
      return data
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['customFields', variables.projectId] })
    },
  })
}

export function useUpdateCustomField() {
  const qc = useQueryClient()
  return useMutation<
    CustomFieldDefinition,
    Error,
    { fieldId: string; projectId: string; body: Partial<CustomFieldDefinition> }
  >({
    mutationFn: async ({ fieldId, body }) => {
      const { data } = await client.patch(`/custom-fields/${fieldId}`, body)
      return data
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['customFields', variables.projectId] })
    },
  })
}

export function useDeleteCustomField() {
  const qc = useQueryClient()
  return useMutation<void, Error, { fieldId: string; projectId: string }>({
    mutationFn: async ({ fieldId }) => {
      await client.delete(`/custom-fields/${fieldId}`)
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['customFields', variables.projectId] })
    },
  })
}

// ---------------------------------------------------------------------------
// Users (for dropdowns)
// ---------------------------------------------------------------------------

export function useUsers() {
  return useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await client.get('/users')
      return Array.isArray(data) ? data : data.data ?? []
    },
    staleTime: 5 * 60 * 1000, // cache users for 5 minutes
  })
}
