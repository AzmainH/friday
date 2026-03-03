import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Table from '@mui/material/Table'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import Chip from '@mui/material/Chip'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Box from '@mui/material/Box'
import Skeleton from '@mui/material/Skeleton'
import client from '@/api/client'
import type { Issue } from '@/types/api'
import { useAuthStore } from '@/stores/authStore'
import { formatDate, PRIORITY_COLORS } from '@/utils/formatters'

interface IssuesResponse {
  data: Issue[]
}

export default function MyIssuesWidget() {
  const [tab, setTab] = useState(0)
  const userId = useAuthStore((s) => s.currentUserId)

  const paramKey = tab === 0 ? 'assignee_id' : 'reporter_id'

  const { data, isLoading } = useQuery<IssuesResponse>({
    queryKey: ['my-issues', paramKey, userId],
    queryFn: async () => {
      const { data } = await client.get('/issues', {
        params: { [paramKey]: userId, limit: 10 },
      })
      return data
    },
    enabled: !!userId,
  })

  const issues = data?.data ?? []

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
        <Box sx={{ px: 2, pt: 2, pb: 0 }}>
          <Typography variant="h6" gutterBottom>
            My Issues
          </Typography>
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            sx={{ minHeight: 36, mb: 1 }}
          >
            <Tab label="Assigned to me" sx={{ minHeight: 36, py: 0 }} />
            <Tab label="Reported by me" sx={{ minHeight: 36, py: 0 }} />
          </Tabs>
        </Box>

        {isLoading ? (
          <Box sx={{ p: 2 }}>
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} variant="text" height={32} sx={{ mb: 0.5 }} />
            ))}
          </Box>
        ) : issues.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No issues found
            </Typography>
          </Box>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Key</TableCell>
                <TableCell>Summary</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Due Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {issues.map((issue) => (
                <TableRow key={issue.id} hover sx={{ cursor: 'pointer' }}>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500} color="primary">
                      {issue.issue_key}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" noWrap sx={{ maxWidth: 250 }}>
                      {issue.summary}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={issue.status?.name ?? 'Unknown'}
                      size="small"
                      sx={{
                        bgcolor: issue.status?.color ?? '#9e9e9e',
                        color: '#fff',
                        fontWeight: 500,
                        fontSize: '0.75rem',
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={issue.priority}
                      size="small"
                      variant="outlined"
                      sx={{
                        borderColor: PRIORITY_COLORS[issue.priority] ?? '#9e9e9e',
                        color: PRIORITY_COLORS[issue.priority] ?? '#9e9e9e',
                        fontWeight: 500,
                        fontSize: '0.75rem',
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(issue.due_date)}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
