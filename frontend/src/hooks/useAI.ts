import { useState, useEffect, useCallback, useRef } from 'react'
import { useMutation } from '@tanstack/react-query'
import client from '@/api/client'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AITaskType = 'smart_schedule' | 'risk_prediction' | 'project_summary'

export interface TriggerAIInput {
  project_id: string
  task_type: AITaskType
  params?: Record<string, unknown>
}

export interface AITaskResponse {
  task_id: string
}

export type AITaskStatus = 'pending' | 'running' | 'completed' | 'failed'

export interface AITaskResult {
  task_id: string
  status: AITaskStatus
  task_type: AITaskType
  result: Record<string, unknown> | null
  error: string | null
  created_at: string
  completed_at: string | null
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/** Trigger an AI task — returns a task_id for polling */
export function useTriggerAI() {
  return useMutation<AITaskResponse, Error, TriggerAIInput>({
    mutationFn: async (body) => {
      const { data } = await client.post('/ai/tasks', body)
      return data
    },
  })
}

// ---------------------------------------------------------------------------
// Polling hook
// ---------------------------------------------------------------------------

/** Poll GET /ai/tasks/{id} every 2s until the task reaches a terminal state */
export function useAITaskStatus(taskId: string | null) {
  const [status, setStatus] = useState<AITaskStatus | null>(null)
  const [result, setResult] = useState<AITaskResult | null>(null)
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
    setStatus('pending')
    setResult(null)

    const poll = async () => {
      try {
        const { data } = await client.get<AITaskResult>(`/ai/tasks/${taskId}`)
        setStatus(data.status)
        setResult(data)

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

  return { status, result, isPolling }
}
