import { useQuery } from '@tanstack/react-query'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import Chip from '@mui/material/Chip'
import Skeleton from '@mui/material/Skeleton'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import client from '@/api/client'
import type { Issue } from '@/types/api'
import { useAuthStore } from '@/stores/authStore'

interface IssuesResponse {
  data: Issue[]
}

function getDaysOverdue(dueDateStr: string): number {
  const due = new Date(dueDateStr)
  const now = new Date()
  const diff = now.getTime() - due.getTime()
  return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

export default function OverdueWidget() {
  const userId = useAuthStore((s) => s.currentUserId)

  const { data, isLoading } = useQuery<IssuesResponse>({
    queryKey: ['overdue-issues', userId],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0]
      const { data } = await client.get('/issues', {
        params: {
          assignee_id: userId,
          due_date_before: today,
          status_category: 'todo,in_progress',
          limit: 20,
        },
      })
      return data
    },
    enabled: !!userId,
  })

  const overdueIssues = (data?.data ?? []).filter(
    (issue) => issue.due_date && new Date(issue.due_date) < new Date(),
  )

  return (
    <Card
      sx={{
        height: '100%',
        borderLeft: '4px solid',
        borderColor: 'error.main',
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <WarningAmberIcon color="error" />
          <Typography variant="h6">Overdue</Typography>
        </Box>

        {isLoading ? (
          <Box>
            <Skeleton variant="rectangular" height={64} sx={{ borderRadius: 1, mb: 1 }} />
            <Skeleton variant="text" height={24} />
            <Skeleton variant="text" height={24} />
          </Box>
        ) : overdueIssues.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="h3" color="success.main" fontWeight={700}>
              0
            </Typography>
            <Typography variant="body2" color="text.secondary">
              No overdue issues
            </Typography>
          </Box>
        ) : (
          <>
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <Typography variant="h3" color="error.main" fontWeight={700}>
                {overdueIssues.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                overdue {overdueIssues.length === 1 ? 'issue' : 'issues'}
              </Typography>
            </Box>

            <List dense disablePadding>
              {overdueIssues.slice(0, 5).map((issue) => {
                const days = getDaysOverdue(issue.due_date!)
                return (
                  <ListItem key={issue.id} disableGutters sx={{ py: 0.5 }}>
                    <ListItemText
                      primary={
                        <Typography variant="body2" noWrap>
                          <Typography
                            component="span"
                            variant="body2"
                            fontWeight={600}
                            color="primary"
                          >
                            {issue.issue_key}
                          </Typography>
                          {' '}
                          {issue.summary}
                        </Typography>
                      }
                    />
                    <Chip
                      label={`${days}d`}
                      size="small"
                      color="error"
                      variant="outlined"
                      sx={{ ml: 1, fontWeight: 600, minWidth: 40 }}
                    />
                  </ListItem>
                )
              })}
            </List>

            {overdueIssues.length > 5 && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                +{overdueIssues.length - 5} more
              </Typography>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
