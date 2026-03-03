import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from '@/api/client'
import type { WikiPage, WikiSpace } from '@/types/api'
import axios from 'axios'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WikiTreeNode {
  id: string
  parent_id: string | null
  title: string
  slug: string
  children: WikiTreeNode[]
}

export interface WikiPageVersion {
  id: string
  page_id: string
  version: number
  title: string
  content: string | null
  change_summary: string | null
  edited_by: string | null
  created_at: string
}

export interface WikiComment {
  id: string
  page_id: string
  parent_comment_id: string | null
  author_id: string
  content: string
  created_at: string
  updated_at: string
  author?: {
    id: string
    display_name: string
    avatar_url: string | null
  }
  replies?: WikiComment[]
}

export interface WikiSearchResult {
  page_id: string
  title: string
  snippet: string
  relevance: number
}

export interface VersionConflictError {
  type: 'VERSION_CONFLICT'
  detail: string
  current_version: number
}

// ---------------------------------------------------------------------------
// Helper: detect 409 VERSION_CONFLICT
// ---------------------------------------------------------------------------

function isVersionConflict(error: unknown): error is { response: { status: 409; data: VersionConflictError } } {
  if (!axios.isAxiosError(error)) return false
  return error.response?.status === 409 && error.response?.data?.type === 'VERSION_CONFLICT'
}

// ---------------------------------------------------------------------------
// Spaces
// ---------------------------------------------------------------------------

export function useWikiSpaces(workspaceId: string | null) {
  return useQuery<WikiSpace[]>({
    queryKey: ['wikiSpaces', workspaceId],
    queryFn: async () => {
      const { data } = await client.get(`/workspaces/${workspaceId}/wiki-spaces`)
      return data
    },
    enabled: !!workspaceId,
  })
}

// ---------------------------------------------------------------------------
// Tree
// ---------------------------------------------------------------------------

export function useWikiTree(spaceId: string | null) {
  return useQuery<WikiTreeNode[]>({
    queryKey: ['wikiTree', spaceId],
    queryFn: async () => {
      const { data } = await client.get(`/wiki-spaces/${spaceId}/tree`)
      return data
    },
    enabled: !!spaceId,
  })
}

// ---------------------------------------------------------------------------
// Single page
// ---------------------------------------------------------------------------

export function useWikiPage(pageId: string | null) {
  return useQuery<WikiPage>({
    queryKey: ['wikiPage', pageId],
    queryFn: async () => {
      const { data } = await client.get(`/wiki-pages/${pageId}`)
      return data
    },
    enabled: !!pageId,
  })
}

// ---------------------------------------------------------------------------
// Create page
// ---------------------------------------------------------------------------

export function useCreatePage() {
  const qc = useQueryClient()

  return useMutation<
    WikiPage,
    Error,
    { spaceId: string; title: string; content?: string; parentId?: string | null }
  >({
    mutationFn: async ({ spaceId, title, content, parentId }) => {
      const { data } = await client.post(`/wiki-spaces/${spaceId}/pages`, {
        title,
        content: content ?? '',
        parent_id: parentId ?? null,
      })
      return data
    },
    onSuccess: (page) => {
      qc.invalidateQueries({ queryKey: ['wikiTree', page.space_id] })
      qc.invalidateQueries({ queryKey: ['wikiSpaces'] })
    },
  })
}

// ---------------------------------------------------------------------------
// Update page (with OCC via expected_version)
// ---------------------------------------------------------------------------

export function useUpdatePage() {
  const qc = useQueryClient()
  const [conflictError, setConflictError] = useState<VersionConflictError | null>(null)

  const mutation = useMutation<
    WikiPage,
    Error,
    { pageId: string; title: string; content: string; expected_version: number }
  >({
    mutationFn: async ({ pageId, title, content, expected_version }) => {
      const { data } = await client.patch(`/wiki-pages/${pageId}`, {
        title,
        content,
        expected_version,
      })
      return data
    },
    onSuccess: (page) => {
      setConflictError(null)
      qc.setQueryData(['wikiPage', page.id], page)
      qc.invalidateQueries({ queryKey: ['wikiTree', page.space_id] })
      qc.invalidateQueries({ queryKey: ['wikiPageVersions', page.id] })
    },
    onError: (error) => {
      if (isVersionConflict(error)) {
        setConflictError((error as { response: { data: VersionConflictError } }).response.data)
      }
    },
  })

  const dismissConflict = useCallback(() => {
    setConflictError(null)
  }, [])

  return { ...mutation, conflictError, dismissConflict }
}

