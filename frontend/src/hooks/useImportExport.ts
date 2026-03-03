import { useState, useEffect, useCallback, useRef } from 'react'
import { useMutation } from '@tanstack/react-query'
import client from '@/api/client'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ColumnPreview {
  csv_columns: string[]
  sample_rows: Record<string, string>[]
  total_rows: number
}

export interface ColumnMapping {
  [csvColumn: string]: string // csv column name -> issue field name
}

export interface ImportStartInput {
  project_id: string
  file_id: string
  mapping: ColumnMapping
}

export interface ExportStartInput {
  project_id: string
  format: 'csv' | 'json'
  filters?: Record<string, unknown>
}

export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed'

export interface ImportExportTask {
  task_id: string
  status: TaskStatus
  progress: number // 0-100
  total_rows: number | null
  processed_rows: number | null
  errors: string[]
  download_url: string | null
  created_at: string
  completed_at: string | null
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/** Upload a CSV file and get a column preview */
export function useImportPreview() {
  return useMutation<ColumnPreview, Error, { projectId: string; file: File }>({
    mutationFn: async ({ projectId, file }) => {
      const formData = new FormData()
      formData.append('file', file)
      const { data } = await client.post(
        `/projects/${projectId}/import/preview`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      )
      return data
    },
  })
}

/** Start the actual import with column mapping */
export function useStartImport() {
  return useMutation<{ task_id: string }, Error, ImportStartInput>({
    mutationFn: async (body) => {
      const { data } = await client.post(
        `/projects/${body.project_id}/import/start`,
        { file_id: body.file_id, mapping: body.mapping },
      )
      return data
    },
  })
}

/** Start an export */
export function useStartExport() {
  return useMutation<{ task_id: string }, Error, ExportStartInput>({
    mutationFn: async (body) => {
      const { data } = await client.post(
        `/projects/${body.project_id}/export/start`,
        { format: body.format, filters: body.filters },
      )
      return data
    },
  })
}

// ---------------------------------------------------------------------------
// Polling hook for import/export task progress
// ---------------------------------------------------------------------------

export function useTaskProgress(taskId: string | null) {
  const [task, setTask] = useState<ImportExportTask | null>(null)
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
        const { data } = await client.get<ImportExportTask>(`/tasks/${taskId}`)
        setTask(data)

        if (data.status === 'completed' || data.status === 'failed') {
          stopPolling()
        }
      } catch {
        // Keep polling on transient errors
      }
    }

    // Initial fetch
    poll()

    // Poll every 2 seconds
    intervalRef.current = setInterval(poll, 2000)

    return () => {
      stopPolling()
    }
  }, [taskId, stopPolling])

  return { task, isPolling }
}
