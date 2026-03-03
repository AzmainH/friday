import client from '@/api/client'
import type { CursorPage, Issue, IssueComment } from '@/types/api'

export interface ListIssuesParams {
  project_id: string
  cursor?: string | null
  limit?: number
  status_id?: string
  assignee_id?: string
  priority?: string
  sort_by?: string
  sort_order?: 'asc' | 'desc'
  include_count?: boolean
  search?: string
}

export async function listIssues(params: ListIssuesParams): Promise<CursorPage<Issue>> {
  const { project_id, ...query } = params
  const { data } = await client.get(`/projects/${project_id}/issues`, { params: query })
  return data
}

export async function getIssue(issueId: string): Promise<Issue> {
  const { data } = await client.get(`/issues/${issueId}`)
  return data
}

export async function createIssue(projectId: string, body: Record<string, unknown>): Promise<Issue> {
  const { data } = await client.post(`/projects/${projectId}/issues`, body)
  return data
}

export async function updateIssue(issueId: string, body: Record<string, unknown>): Promise<Issue> {
  const { data } = await client.patch(`/issues/${issueId}`, body)
  return data
}

export async function deleteIssue(issueId: string): Promise<void> {
  await client.delete(`/issues/${issueId}`)
}

export async function listComments(issueId: string): Promise<CursorPage<IssueComment>> {
  const { data } = await client.get(`/issues/${issueId}/comments`)
  return data
}

export async function createComment(issueId: string, content: string): Promise<IssueComment> {
  const { data } = await client.post(`/issues/${issueId}/comments`, { content })
  return data
}

export async function updateComment(commentId: string, content: string): Promise<IssueComment> {
  const { data } = await client.patch(`/comments/${commentId}`, { content })
  return data
}

export async function deleteComment(commentId: string): Promise<void> {
  await client.delete(`/comments/${commentId}`)
}
