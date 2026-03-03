import { useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import CircularProgress from '@mui/material/CircularProgress'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useQuery } from '@tanstack/react-query'
import client from '@/api/client'
import { formatNumber } from '@/utils/formatters'

type GroupBy = 'user' | 'issue' | 'date'

interface TimeReportEntry {
  label: string
  hours: number
  billable_hours: number
}

interface TimeReportsProps {
  projectId: string
}

export default function TimeReports({ projectId }: TimeReportsProps) {
  const [groupBy, setGroupBy] = useState<GroupBy>('user')

  const { data: entries, isLoading } = useQuery({
    queryKey: ['projects', projectId, 'time-reports', groupBy],
    queryFn: async () => {
      const res = await client.get<{ items: TimeReportEntry[] }>(
        `/projects/${projectId}/time-entries/report`,
        { params: { group_by: groupBy } },
      )
      return res.data.items ?? []
    },
    enabled: !!projectId,
  })

  const totalHours = (entries ?? []).reduce((s, e) => s + e.hours, 0)
  const totalBillable = (entries ?? []).reduce((s, e) => s + e.billable_hours, 0)

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" fontWeight={600}>
          Time Reports
        </Typography>
        <ToggleButtonGroup
          value={groupBy}
          exclusive
          onChange={(_, v) => v && setGroupBy(v)}
          size="small"
        >
          <ToggleButton value="user">By User</ToggleButton>
          <ToggleButton value="issue">By Issue</ToggleButton>
          <ToggleButton value="date">By Date</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={entries ?? []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="hours" fill="#2196f3" name="Total Hours" />
                <Bar dataKey="billable_hours" fill="#4caf50" name="Billable Hours" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>

          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{groupBy === 'user' ? 'User' : groupBy === 'issue' ? 'Issue' : 'Date'}</TableCell>
                  <TableCell align="right">Hours</TableCell>
                  <TableCell align="right">Billable</TableCell>
                  <TableCell align="right">% of Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(entries ?? []).map((entry) => (
                  <TableRow key={entry.label} hover>
                    <TableCell>{entry.label}</TableCell>
                    <TableCell align="right">{formatNumber(entry.hours)}h</TableCell>
                    <TableCell align="right">{formatNumber(entry.billable_hours)}h</TableCell>
                    <TableCell align="right">
                      {totalHours > 0 ? formatNumber((entry.hours / totalHours) * 100) : 0}%
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow sx={{ '& td': { fontWeight: 600 } }}>
                  <TableCell>Total</TableCell>
                  <TableCell align="right">{formatNumber(totalHours)}h</TableCell>
                  <TableCell align="right">{formatNumber(totalBillable)}h</TableCell>
                  <TableCell align="right">100%</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Box>
  )
}
