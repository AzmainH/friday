import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from '@/api/client'
import type { Notification } from '@/types/api'

const NOTIFICATIONS_KEY = ['notifications', 'unread']

export function useNotifications() {
  const query = useQuery<Notification[]>({
    queryKey: NOTIFICATIONS_KEY,
    queryFn: async () => {
      const { data } = await client.get('/notifications/me', {
        params: { is_read: false },
      })
      return data
    },
    refetchInterval: 30_000,
  })

  const unreadCount = query.data?.length ?? 0

  return { ...query, unreadCount }
}

export function useMarkRead() {
  const qc = useQueryClient()

  return useMutation<Notification, Error, string>({
    mutationFn: async (id: string) => {
      const { data } = await client.patch(`/notifications/${id}/read`)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: NOTIFICATIONS_KEY })
    },
  })
}

export function useMarkAllRead() {
  const qc = useQueryClient()

  return useMutation<void, Error, void>({
    mutationFn: async () => {
      await client.post('/notifications/mark-all-read')
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: NOTIFICATIONS_KEY })
    },
  })
}
