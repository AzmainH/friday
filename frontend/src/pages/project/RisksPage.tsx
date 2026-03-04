import { useState, useMemo, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, ChevronDown, ChevronUp, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import RiskHeatMap from '@/components/risk/RiskHeatMap'
import RiskDialog from '@/components/risk/RiskDialog'
import {
  useProjectRisks,
  useRiskMatrix,
  useRiskSummary,
  useRiskResponses,
  useCreateRiskResponse,
  useDeleteRisk,
} from '@/hooks/useRisks'
import type { Risk, RiskResponse } from '@/hooks/useRisks'
import { formatDate } from '@/utils/formatters'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const levelLabel: Record<string, string> = {
  very_low: 'Very Low',
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  very_high: 'Very High',
}

const categoryLabel: Record<string, string> = {
  technical: 'Technical',
  schedule: 'Schedule',
  resource: 'Resource',
  budget: 'Budget',
  scope: 'Scope',
  external: 'External',
  quality: 'Quality',
}

const statusLabel: Record<string, string> = {
  identified: 'Identified',
  analyzing: 'Analyzing',
  mitigating: 'Mitigating',
  monitoring: 'Monitoring',
  resolved: 'Resolved',
  closed: 'Closed',
}

const statusBadgeVariant: Record<string, 'default' | 'info' | 'warning' | 'success' | 'error'> = {
  identified: 'default',
  analyzing: 'info',
  mitigating: 'warning',
  monitoring: 'info',
  resolved: 'success',
  closed: 'default',
}

const responseTypeBadge: Record<string, 'default' | 'info' | 'warning' | 'success' | 'error'> = {
  avoid: 'error',
  mitigate: 'warning',
  transfer: 'info',
  accept: 'default',
}

function scoreVariant(score: number): 'success' | 'warning' | 'error' | 'default' {
  if (score <= 4) return 'success'
  if (score <= 9) return 'warning'
  return 'error'
}

type SortField = 'risk_score' | 'title' | 'status'
type SortDir = 'asc' | 'desc'

// ---------------------------------------------------------------------------
// Risk Detail Panel
// ---------------------------------------------------------------------------

function RiskDetailPanel({
  risk,
  onClose,
  onEdit,
}: {
  risk: Risk
  onClose: () => void
  onEdit: () => void
}) {
  const { data: responses } = useRiskResponses(risk.id)
  const createResponse = useCreateRiskResponse()
  const [showAddResponse, setShowAddResponse] = useState(false)
  const [responseDesc, setResponseDesc] = useState('')
  const [responseType, setResponseType] = useState('mitigate')

  const handleAddResponse = useCallback(async () => {
    if (!responseDesc.trim()) return
    await createResponse.mutateAsync({
      riskId: risk.id,
      response_type: responseType,
      description: responseDesc.trim(),
      status: 'planned',
    })
    setResponseDesc('')
    setShowAddResponse(false)
  }, [risk.id, responseDesc, responseType, createResponse])

  const inputClass =
    'w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 dark:bg-dark-surface dark:border-dark-border'

  return (
    <Card className="mt-4">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-text-primary">{risk.title}</h3>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={statusBadgeVariant[risk.status] ?? 'default'} size="sm">
              {statusLabel[risk.status] ?? risk.status}
            </Badge>
            <Badge variant={scoreVariant(risk.risk_score)} size="sm">
              Score: {risk.risk_score}
            </Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onEdit}>
            Edit
          </Button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-[--radius-sm] text-text-tertiary hover:bg-surface-100 hover:text-text-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {risk.description && (
        <p className="text-sm text-text-secondary mb-4">{risk.description}</p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4 text-sm">
        <div>
          <p className="text-text-tertiary text-xs uppercase font-semibold">Category</p>
          <p className="text-text-primary mt-0.5">{categoryLabel[risk.category] ?? risk.category}</p>
        </div>
        <div>
          <p className="text-text-tertiary text-xs uppercase font-semibold">Probability</p>
          <p className="text-text-primary mt-0.5">{levelLabel[risk.probability] ?? risk.probability}</p>
        </div>
        <div>
          <p className="text-text-tertiary text-xs uppercase font-semibold">Impact</p>
          <p className="text-text-primary mt-0.5">{levelLabel[risk.impact] ?? risk.impact}</p>
        </div>
        <div>
          <p className="text-text-tertiary text-xs uppercase font-semibold">Due Date</p>
          <p className="text-text-primary mt-0.5">{risk.due_date ? formatDate(risk.due_date) : '--'}</p>
        </div>
      </div>

      {risk.mitigation_plan && (
        <div className="mb-3">
          <p className="text-xs font-semibold text-text-tertiary uppercase mb-1">Mitigation Plan</p>
          <p className="text-sm text-text-secondary bg-surface-50 dark:bg-surface-100 rounded-lg p-3">
            {risk.mitigation_plan}
          </p>
        </div>
      )}

      {risk.contingency_plan && (
        <div className="mb-3">
          <p className="text-xs font-semibold text-text-tertiary uppercase mb-1">Contingency Plan</p>
          <p className="text-sm text-text-secondary bg-surface-50 dark:bg-surface-100 rounded-lg p-3">
            {risk.contingency_plan}
          </p>
        </div>
      )}

      {/* Responses */}
      <div className="mt-4 border-t border-surface-200 pt-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-text-primary">
            Risk Responses ({responses?.length ?? 0})
          </p>
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<Plus className="h-3.5 w-3.5" />}
            onClick={() => setShowAddResponse(true)}
          >
            Add
          </Button>
        </div>

        {responses && responses.length > 0 && (
          <div className="space-y-2">
            {responses.map((resp: RiskResponse) => (
              <div
                key={resp.id}
                className="flex items-start gap-3 p-2.5 border border-surface-200 rounded-[--radius-sm] bg-surface-50 dark:bg-dark-surface"
              >
                <Badge
                  variant={responseTypeBadge[resp.response_type] ?? 'default'}
                  size="sm"
                  className="mt-0.5 shrink-0"
                >
                  {resp.response_type}
                </Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary">{resp.description ?? '--'}</p>
                  <p className="text-xs text-text-tertiary mt-0.5">Status: {resp.status}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {showAddResponse && (
          <div className="mt-3 space-y-2 border border-surface-200 rounded-[--radius-md] p-3 bg-surface-50 dark:bg-dark-surface">
            <div className="grid grid-cols-[140px_1fr] gap-2">
              <select
                className={inputClass}
                value={responseType}
                onChange={(e) => setResponseType(e.target.value)}
              >
                <option value="avoid">Avoid</option>
                <option value="mitigate">Mitigate</option>
                <option value="transfer">Transfer</option>
                <option value="accept">Accept</option>
              </select>
              <input
                type="text"
                className={inputClass}
                placeholder="Describe the response action..."
                value={responseDesc}
                onChange={(e) => setResponseDesc(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowAddResponse(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleAddResponse}
                disabled={!responseDesc.trim() || createResponse.isPending}
                loading={createResponse.isPending}
              >
                Save
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function RisksPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const pid = projectId ?? ''

  const { data: risks, isLoading } = useProjectRisks(pid)
  const { data: matrix } = useRiskMatrix(pid)
  const { data: summary } = useRiskSummary(pid)
  const deleteRisk = useDeleteRisk()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editRisk, setEditRisk] = useState<Risk | null>(null)
  const [expandedRiskId, setExpandedRiskId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [sortField, setSortField] = useState<SortField>('risk_score')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [heatMapFilter, setHeatMapFilter] = useState<{ probability: string; impact: string } | null>(null)

  const handleSort = useCallback(
    (field: SortField) => {
      if (field === sortField) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
      } else {
        setSortField(field)
        setSortDir(field === 'risk_score' ? 'desc' : 'asc')
      }
    },
    [sortField],
  )

  const filteredRisks = useMemo(() => {
    if (!risks) return []
    let list = [...risks]
    if (statusFilter !== 'all') list = list.filter((r) => r.status === statusFilter)
    if (categoryFilter !== 'all') list = list.filter((r) => r.category === categoryFilter)
    if (heatMapFilter) {
      list = list.filter(
        (r) => r.probability === heatMapFilter.probability && r.impact === heatMapFilter.impact,
      )
    }
    list.sort((a, b) => {
      let cmp = 0
      if (sortField === 'risk_score') cmp = a.risk_score - b.risk_score
      else if (sortField === 'title') cmp = a.title.localeCompare(b.title)
      else if (sortField === 'status') cmp = a.status.localeCompare(b.status)
      return sortDir === 'asc' ? cmp : -cmp
    })
    return list
  }, [risks, statusFilter, categoryFilter, heatMapFilter, sortField, sortDir])

  const expandedRisk = useMemo(
    () => risks?.find((r) => r.id === expandedRiskId) ?? null,
    [risks, expandedRiskId],
  )

  const handleCellClick = useCallback(
    (probability: string, impact: string) => {
      if (
        heatMapFilter &&
        heatMapFilter.probability === probability &&
        heatMapFilter.impact === impact
      ) {
        setHeatMapFilter(null)
      } else {
        setHeatMapFilter({ probability, impact })
      }
    },
    [heatMapFilter],
  )

  const handleEdit = useCallback((risk: Risk) => {
    setEditRisk(risk)
    setDialogOpen(true)
  }, [])

  const handleDialogClose = useCallback(() => {
    setDialogOpen(false)
    setEditRisk(null)
  }, [])

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
        <h1 className="text-2xl font-bold text-text-primary">Risk Register</h1>
        <Button
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => {
            setEditRisk(null)
            setDialogOpen(true)
          }}
        >
          Add Risk
        </Button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <Card>
            <p className="text-xs font-semibold text-text-tertiary uppercase">Total Risks</p>
            <p className="text-2xl font-bold text-text-primary mt-1">{summary.total}</p>
          </Card>
          <Card>
            <p className="text-xs font-semibold text-text-tertiary uppercase">Avg Score</p>
            <p className="text-2xl font-bold text-text-primary mt-1">
              {summary.average_score.toFixed(1)}
            </p>
          </Card>
          <Card>
            <p className="text-xs font-semibold text-text-tertiary uppercase">Active</p>
            <p className="text-2xl font-bold text-text-primary mt-1">
              {(summary.by_status['identified'] ?? 0) +
                (summary.by_status['analyzing'] ?? 0) +
                (summary.by_status['mitigating'] ?? 0)}
            </p>
          </Card>
          <Card>
            <p className="text-xs font-semibold text-text-tertiary uppercase">Resolved</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
              {(summary.by_status['resolved'] ?? 0) + (summary.by_status['closed'] ?? 0)}
            </p>
          </Card>
        </div>
      )}

      {/* Heat Map + Table layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        {/* Heat Map */}
        <Card>
          <h2 className="text-sm font-semibold text-text-primary mb-3">Risk Heat Map</h2>
          {matrix ? (
            <>
              <RiskHeatMap cells={matrix.cells} onCellClick={handleCellClick} />
              {heatMapFilter && (
                <button
                  className="mt-2 text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400"
                  onClick={() => setHeatMapFilter(null)}
                >
                  Clear filter
                </button>
              )}
            </>
          ) : (
            <p className="text-sm text-text-secondary">Loading matrix...</p>
          )}
        </Card>

        {/* Risk Register Table */}
        <div>
          {/* Filters */}
          <div className="flex gap-3 mb-3">
            <select
              className="rounded-lg border border-surface-200 bg-white px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 dark:bg-dark-surface dark:border-dark-border min-w-[140px]"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              {Object.entries(statusLabel).map(([val, label]) => (
                <option key={val} value={val}>
                  {label}
                </option>
              ))}
            </select>
            <select
              className="rounded-lg border border-surface-200 bg-white px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 dark:bg-dark-surface dark:border-dark-border min-w-[140px]"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">All Categories</option>
              {Object.entries(categoryLabel).map(([val, label]) => (
                <option key={val} value={val}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="border border-surface-200 rounded-[--radius-md] bg-white dark:bg-dark-surface overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-surface-50">
                <tr>
                  <th className="px-4 py-2 text-left">
                    <button
                      className="flex items-center gap-1 text-xs font-semibold text-text-secondary uppercase hover:text-text-primary transition-colors"
                      onClick={() => handleSort('title')}
                    >
                      Title
                      {sortField === 'title' &&
                        (sortDir === 'asc' ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        ))}
                    </button>
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-text-secondary uppercase">
                    Category
                  </th>
                  <th className="px-4 py-2 text-center text-xs font-semibold text-text-secondary uppercase">
                    Prob.
                  </th>
                  <th className="px-4 py-2 text-center text-xs font-semibold text-text-secondary uppercase">
                    Impact
                  </th>
                  <th className="px-4 py-2 text-center">
                    <button
                      className="flex items-center gap-1 text-xs font-semibold text-text-secondary uppercase hover:text-text-primary transition-colors mx-auto"
                      onClick={() => handleSort('risk_score')}
                    >
                      Score
                      {sortField === 'risk_score' &&
                        (sortDir === 'asc' ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        ))}
                    </button>
                  </th>
                  <th className="px-4 py-2 text-center">
                    <button
                      className="flex items-center gap-1 text-xs font-semibold text-text-secondary uppercase hover:text-text-primary transition-colors mx-auto"
                      onClick={() => handleSort('status')}
                    >
                      Status
                      {sortField === 'status' &&
                        (sortDir === 'asc' ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        ))}
                    </button>
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-text-secondary uppercase">
                    Due
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredRisks.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-8 text-center text-sm text-text-secondary"
                    >
                      No risks found.
                    </td>
                  </tr>
                ) : (
                  filteredRisks.map((risk) => (
                    <tr
                      key={risk.id}
                      className="hover:bg-surface-50 transition-colors cursor-pointer"
                      onClick={() =>
                        setExpandedRiskId(expandedRiskId === risk.id ? null : risk.id)
                      }
                    >
                      <td className="px-4 py-2.5 border-t border-surface-200 font-medium text-text-primary max-w-[200px] truncate">
                        {risk.title}
                      </td>
                      <td className="px-4 py-2.5 border-t border-surface-200">
                        <Badge variant="default" size="sm">
                          {categoryLabel[risk.category] ?? risk.category}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5 border-t border-surface-200 text-center text-text-secondary">
                        {levelLabel[risk.probability] ?? risk.probability}
                      </td>
                      <td className="px-4 py-2.5 border-t border-surface-200 text-center text-text-secondary">
                        {levelLabel[risk.impact] ?? risk.impact}
                      </td>
                      <td className="px-4 py-2.5 border-t border-surface-200 text-center">
                        <Badge variant={scoreVariant(risk.risk_score)} size="sm">
                          {risk.risk_score}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5 border-t border-surface-200 text-center">
                        <Badge
                          variant={statusBadgeVariant[risk.status] ?? 'default'}
                          size="sm"
                        >
                          {statusLabel[risk.status] ?? risk.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5 border-t border-surface-200 text-text-secondary">
                        {risk.due_date ? formatDate(risk.due_date) : '--'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Expanded Detail Panel */}
          {expandedRisk && (
            <RiskDetailPanel
              risk={expandedRisk}
              onClose={() => setExpandedRiskId(null)}
              onEdit={() => handleEdit(expandedRisk)}
            />
          )}
        </div>
      </div>

      {/* Dialog */}
      <RiskDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        projectId={pid}
        risk={editRisk}
      />
    </div>
  )
}
