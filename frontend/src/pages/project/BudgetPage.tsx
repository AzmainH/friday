import { useState, useMemo, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, Pencil, ChevronUp, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Dialog, DialogFooter } from '@/components/ui/Dialog'
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
// Sort button component
// ---------------------------------------------------------------------------

function SortButton({
  label,
  field,
  activeField,
  dir,
  onSort,
}: {
  label: string
  field: SortField
  activeField: SortField
  dir: SortDir
  onSort: (field: SortField) => void
}) {
  const isActive = field === activeField
  return (
    <button
      className="flex items-center gap-1 text-xs font-semibold text-text-secondary uppercase hover:text-text-primary transition-colors"
      onClick={() => onSort(field)}
    >
      {label}
      {isActive && (
        dir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
      )}
    </button>
  )
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

  const inputClass =
    'w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 dark:bg-dark-surface dark:border-dark-border'

  return (
    <Dialog open={open} onClose={() => onClose()} title="Edit Budget" size="sm">
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">Total Budget</label>
        <input
          type="number"
          className={inputClass}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          min={0}
          step="0.01"
        />
      </div>
      <DialogFooter className="mt-6 border-t-0 px-0">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSave}
          disabled={updateBudget.isPending}
          loading={updateBudget.isPending}
        >
          Save
        </Button>
      </DialogFooter>
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
      <div className="max-w-6xl mx-auto px-6 py-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-surface-200 border-t-primary-500 mx-auto" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Budget</h1>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            leftIcon={<Pencil className="h-4 w-4" />}
            onClick={() => setEditBudgetOpen(true)}
            disabled={!budget}
          >
            Edit Budget
          </Button>
          <Button
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setCostDialogOpen(true)}
          >
            Add Cost
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      {summary && <BudgetSummaryCards summary={summary} />}

      {/* Burn chart */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-text-primary mb-3">Burn Chart</h2>
        <div className="border border-surface-200 rounded-[--radius-md] bg-white dark:bg-dark-surface p-4">
          <BurnChart
            monthlyBurn={monthlyBurn}
            totalBudget={summary?.total_budget ?? 0}
          />
        </div>
      </div>

      {/* Cost entries table */}
      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-text-primary">Cost Entries</h2>
          <select
            className="rounded-lg border border-surface-200 bg-white px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 dark:bg-dark-surface dark:border-dark-border min-w-[160px]"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {costsError && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm mb-4">
            Failed to load cost entries.
          </div>
        )}

        <div className="border border-surface-200 rounded-[--radius-md] bg-white dark:bg-dark-surface overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-50">
              <tr>
                <th className="px-4 py-2 text-left">
                  <SortButton label="Date" field="date" activeField={sortField} dir={sortDir} onSort={handleSort} />
                </th>
                <th className="px-4 py-2 text-left">
                  <SortButton label="Category" field="category" activeField={sortField} dir={sortDir} onSort={handleSort} />
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-text-secondary uppercase">Description</th>
                <th className="px-4 py-2 text-right">
                  <SortButton label="Amount" field="amount" activeField={sortField} dir={sortDir} onSort={handleSort} />
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredCosts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-text-secondary">
                    No cost entries found.
                  </td>
                </tr>
              ) : (
                filteredCosts.map((entry) => (
                  <tr key={entry.id} className="hover:bg-surface-50 transition-colors">
                    <td className="px-4 py-2 border-t border-surface-200">{formatDate(entry.date)}</td>
                    <td className="px-4 py-2 border-t border-surface-200">{entry.category}</td>
                    <td className="px-4 py-2 border-t border-surface-200">{entry.description ?? '--'}</td>
                    <td className="px-4 py-2 border-t border-surface-200 text-right">{formatCurrency(entry.amount)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

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
    </div>
  )
}
