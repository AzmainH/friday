import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import { useTheme } from '@mui/material/styles'
import type { Issue } from '@/types/api'
import { PRIORITY_COLORS, truncate } from '@/utils/formatters'

export interface BoardCardProps {
  issue: Issue
  isDragging?: boolean
}

export default function BoardCard({ issue, isDragging = false }: BoardCardProps) {
  const theme = useTheme()
  const priorityColor = PRIORITY_COLORS[issue.priority] ?? PRIORITY_COLORS.none

  return (
    <Card
      sx={{
        cursor: 'grab',
        opacity: isDragging ? 0.5 : 1,
        border: '1px solid',
        borderColor: isDragging ? 'primary.main' : 'divider',
        borderRadius: 1.5,
        boxShadow: isDragging ? theme.shadows[4] : theme.shadows[1],
        transition: 'box-shadow 0.2s, border-color 0.2s',
        '&:hover': {
          boxShadow: theme.shadows[3],
          borderColor: 'primary.light',
        },
      }}
    >
      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
        {/* Top row: issue key chip */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.75 }}>
          <Chip
            label={issue.issue_key}
            size="small"
            sx={{
              height: 20,
              fontSize: '0.7rem',
              fontWeight: 600,
              bgcolor: 'action.hover',
              color: 'text.secondary',
            }}
          />
        </Box>

        {/* Summary */}
        <Typography
          variant="body2"
          sx={{
            fontWeight: 500,
            lineHeight: 1.4,
            mb: 1,
            color: 'text.primary',
            wordBreak: 'break-word',
          }}
        >
          {truncate(issue.summary, 80)}
        </Typography>

        {/* Bottom row: priority dot + assignee avatar */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Priority indicator */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: priorityColor,
                flexShrink: 0,
              }}
            />
            <Typography
              variant="caption"
              sx={{ color: 'text.secondary', textTransform: 'capitalize' }}
            >
              {issue.priority}
            </Typography>
          </Box>

          {/* Assignee avatar */}
          {issue.assignee ? (
            <Avatar
              src={issue.assignee.avatar_url ?? undefined}
              alt={issue.assignee.display_name}
              sx={{ width: 24, height: 24, fontSize: '0.7rem' }}
            >
              {issue.assignee.display_name.charAt(0).toUpperCase()}
            </Avatar>
          ) : (
            <Avatar
              sx={{
                width: 24,
                height: 24,
                fontSize: '0.7rem',
                bgcolor: 'action.disabledBackground',
                color: 'text.disabled',
              }}
            >
              ?
            </Avatar>
          )}
        </Box>
      </CardContent>
    </Card>
  )
}
