import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from '@/api/client'
import type { SavedView } from '@/types/api'

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

const savedViewKeys = {
  all: (projectId: string) => ['saved-views', projectId] as const,
  detail: (viewId: string) => ['saved-views', 'detail', viewId] as const,
}

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

async function fetchSavedViews(projectId: string): Promise<SavedView[]> {
  const { data } = await client.get(`/projects/${projectId}/saved-views`)
  // The API may return { data: [...] } (cursor-page) or a plain array
  return Array.isArray(data) ? data : data.data ?? []
}

export interface SaveViewInput {
  projectId: string
  /** When provided the view is updated; otherwise a new view is created. */
  viewId?: string
  name: string
  description?: string | null
  filters_json?: Record<string, unknown> | null
  columns_json?: string[] | null
  sort_json?: Record<string, unknown> | null
  is_shared?: boolean
}

async function saveView(input: SaveViewInput): Promise<SavedView> {
  const { projectId, viewId, ...body } = input

  if (viewId) {
    const { data } = await client.patch(
      `/projects/${projectId}/saved-views/${viewId}`,
      body,
    )
    return data
  }

  const { data } = await client.post(
    `/projects/${projectId}/saved-views`,
    body,
  )
  return data
}

async function deleteSavedView(
  projectId: string,
  viewId: string,
): Promise<void> {
  await client.delete(`/projects/${projectId}/saved-views/${viewId}`)
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

/** List all saved views for a project. */
export function useSavedViews(projectId: string | undefined) {
  return useQuery<SavedView[]>({
    queryKey: savedViewKeys.all(projectId ?? ''),
    queryFn: () => fetchSavedViews(projectId!),
    enabled: Boolean(projectId),
  })
}

/** Create or update a saved view. */
export function useSaveView() {
  const qc = useQueryClient()

  return useMutation<SavedView, Error, SaveViewInput>({
    mutationFn: saveView,
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({
        queryKey: savedViewKeys.all(variables.projectId),
      })
    },
  })
}

/** Delete a saved view. */
export function useDeleteView() {
  const qc = useQueryClient()

  return useMutation<void, Error, { projectId: string; viewId: string }>({
    mutationFn: ({ projectId, viewId }) =>
      deleteSavedView(projectId, viewId),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({
        queryKey: savedViewKeys.all(variables.projectId),
      })
    },
  })
}
