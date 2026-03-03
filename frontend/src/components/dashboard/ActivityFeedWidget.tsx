import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Avatar from '@mui/material/Avatar'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemAvatar from '@mui/material/ListItemAvatar'
import ListItemText from '@mui/material/ListItemText'
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
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <Typography variant="body2" color="text.secondary">
          No recent activity
        </Typography>
      </Box>
    )
  }

  // Show up to the last 10 items
  const items = activities.slice(0, 10)

  return (
    <List dense disablePadding sx={{ width: '100%', overflow: 'auto', maxHeight: '100%' }}>
      {items.map((activity) => (
        <ListItem
          key={activity.id}
          disableGutters
          sx={{
            py: 0.5,
            px: 0,
            alignItems: 'flex-start',
            borderBottom: '1px solid',
            borderColor: 'divider',
            '&:last-child': { borderBottom: 'none' },
          }}
        >
          <ListItemAvatar sx={{ minWidth: 36 }}>
            <Avatar
              src={activity.user_avatar ?? undefined}
              alt={activity.user_name}
              sx={{ width: 28, height: 28, fontSize: '0.75rem' }}
            >
              {activity.user_name.charAt(0).toUpperCase()}
            </Avatar>
          </ListItemAvatar>
          <ListItemText
            primary={
              <Typography variant="body2" sx={{ fontSize: '0.8rem', lineHeight: 1.3 }}>
                <Typography
                  component="span"
                  variant="body2"
                  sx={{ fontWeight: 600, fontSize: '0.8rem' }}
                >
                  {activity.user_name}
                </Typography>{' '}
                {activity.action}
              </Typography>
            }
            secondary={
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                {formatRelativeTime(activity.created_at)}
              </Typography>
            }
            sx={{ m: 0 }}
          />
        </ListItem>
      ))}
    </List>
  )
}
