import { useQuery } from '@tanstack/react-query'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Avatar from '@mui/material/Avatar'
import Skeleton from '@mui/material/Skeleton'
import EditIcon from '@mui/icons-material/Edit'
import SwapHorizIcon from '@mui/icons-material/SwapHoriz'
import PersonIcon from '@mui/icons-material/Person'
import LabelIcon from '@mui/icons-material/Label'
import PriorityHighIcon from '@mui/icons-material/PriorityHigh'
import EventIcon from '@mui/icons-material/Event'
import AddIcon from '@mui/icons-material/Add'
import client from '@/api/client'
import { formatRelativeTime } from '@/utils/formatters'

interface ActivityEntry {
  id: string
  user_id: string
  field: string
  old_value: string | null
  new_value: string | null
  created_at: string
  user?: {
    id: string
    display_name: string
    avatar_url: string | null
  }
}

interface ActivityLogProps {
  issueId: string
}

const FIELD_ICONS: Record<string, React.ReactNode> = {
  status: <SwapHorizIcon fontSize="small" />,
  assignee: <PersonIcon fontSize="small" />,
  priority: <PriorityHighIcon fontSize="small" />,
  labels: <LabelIcon fontSize="small" />,
  due_date: <EventIcon fontSize="small" />,
  summary: <EditIcon fontSize="small" />,
  description: <EditIcon fontSize="small" />,
}

function getFieldIcon(field: string): React.ReactNode {
  return FIELD_ICONS[field] ?? <EditIcon fontSize="small" />
}

function formatFieldChange(entry: ActivityEntry): string {
  const { field, old_value, new_value } = entry

  if (!old_value && new_value) {
    return `set ${field.replace(/_/g, ' ')} to "${new_value}"`
  }
  if (old_value && !new_value) {
    return `removed ${field.replace(/_/g, ' ')}`
  }
  return `changed ${field.replace(/_/g, ' ')} from "${old_value}" to "${new_value}"`
}

export default function ActivityLog({ issueId }: ActivityLogProps) {
  const { data, isLoading } = useQuery<ActivityEntry[]>({
    queryKey: ['issueActivity', issueId],
    queryFn: async () => {
      const { data: response } = await client.get(`/issues/${issueId}/activity`)
      return response.data ?? response
    },
    enabled: !!issueId,
  })

  const activities = data ?? []

  if (isLoading) {
    return (
      <Box sx={{ py: 1 }}>
        {Array.from({ length: 4 }, (_, i) => (
          <Box key={i} sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
            <Skeleton variant="circular" width={28} height={28} />
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width="70%" height={18} />
              <Skeleton variant="text" width="30%" height={14} />
            </Box>
          </Box>
        ))}
      </Box>
    )
  }

  if (activities.length === 0) {
    return (
      <Box sx={{ py: 2 }}>
        <Typography variant="body2" color="text.secondary">
          No activity recorded yet.
        </Typography>
      </Box>
    )
  }

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
        Activity
      </Typography>

      <Box sx={{ position: 'relative' }}>
        {/* Vertical timeline line */}
        <Box
          sx={{
            position: 'absolute',
            left: 13,
            top: 4,
            bottom: 4,
            width: 2,
            bgcolor: 'divider',
            borderRadius: 1,
          }}
        />

        {activities.map((entry) => (
          <Box
            key={entry.id}
            sx={{
              display: 'flex',
              gap: 1.5,
              mb: 2,
              position: 'relative',
            }}
          >
            <Avatar
              src={entry.user?.avatar_url ?? undefined}
              sx={{
                width: 28,
                height: 28,
                bgcolor: 'action.selected',
                color: 'text.secondary',
                zIndex: 1,
              }}
            >
              {getFieldIcon(entry.field)}
            </Avatar>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" sx={{ lineHeight: 1.5 }}>
                <Typography
                  component="span"
                  variant="body2"
                  fontWeight={600}
                >
                  {entry.user?.display_name ?? 'Someone'}
                </Typography>{' '}
                {formatFieldChange(entry)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatRelativeTime(entry.created_at)}
              </Typography>
            </Box>
          </Box>
        ))}

        {/* Created entry */}
        <Box sx={{ display: 'flex', gap: 1.5, position: 'relative' }}>
          <Avatar
            sx={{
              width: 28,
              height: 28,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              zIndex: 1,
            }}
          >
            <AddIcon sx={{ fontSize: 16 }} />
          </Avatar>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
            Issue created
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}
