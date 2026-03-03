import { useQuery } from '@tanstack/react-query'
import client from '@/api/client'
import { formatRelativeTime } from '@/utils/formatters'

interface RecentItem {
  id: string
  user_name: string
  user_avatar_url: string | null
  action: string
  entity_type: string
  entity_key: string
  entity_title: string
  created_at: string
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export default function RecentActivityWidget() {
  const { data, isLoading } = useQuery<RecentItem[]>({
    queryKey: ['recent-items'],
    queryFn: async () => {
      const { data: res } = await client.get('/recent-items')
      const items = res?.data ?? res
      return Array.isArray(items) ? items : []
    },
  })

  const items = data ?? []

  return (
    <div className="h-full bg-white dark:bg-surface-100 rounded-[--radius-lg] shadow-sm border border-surface-200 p-5">
      <h2 className="text-lg font-semibold text-text-primary mb-3">
        Recent Activity
      </h2>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full skeleton-shimmer shrink-0" />
              <div className="flex-1 space-y-1">
                <div className="h-4 w-4/5 skeleton-shimmer rounded-[--radius-xs]" />
                <div className="h-3 w-2/5 skeleton-shimmer rounded-[--radius-xs]" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-sm text-text-secondary">No recent activity</p>
        </div>
      ) : (
        <div className="space-y-0.5">
          {items.slice(0, 8).map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-3 py-2"
            >
              {/* Avatar */}
              {item.user_avatar_url ? (
                <img
                  src={item.user_avatar_url}
                  alt={item.user_name}
                  className="w-8 h-8 rounded-full object-cover shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-medium shrink-0">
                  {getInitials(item.user_name)}
                </div>
              )}

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-text-primary">
                  <span className="font-semibold">{item.user_name}</span>
                  {' '}
                  {item.action}
                  {' '}
                  <span className="font-medium text-primary-600">
                    {item.entity_key || item.entity_title}
                  </span>
                </p>
                <p className="text-xs text-text-tertiary mt-0.5">
                  {formatRelativeTime(item.created_at)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
