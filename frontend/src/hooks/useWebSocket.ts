import { useEffect, useRef, useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/authStore'

interface WsMessage {
  type: string
  payload: Record<string, unknown>
  project_id?: string
  user_id?: string
}

interface UseWebSocketReturn {
  isConnected: boolean
  lastMessage: WsMessage | null
  subscribe: (projectId: string) => void
  unsubscribe: (projectId: string) => void
}

const WS_BASE_URL =
  import.meta.env.VITE_WS_URL ?? `ws://${window.location.hostname}:8000`

const MAX_BACKOFF_MS = 30_000
const INITIAL_BACKOFF_MS = 1_000

/**
 * Manages a WebSocket connection for real-time updates.
 *
 * Automatically connects when a userId is available from the auth store,
 * reconnects with exponential backoff on disconnect, and invalidates
 * TanStack Query caches when server-side events arrive.
 */
export function useWebSocket(): UseWebSocketReturn {
  const queryClient = useQueryClient()
  const currentUserId = useAuthStore((s) => s.currentUserId)
  const wsRef = useRef<WebSocket | null>(null)
  const backoffRef = useRef(INITIAL_BACKOFF_MS)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>()
  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<WsMessage | null>(null)

  const invalidateForEvent = useCallback(
    (msg: WsMessage) => {
      const { type, payload, project_id } = msg
      const projectId = project_id ?? (payload?.project_id as string | undefined)
      const issueId = payload?.issue_id as string | undefined

      switch (type) {
        case 'issue_created':
        case 'issue_updated':
        case 'issue_deleted':
          if (projectId) {
            queryClient.invalidateQueries({ queryKey: ['issues', projectId] })
            queryClient.invalidateQueries({ queryKey: ['dashboard', projectId] })
          }
          if (issueId) {
            queryClient.invalidateQueries({ queryKey: ['issues', issueId] })
          }
          break

        case 'notification_created':
          queryClient.invalidateQueries({ queryKey: ['notifications'] })
          break

        case 'sprint_updated':
          if (projectId) {
            queryClient.invalidateQueries({ queryKey: ['sprints', projectId] })
          }
          break

        case 'comment_added':
          if (issueId) {
            queryClient.invalidateQueries({ queryKey: ['comments', issueId] })
          }
          break

        case 'workflow_changed':
          if (projectId) {
            queryClient.invalidateQueries({ queryKey: ['workflows', projectId] })
          }
          break

        default:
          // Unknown event type — no cache invalidation
          break
      }
    },
    [queryClient],
  )

  const connect = useCallback(() => {
    if (!currentUserId) return

    // Clean up any existing connection
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }

    const url = `${WS_BASE_URL}/ws?user_id=${currentUserId}`
    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onopen = () => {
      setIsConnected(true)
      backoffRef.current = INITIAL_BACKOFF_MS
    }

    ws.onmessage = (event) => {
      try {
        const msg: WsMessage = JSON.parse(event.data)
        setLastMessage(msg)
        invalidateForEvent(msg)
      } catch {
        // Ignore unparseable messages
      }
    }

    ws.onclose = () => {
      setIsConnected(false)
      wsRef.current = null

      // Schedule reconnect with exponential backoff
      const delay = backoffRef.current
      backoffRef.current = Math.min(delay * 2, MAX_BACKOFF_MS)
      reconnectTimer.current = setTimeout(connect, delay)
    }

    ws.onerror = () => {
      // onclose will fire after onerror — reconnect is handled there
    }
  }, [currentUserId, invalidateForEvent])

  useEffect(() => {
    connect()
    return () => {
      clearTimeout(reconnectTimer.current)
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [connect])

  const subscribe = useCallback((projectId: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: 'subscribe', project_id: projectId }))
    }
  }, [])

  const unsubscribe = useCallback((projectId: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: 'unsubscribe', project_id: projectId }))
    }
  }, [])

  return { isConnected, lastMessage, subscribe, unsubscribe }
}
