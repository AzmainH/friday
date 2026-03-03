import { formatRelativeTime } from '@/utils/formatters'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ActivityItem {
  id: string
  user_name: string
  user_avatar: string | null
  action: string
  created_at: string
}

export interface ActivityFeedWidgetProps {
  activities: ActivityItem[]
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ActivityFeedWidget({ activities }: ActivityFeedWidgetProps) {
  if (activities.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-text-secondary">No recent activity</p>
      </div>
    )
  }

  // Show up to the last 10 items
  const items = activities.slice(0, 10)

  return (
    <div className="w-full overflow-auto max-h-full space-y-0">
      {items.map((activity) => (
        <div
          key={activity.id}
          className="flex items-start gap-2 py-1.5 border-b border-surface-200 last:border-b-0"
        >
          {/* Avatar */}
          {activity.user_avatar ? (
            <img
              src={activity.user_avatar}
              alt={activity.user_name}
              className="w-7 h-7 rounded-full object-cover shrink-0"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-medium shrink-0">
              {activity.user_name.charAt(0).toUpperCase()}
            </div>
          )}

          {/* Text */}
          <div className="min-w-0">
            <p className="text-[0.8rem] leading-snug">
              <span className="font-semibold">{activity.user_name}</span>{' '}
              {activity.action}
            </p>
            <span className="text-[0.7rem] text-text-tertiary">
              {formatRelativeTime(activity.created_at)}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
