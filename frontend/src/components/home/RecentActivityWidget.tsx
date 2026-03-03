import { useQuery } from '@tanstack/react-query'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemAvatar from '@mui/material/ListItemAvatar'
import ListItemText from '@mui/material/ListItemText'
import Avatar from '@mui/material/Avatar'
import Skeleton from '@mui/material/Skeleton'
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
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Recent Activity
        </Typography>

        {isLoading ? (
          <Box>
            {Array.from({ length: 4 }, (_, i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <Skeleton variant="circular" width={36} height={36} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton variant="text" width="80%" height={20} />
                  <Skeleton variant="text" width="40%" height={16} />
                </Box>
              </Box>
            ))}
          </Box>
        ) : items.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Typography variant="body2" color="text.secondary">
              No recent activity
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {items.slice(0, 8).map((item) => (
              <ListItem key={item.id} disableGutters sx={{ py: 0.75, alignItems: 'flex-start' }}>
                <ListItemAvatar sx={{ minWidth: 44 }}>
                  <Avatar
                    src={item.user_avatar_url ?? undefined}
                    sx={{ width: 32, height: 32, fontSize: '0.75rem' }}
                  >
                    {getInitials(item.user_name)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography variant="body2">
                      <Typography component="span" variant="body2" fontWeight={600}>
                        {item.user_name}
                      </Typography>
                      {' '}
                      {item.action}
                      {' '}
                      <Typography component="span" variant="body2" color="primary" fontWeight={500}>
                        {item.entity_key || item.entity_title}
                      </Typography>
                    </Typography>
                  }
                  secondary={
                    <Typography variant="caption" color="text.disabled">
                      {formatRelativeTime(item.created_at)}
                    </Typography>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  )
}
