import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateIssue } from '@/api/issues'
import type { Issue } from '@/types/api'

interface MoveIssueParams {
  issueId: string
  newStatusId: string
  newSortOrder: number
}

interface MoveIssueContext {
  previous: Map<string, Issue[]> | undefined
}

/**
 * Optimistic mutation for moving an issue to a different status column
 * and/or reordering it within a column on the Kanban board.
 */
export function useMoveIssue(projectId: string | undefined) {
  const queryClient = useQueryClient()
  const queryKey = ['issues', 'board', projectId]

  return useMutation<Issue, Error, MoveIssueParams, MoveIssueContext>({
    mutationFn: ({ issueId, newStatusId, newSortOrder }) =>
      updateIssue(issueId, {
        status_id: newStatusId,
        sort_order: newSortOrder,
      }),

    onMutate: async ({ issueId, newStatusId, newSortOrder }) => {
      // Cancel any in-flight queries so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey })

      // Snapshot previous value for rollback
      const previous = queryClient.getQueryData<Map<string, Issue[]>>(queryKey)

      // Optimistically update the grouped data
      queryClient.setQueryData<Map<string, Issue[]>>(queryKey, (old) => {
        if (!old) return old
        const next = new Map<string, Issue[]>()

        // Deep-clone each column
        for (const [statusId, issues] of old) {
          next.set(
            statusId,
            issues.filter((i) => i.id !== issueId),
          )
        }

        // Find the issue being moved from the original data
        let movedIssue: Issue | undefined
        for (const [, issues] of old) {
          movedIssue = issues.find((i) => i.id === issueId)
          if (movedIssue) break
        }

        if (movedIssue) {
          const updated: Issue = {
            ...movedIssue,
            status_id: newStatusId,
            sort_order: newSortOrder,
          }

          const column = next.get(newStatusId) ?? []
          column.push(updated)
          column.sort((a, b) => a.sort_order - b.sort_order)
          next.set(newStatusId, column)
        }

        return next
      })

      return { previous }
    },

    onError: (_err, _vars, context) => {
      // Rollback to the snapshot on error
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous)
      }
    },

    onSettled: () => {
      // Always refetch after mutation to ensure server state consistency
      queryClient.invalidateQueries({ queryKey })
    },
  })
}
