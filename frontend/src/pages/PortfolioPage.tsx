import { useState, useMemo } from 'react'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid2'
import Paper from '@mui/material/Paper'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import FilterListIcon from '@mui/icons-material/FilterList'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import ProgramBoard from '@/components/portfolio/ProgramBoard'
import { usePortfolioOverview } from '@/hooks/usePortfolio'
import { RAG_COLORS, formatCurrency } from '@/utils/formatters'

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const WORKSPACE_ID = 'default' // Placeholder until workspace context is wired

const RAG_PIE_COLORS: Record<string, string> = {
  green: RAG_COLORS.green,
  amber: RAG_COLORS.amber,
  red: RAG_COLORS.red,
  none: RAG_COLORS.none,
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function PortfolioPage() {
  const { data: overview, isLoading, error } = usePortfolioOverview(WORKSPACE_ID)

  // Filter state
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const filteredOverview = useMemo(() => {
    if (!overview) return null
    if (statusFilter === 'all') return overview
    const filtered = overview.projects.filter((p) => p.status === statusFilter)
    return { ...overview, projects: filtered }
  }, [overview, statusFilter])

  /* ---- RAG donut data ---- */
  const ragData = useMemo(() => {
    if (!overview) return []
    return Object.entries(overview.summary.by_rag)
      .filter(([, count]) => count > 0)
      .map(([rag, count]) => ({ name: rag, value: count, color: RAG_PIE_COLORS[rag] ?? '#999' }))
  }, [overview])

  /* ---- Budget bar data ---- */
  const budgetData = useMemo(() => {
    if (!overview) return []
    return overview.projects
      .filter((p) => p.budget_allocated != null && p.budget_allocated > 0)
      .map((p) => ({
        name: p.key_prefix,
        allocated: p.budget_allocated ?? 0,
        spent: p.budget_spent ?? 0,
      }))
  }, [overview])

  /* ---- Timeline bar data (progress per project) ---- */
  const timelineData = useMemo(() => {
    if (!overview) return []
    return overview.projects.map((p) => ({
      name: p.key_prefix,
      progress: p.progress_pct,
      color: RAG_COLORS[p.rag_status] ?? RAG_COLORS.none,
    }))
  }, [overview])

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error">Failed to load portfolio: {error.message}</Alert>
      </Container>
    )
  }

  if (!overview || !filteredOverview) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="info">No portfolio data available.</Alert>
      </Container>
    )
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Page header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>
          Portfolio
        </Typography>

        <TextField
          select
          size="small"
          label="Status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          sx={{ minWidth: 160 }}
          slotProps={{
            input: {
              startAdornment: <FilterListIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />,
            },
          }}
        >
          <MenuItem value="all">All</MenuItem>
          <MenuItem value="active">Active</MenuItem>
          <MenuItem value="paused">Paused</MenuItem>
          <MenuItem value="completed">Completed</MenuItem>
          <MenuItem value="archived">Archived</MenuItem>
        </TextField>
      </Box>

      {/* Summary charts */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {/* RAG distribution donut */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 2, height: 280 }}>
            <Typography variant="subtitle2" gutterBottom>
              RAG Distribution
            </Typography>
            {ragData.length > 0 ? (
              <ResponsiveContainer width="100%" height={230}>
                <PieChart>
                  <Pie
                    data={ragData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                  >
                    {ragData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Box
                sx={{
                  height: 230,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  No data
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Budget overview */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 2, height: 280 }}>
            <Typography variant="subtitle2" gutterBottom>
              Budget Overview
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Spent: {formatCurrency(overview.summary.total_budget_spent)} / Allocated:{' '}
              {formatCurrency(overview.summary.total_budget_allocated)}
            </Typography>
            {budgetData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={budgetData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" fontSize={11} />
                  <YAxis fontSize={11} />
                  <RechartsTooltip formatter={(val: number) => formatCurrency(val)} />
                  <Bar dataKey="allocated" fill="#90caf9" name="Allocated" />
                  <Bar dataKey="spent" fill="#1976d2" name="Spent" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Box
                sx={{
                  height: 200,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  No budget data
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Timeline / progress chart */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 2, height: 280 }}>
            <Typography variant="subtitle2" gutterBottom>
              Project Progress
            </Typography>
            {timelineData.length > 0 ? (
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={timelineData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} fontSize={11} />
                  <YAxis type="category" dataKey="name" width={60} fontSize={11} />
                  <RechartsTooltip formatter={(val: number) => `${Math.round(val)}%`} />
                  <Bar dataKey="progress" name="Progress">
                    {timelineData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Box
                sx={{
                  height: 230,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  No data
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Program Board */}
      <ProgramBoard overview={filteredOverview} />
    </Container>
  )
}
