import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from '@/api/client'
import type { CursorPage, Milestone } from '@/types/api'

// ---- Types for milestone mutations ----

export interface CreateMilestoneInput {
  name: string
  description?: string | null
  milestone_type?: string
  status?: string
  start_date?: string | null
  due_date?: string | null
}

export interface UpdateMilestoneInput {
  name?: string
  description?: string | null
  milestone_type?: string
  status?: string
  start_date?: string | null
  due_date?: string | null
  completed_date?: string | null
  progress_pct?: number
}

export interface GateApproval {
  id: string
  milestone_id: string
  approver_id: string
  approver_name: string
  status: 'pending' | 'approved' | 'rejected'
  notes: string | null
  decided_at: string | null
  created_at: string
}

export interface GateApprovalRequestInput {
  milestone_id: string
  approver_id: string
  notes?: string | null
}

export interface GateApprovalDecisionInput {
  approval_id: string
  decision: 'approved' | 'rejected'
  notes?: string | null
}

// ---- Query keys ----

const milestoneKeys = {
  all: (projectId: string) => ['milestones', projectId] as const,
  detail: (milestoneId: string) => ['milestones', 'detail', milestoneId] as const,
  gateApprovals: (milestoneId: string) => ['gate-approvals', milestoneId] as const,
}

// ---- Hooks ----

/** Fetch all milestones for a project */
export function useMilestones(projectId: string) {
  return useQuery<CursorPage<Milestone>>({
    queryKey: milestoneKeys.all(projectId),
    queryFn: async () => {
      const { data } = await client.get(`/projects/${projectId}/milestones`)
      return data
    },
    enabled: !!projectId,
  })
}

/** Fetch gate approvals for a milestone */
export function useGateApprovals(milestoneId: string) {
  return useQuery<CursorPage<GateApproval>>({
    queryKey: milestoneKeys.gateApprovals(milestoneId),
    queryFn: async () => {
      const { data } = await client.get(`/milestones/${milestoneId}/gate-approvals`)
      return data
    },
    enabled: !!milestoneId,
  })
}

/** Create a new milestone */
export function useCreateMilestone(projectId: string) {
  const qc = useQueryClient()
  return useMutation<Milestone, Error, CreateMilestoneInput>({
    mutationFn: async (body) => {
      const { data } = await client.post(`/projects/${projectId}/milestones`, body)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: milestoneKeys.all(projectId) })
    },
  })
}

/** Update an existing milestone */
export function useUpdateMilestone(projectId: string) {
  const qc = useQueryClient()
  return useMutation<Milestone, Error, { id: string; body: UpdateMilestoneInput }>({
    mutationFn: async ({ id, body }) => {
      const { data } = await client.patch(`/milestones/${id}`, body)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: milestoneKeys.all(projectId) })
    },
  })
}

/** Delete a milestone */
export function useDeleteMilestone(projectId: string) {
  const qc = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      await client.delete(`/milestones/${id}`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: milestoneKeys.all(projectId) })
    },
  })
}

/** Request or decide on a gate approval */
export function useGateApproval() {
  const qc = useQueryClient()

  const requestApproval = useMutation<GateApproval, Error, GateApprovalRequestInput>({
    mutationFn: async (body) => {
      const { data } = await client.post(
        `/milestones/${body.milestone_id}/gate-approvals`,
        body,
      )
      return data
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({
        queryKey: milestoneKeys.gateApprovals(variables.milestone_id),
      })
    },
  })

  const decideApproval = useMutation<GateApproval, Error, GateApprovalDecisionInput>({
    mutationFn: async (body) => {
      const { data } = await client.post(
        `/gate-approvals/${body.approval_id}/decide`,
        { decision: body.decision, notes: body.notes },
      )
      return data
    },
    onSuccess: () => {
      // Invalidate all gate approvals since we don't know which milestone
      qc.invalidateQueries({ queryKey: ['gate-approvals'] })
      qc.invalidateQueries({ queryKey: ['milestones'] })
    },
  })

  return { requestApproval, decideApproval }
}
