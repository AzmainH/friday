import { useState, useMemo, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TableSortLabel from '@mui/material/TableSortLabel'
import Paper from '@mui/material/Paper'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import BudgetSummaryCards from '@/components/budget/BudgetSummaryCards'
import BurnChart from '@/components/budget/BurnChart'
import CostEntryForm from '@/components/budget/CostEntryForm'
import {
  useBudget,
  useBudgetSummary,
  useCostEntries,
  useUpdateBudget,
} from '@/hooks/useBudget'
import type { CostEntry } from '@/hooks/useBudget'
import { formatCurrency, formatDate } from '@/utils/formatters'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type SortField = 'date' | 'category' | 'amount'
type SortDir = 'asc' | 'desc'

function compareCosts(a: CostEntry, b: CostEntry, field: SortField, dir: SortDir): number {
  let cmp = 0
  switch (field) {
    case 'date':
      cmp = a.date.localeCompare(b.date)
      break
    case 'category':
      cmp = a.category.localeCompare(b.category)
      break
    case 'amount':
      cmp = a.amount - b.amount
      break
  }
  return dir === 'asc' ? cmp : -cmp
}

function buildMonthlyBurn(entries: CostEntry[]): { month: string; amount: number }[] {
  const map = new Map<string, number>()
  for (const e of entries) {
    const d = new Date(e.date)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    map.set(key, (map.get(key) ?? 0) + e.amount)
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, amount]) => ({ month, amount }))
}

// ---------------------------------------------------------------------------
// Edit Budget Dialog
// ---------------------------------------------------------------------------

interface EditBudgetDialogProps {
  open: boolean
  onClose: () => void
  budgetId: string
  currentBudget: number
}

function EditBudgetDialog({ open, onClose, budgetId, currentBudget }: EditBudgetDialogProps) {
  const [value, setValue] = useState(String(currentBudget))
  const updateBudget = useUpdateBudget()

  const handleSave = useCallback(async () => {
    const num = parseFloat(value)
    if (isNaN(num) || num <= 0) return
    await updateBudget.mutateAsync({ id: budgetId, body: { total_budget: num } })
    onClose()
  }, [value, budgetId, updateBudget, onClose])

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Edit Budget</DialogTitle>
      <DialogContent>
        <TextField
          label="Total Budget"
          type="number"
          fullWidth
          value={value}
          onChange={(e) => setValue(e.target.value)}
          inputProps={{ min: 0, step: '0.01' }}
          sx={{ mt: 1 }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit">Cancel</Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={updateBudget.isPending}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function BudgetPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const pid = projectId ?? ''

  const { data: budget, isLoading: budgetLoading } = useBudget(pid)
  const { data: summary, isLoading: summaryLoading } = useBudgetSummary(pid)
  const { data: costs, isLoading: costsLoading, error: costsError } = useCostEntries(pid)

  const [costDialogOpen, setCostDialogOpen] = useState(false)
  const [editBudgetOpen, setEditBudgetOpen] = useState(false)
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  const handleSort = useCallback(
    (field: SortField) => {
      if (field === sortField) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
      } else {
        setSortField(field)
        setSortDir('asc')
      }
    },
    [sortField],
  )

  const filteredCosts = useMemo(() => {
    if (!costs) return []
    let list = [...costs]
    if (categoryFilter !== 'all') {
      list = list.filter((c) => c.category === categoryFilter)
    }
    list.sort((a, b) => compareCosts(a, b, sortField, sortDir))
    return list
  }, [costs, categoryFilter, sortField, sortDir])

  const categories = useMemo(() => {
    if (!costs) return []
    return Array.from(new Set(costs.map((c) => c.category))).sort()
  }, [costs])

  const monthlyBurn = useMemo(() => buildMonthlyBurn(costs ?? []), [costs])

  const isLoading = budgetLoading || summaryLoading || costsLoading

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Budget</Typography>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => setEditBudgetOpen(true)}
            disabled={!budget}
          >
            Edit Budget
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCostDialogOpen(true)}
          >
            Add Cost
          </Button>
        </Stack>
      </Stack>

      {/* Summary cards */}
      {summary && <BudgetSummaryCards summary={summary} />}

      {/* Burn chart */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Burn Chart
        </Typography>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <BurnChart
            monthlyBurn={monthlyBurn}
            totalBudget={summary?.total_budget ?? 0}
          />
        </Paper>
      </Box>

      {/* Cost entries table */}
      <Box sx={{ mt: 4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Cost Entries</Typography>
          <TextField
            select
            size="small"
            label="Category"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="all">All Categories</MenuItem>
            {categories.map((cat) => (
              <MenuItem key={cat} value={cat}>{cat}</MenuItem>
            ))}
          </TextField>
        </Stack>

        {costsError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Failed to load cost entries.
          </Alert>
        )}

        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>
                  <TableSortLabel
                    active={sortField === 'date'}
                    direction={sortField === 'date' ? sortDir : 'asc'}
                    onClick={() => handleSort('date')}
                  >
                    Date
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortField === 'category'}
                    direction={sortField === 'category' ? sortDir : 'asc'}
                    onClick={() => handleSort('category')}
                  >
                    Category
                  </TableSortLabel>
                </TableCell>
                <TableCell>Description</TableCell>
                <TableCell align="right">
                  <TableSortLabel
                    active={sortField === 'amount'}
                    direction={sortField === 'amount' ? sortDir : 'asc'}
                    onClick={() => handleSort('amount')}
                  >
                    Amount
                  </TableSortLabel>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredCosts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                      No cost entries found.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredCosts.map((entry) => (
                  <TableRow key={entry.id} hover>
                    <TableCell>{formatDate(entry.date)}</TableCell>
                    <TableCell>{entry.category}</TableCell>
                    <TableCell>{entry.description ?? '--'}</TableCell>
                    <TableCell align="right">{formatCurrency(entry.amount)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Dialogs */}
      <CostEntryForm
        open={costDialogOpen}
        onClose={() => setCostDialogOpen(false)}
        projectId={pid}
      />

      {budget && (
        <EditBudgetDialog
          open={editBudgetOpen}
          onClose={() => setEditBudgetOpen(false)}
          budgetId={budget.id}
          currentBudget={budget.total_budget}
        />
      )}
    </Container>
  )
}
