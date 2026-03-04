import { useState, useEffect, useCallback, useRef } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import client from '@/api/client'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ResourceMatchPreview {
  document_name: string
  matched_user_id: string | null
  matched_display_name: string | null
  confidence: number
}

export interface TaskPreview {
  wbs: string
  name: string
  status: string
  hierarchy_level: number
  start_date: string | null
  end_date: string | null
  resource_names: string[]
  predecessor_count: number
}

export interface MilestonePreview {
  name: string
  milestone_type: string
  start_date: string | null
  due_date: string | null
}

export interface DocumentAnalysisResult {
  project_name: string | null
  project_description: string | null
  start_date: string | null
  end_date: string | null
  task_count: number
  milestone_count: number
  resource_count: number
  statuses_found: string[]
  hierarchy_levels: number
  resources: ResourceMatchPreview[]
  milestones: MilestonePreview[]
  tasks_preview: TaskPreview[]
  total_tasks: number
  warnings: string[]
}

export interface DocumentImportConfig {
  analysis_task_id: string
  mode: 'new' | 'existing'
  project_name?: string
  key_prefix?: string
  description?: string
  workspace_id?: string
  existing_project_id?: string
  resource_mapping: Record<string, string | null>
  status_mapping: Record<string, string>
  create_milestones: boolean
  selected_phases?: string[]
}

export type DocTaskStatus = 'pending' | 'running' | 'completed' | 'failed'

export interface DocImportTask {
  id: string
  task_type: string
  status: DocTaskStatus
  progress_pct: number
  result_summary_json: Record<string, unknown> | null
  error_message: string | null
  created_at: string
  started_at: string | null
  completed_at: string | null
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/** Upload documents and start analysis */
export function useUploadDocuments() {
  return useMutation<{ task_id: string; status: string; message: string }, Error, { files: File[] }>(
    {
      mutationFn: async ({ files }) => {
        const formData = new FormData()
        files.forEach((f) => formData.append('files', f))
        const { data } = await client.post('/document-import/analyze', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        return data
      },
    },
  )
}

/** Fetch analysis result (one-time, after task completes) */
export function useAnalysisResult(taskId: string | null) {
  return useQuery<DocumentAnalysisResult>({
    queryKey: ['document-analysis-result', taskId],
    queryFn: async () => {
      const { data } = await client.get(`/document-import/analysis/${taskId}`)
      return data
    },
    enabled: false, // manually triggered after task completes
  })
}

/** Create project from analyzed documents */
export function useCreateFromDocuments() {
  return useMutation<
    { task_id: string; status: string; message: string },
    Error,
    DocumentImportConfig
  >({
    mutationFn: async (config) => {
      const { data } = await client.post('/document-import/create', config)
      return data
    },
  })
}

// ---------------------------------------------------------------------------
// Task progress polling (reusable for both analysis and creation tasks)
// ---------------------------------------------------------------------------

export function useDocTaskProgress(taskId: string | null) {
  const [task, setTask] = useState<DocImportTask | null>(null)
  const [isPolling, setIsPolling] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setIsPolling(false)
  }, [])

  useEffect(() => {
    if (!taskId) {
      stopPolling()
      return
    }

    setIsPolling(true)
    setTask(null)

    const poll = async () => {
      try {
        const { data } = await client.get<DocImportTask>(
          `/document-import/tasks/${taskId}`,
        )
        setTask(data)

        if (data.status === 'completed' || data.status === 'failed') {
          stopPolling()
        }
      } catch {
        // Keep polling on transient errors
      }
    }

    poll()
    intervalRef.current = setInterval(poll, 2000)

    return () => {
      stopPolling()
    }
  }, [taskId, stopPolling])

  return { task, isPolling }
}
