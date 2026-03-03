import { useNavigate } from 'react-router-dom'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Typography from '@mui/material/Typography'
import BugReportIcon from '@mui/icons-material/BugReport'
import CommentIcon from '@mui/icons-material/Comment'
import AssignmentIcon from '@mui/icons-material/Assignment'
import InfoIcon from '@mui/icons-material/Info'
import type { Notification } from '@/types/api'
import { formatRelativeTime } from '@/utils/formatters'

const TYPE_ICONS: Record<string, React.ReactNode> = {
  issue_assigned: <AssignmentIcon fontSize="small" color="primary" />,
  issue_updated: <BugReportIcon fontSize="small" color="action" />,
  comment_added: <CommentIcon fontSize="small" color="action" />,
  mentioned: <CommentIcon fontSize="small" color="secondary" />,
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

  const icon = TYPE_ICONS[notification.type] ?? <InfoIcon fontSize="small" color="action" />

  return (
    <ListItemButton
      onClick={handleClick}
      sx={{
        py: 1.5,
        px: 2,
        bgcolor: notification.is_read ? 'transparent' : 'action.hover',
        '&:hover': { bgcolor: 'action.selected' },
      }}
    >
      <ListItemIcon sx={{ minWidth: 36 }}>{icon}</ListItemIcon>
      <ListItemText
        primary={
          <Typography
            variant="body2"
            sx={{ fontWeight: notification.is_read ? 400 : 600 }}
            noWrap
          >
            {notification.title}
          </Typography>
        }
        secondary={
          <>
            {notification.body && (
              <Typography
                variant="caption"
                color="text.secondary"
                component="span"
                sx={{
                  display: 'block',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {notification.body}
              </Typography>
            )}
            <Typography variant="caption" color="text.disabled" component="span">
              {formatRelativeTime(notification.created_at)}
            </Typography>
          </>
        }
        secondaryTypographyProps={{ component: 'div' }}
      />
    </ListItemButton>
  )
}
