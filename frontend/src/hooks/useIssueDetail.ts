import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getIssue,
  updateIssue,
  listComments,
  createComment,
  updateComment,
  deleteComment,
} from '@/api/issues'
import type { Issue, IssueComment, CursorPage } from '@/types/api'

/** Fetch a single issue by ID */
export function useIssueDetail(issueId: string | null) {
  return useQuery<Issue>({
    queryKey: ['issue', issueId],
    queryFn: () => getIssue(issueId!),
    enabled: !!issueId,
  })
}

/** Mutation to update issue fields */
export function useIssueUpdate() {
  const qc = useQueryClient()
  return useMutation<Issue, Error, { issueId: string; body: Record<string, unknown> }>({
    mutationFn: ({ issueId, body }) => updateIssue(issueId, body),
    onSuccess: (updatedIssue) => {
      qc.setQueryData(['issue', updatedIssue.id], updatedIssue)
      qc.invalidateQueries({ queryKey: ['issues'] })
      qc.invalidateQueries({ queryKey: ['issue', updatedIssue.id] })
    },
  })
}

/** Fetch comments for an issue */
export function useIssueComments(issueId: string | null) {
  return useQuery<CursorPage<IssueComment>>({
    queryKey: ['issueComments', issueId],
    queryFn: () => listComments(issueId!),
    enabled: !!issueId,
  })
}

/** Mutation to add a comment */
export function useAddComment() {
  const qc = useQueryClient()
  return useMutation<IssueComment, Error, { issueId: string; content: string }>({
    mutationFn: ({ issueId, content }) => createComment(issueId, content),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['issueComments', variables.issueId] })
    },
  })
}

/** Mutation to update a comment */
export function useUpdateComment() {
  const qc = useQueryClient()
  return useMutation<IssueComment, Error, { commentId: string; content: string; issueId: string }>({
    mutationFn: ({ commentId, content }) => updateComment(commentId, content),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['issueComments', variables.issueId] })
    },
  })
}

/** Mutation to delete a comment */
export function useDeleteComment() {
  const qc = useQueryClient()
  return useMutation<void, Error, { commentId: string; issueId: string }>({
    mutationFn: ({ commentId }) => deleteComment(commentId),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['issueComments', variables.issueId] })
    },
  })
}
