import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from '@/api/client'

// ---- Types ----

export type RACIRole = 'R' | 'A' | 'C' | 'I' | null

export interface RACICell {
  issue_id: string
  user_id: string
  role: RACIRole
}

export interface RACIRow {
  issue_id: string
  issue_key: string
  issue_summary: string
  assignments: Record<string, RACIRole> // keyed by user_id
}

export interface RACIMember {
  user_id: string
  display_name: string
  avatar_url: string | null
}

export interface RACIMatrixData {
  rows: RACIRow[]
  members: RACIMember[]
}

export interface UpdateRACICellInput {
  issue_id: string
  user_id: string
  role: RACIRole
}

// ---- Query keys ----

const raciKeys = {
  matrix: (projectId: string) => ['raci-matrix', projectId] as const,
}

// ---- Hooks ----

/** Fetch the full RACI matrix for a project */
export function useRACIMatrix(projectId: string) {
  return useQuery<RACIMatrixData>({
    queryKey: raciKeys.matrix(projectId),
    queryFn: async () => {
      const { data } = await client.get(`/projects/${projectId}/raci`)
      return data
    },
    enabled: !!projectId,
  })
}

/** Mutation to set a single RACI cell assignment */
export function useUpdateRACICell(projectId: string) {
  const qc = useQueryClient()
  return useMutation<void, Error, UpdateRACICellInput>({
    mutationFn: async (body) => {
      await client.put(`/projects/${projectId}/raci`, body)
    },
    onMutate: async (newCell) => {
      // Optimistic update
      await qc.cancelQueries({ queryKey: raciKeys.matrix(projectId) })
      const previous = qc.getQueryData<RACIMatrixData>(raciKeys.matrix(projectId))

      if (previous) {
        const updatedRows = previous.rows.map((row) => {
          if (row.issue_id !== newCell.issue_id) return row
          return {
            ...row,
            assignments: {
              ...row.assignments,
              [newCell.user_id]: newCell.role,
            },
          }
        })
        qc.setQueryData<RACIMatrixData>(raciKeys.matrix(projectId), {
          ...previous,
          rows: updatedRows,
        })
      }

      return { previous }
    },
    onError: (_err, _newCell, context) => {
      // Rollback on error
      if (context?.previous) {
        qc.setQueryData(raciKeys.matrix(projectId), context.previous)
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: raciKeys.matrix(projectId) })
    },
  })
}
