import { useNavigate } from 'react-router-dom'
import { Bug, MessageSquare, ClipboardList, Info } from 'lucide-react'
import { cn } from '@/lib/cn'
import type { Notification } from '@/types/api'
import { formatRelativeTime } from '@/utils/formatters'

const TYPE_ICONS: Record<string, React.ReactNode> = {
  issue_assigned: <ClipboardList className="h-4 w-4 text-primary-500" />,
  issue_updated: <Bug className="h-4 w-4 text-text-secondary" />,
  comment_added: <MessageSquare className="h-4 w-4 text-text-secondary" />,
  mentioned: <MessageSquare className="h-4 w-4 text-purple-500" />,
}

function getNotificationUrl(notification: Notification): string | null {
  if (!notification.entity_type || !notification.entity_id) return null
  switch (notification.entity_type) {
    case 'issue':
      return `/issues/${notification.entity_id}`
    case 'project':
      return `/projects/${notification.entity_id}`
    case 'comment':
      return `/comments/${notification.entity_id}`
    case 'wiki_page':
      return `/wiki/${notification.entity_id}`
    default:
      return null
  }
}

interface NotificationItemProps {
  notification: Notification
  onMarkRead: (id: string) => void
}

export default function NotificationItem({ notification, onMarkRead }: NotificationItemProps) {
  const navigate = useNavigate()

  const handleClick = () => {
    if (!notification.is_read) {
      onMarkRead(notification.id)
    }
    const url = getNotificationUrl(notification)
    if (url) {
      navigate(url)
    }
  }

  const icon = TYPE_ICONS[notification.type] ?? <Info className="h-4 w-4 text-text-secondary" />

  return (
    <button
      onClick={handleClick}
      className={cn(
        'w-full text-left px-4 py-3 hover:bg-surface-100 dark:hover:bg-dark-border transition-colors flex items-start gap-3',
        !notification.is_read && 'bg-primary-50/30 dark:bg-primary-900/10',
      )}
    >
      <span className="flex-shrink-0 mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-sm truncate text-text-primary',
            notification.is_read ? 'font-normal' : 'font-semibold',
          )}
        >
          {notification.title}
        </p>
        {notification.body && (
          <span className="block text-xs text-text-secondary truncate">
            {notification.body}
          </span>
        )}
        <span className="text-xs text-text-disabled">
          {formatRelativeTime(notification.created_at)}
        </span>
      </div>
    </button>
  )
}