// ---------------------------------------------------------------------------
// Delete page
// ---------------------------------------------------------------------------

export function useDeletePage() {
  const qc = useQueryClient()

  return useMutation<void, Error, { pageId: string; spaceId: string }>({
    mutationFn: async ({ pageId }) => {
      await client.delete(`/wiki-pages/${pageId}`)
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['wikiTree', variables.spaceId] })
      qc.removeQueries({ queryKey: ['wikiPage', variables.pageId] })
    },
  })
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

export function useWikiSearch(spaceId: string | null, query: string) {
  const [debouncedQuery, setDebouncedQuery] = useState(query)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  const enabled = !!spaceId && debouncedQuery.length >= 2

  return useQuery<WikiSearchResult[]>({
    queryKey: ['wikiSearch', spaceId, debouncedQuery],
    queryFn: async () => {
      const { data } = await client.get(`/wiki-spaces/${spaceId}/search`, {
        params: { q: debouncedQuery },
      })
      return data
    },
    enabled,
    staleTime: 10_000,
  })
}

// ---------------------------------------------------------------------------
// Version history
// ---------------------------------------------------------------------------

export function usePageVersions(pageId: string | null) {
  return useQuery<WikiPageVersion[]>({
    queryKey: ['wikiPageVersions', pageId],
    queryFn: async () => {
      const { data } = await client.get(`/wiki-pages/${pageId}/versions`)
      return data
    },
    enabled: !!pageId,
  })
}

export function useRestoreVersion() {
  const qc = useQueryClient()

  return useMutation<WikiPage, Error, { pageId: string; versionId: string }>({
    mutationFn: async ({ pageId, versionId }) => {
      const { data } = await client.post(`/wiki-pages/${pageId}/versions/${versionId}/restore`)
      return data
    },
    onSuccess: (page) => {
      qc.setQueryData(['wikiPage', page.id], page)
      qc.invalidateQueries({ queryKey: ['wikiPageVersions', page.id] })
      qc.invalidateQueries({ queryKey: ['wikiTree', page.space_id] })
    },
  })
}

// ---------------------------------------------------------------------------
// Comments (threaded)
// ---------------------------------------------------------------------------

export function useWikiComments(pageId: string | null) {
  return useQuery<WikiComment[]>({
    queryKey: ['wikiComments', pageId],
    queryFn: async () => {
      const { data } = await client.get(`/wiki-pages/${pageId}/comments`)
      return data
    },
    enabled: !!pageId,
  })
}

export function useAddWikiComment() {
  const qc = useQueryClient()

  return useMutation<
    WikiComment,
    Error,
    { pageId: string; content: string; parentCommentId?: string | null }
  >({
    mutationFn: async ({ pageId, content, parentCommentId }) => {
      const { data } = await client.post(`/wiki-pages/${pageId}/comments`, {
        content,
        parent_comment_id: parentCommentId ?? null,
      })
      return data
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['wikiComments', variables.pageId] })
    },
  })
}

export function useUpdateWikiComment() {
  const qc = useQueryClient()

  return useMutation<WikiComment, Error, { commentId: string; content: string; pageId: string }>({
    mutationFn: async ({ commentId, content }) => {
      const { data } = await client.patch(`/wiki-comments/${commentId}`, { content })
      return data
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['wikiComments', variables.pageId] })
    },
  })
}

export function useDeleteWikiComment() {
  const qc = useQueryClient()

  return useMutation<void, Error, { commentId: string; pageId: string }>({
    mutationFn: async ({ commentId }) => {
      await client.delete(`/wiki-comments/${commentId}`)
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['wikiComments', variables.pageId] })
    },
  })
}

// ---------------------------------------------------------------------------
// Move page (reorder / reparent)
// ---------------------------------------------------------------------------

export function useMovePage() {
  const qc = useQueryClient()

  return useMutation<
    WikiPage,
    Error,
    { pageId: string; spaceId: string; newParentId: string | null; newSortOrder: number }
  >({
    mutationFn: async ({ pageId, newParentId, newSortOrder }) => {
      const { data } = await client.patch(`/wiki-pages/${pageId}/move`, {
        parent_id: newParentId,
        sort_order: newSortOrder,
      })
      return data
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['wikiTree', variables.spaceId] })
    },
  })
}
