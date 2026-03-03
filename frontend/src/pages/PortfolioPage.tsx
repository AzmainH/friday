import { useState, useMemo } from 'react'
import { Filter } from 'lucide-react'
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
    if (!overview?.summary?.by_rag) return []
    return Object.entries(overview.summary.by_rag)
      .filter(([, count]) => count > 0)
      .map(([rag, count]) => ({ name: rag, value: count, color: RAG_PIE_COLORS[rag] ?? '#999' }))
  }, [overview])

  /* ---- Budget bar data ---- */
  const budgetData = useMemo(() => {
    if (!overview?.projects) return []
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
    if (!overview?.projects) return []
    return overview.projects.map((p) => ({
      name: p.key_prefix,
      progress: p.progress_pct,
      color: RAG_COLORS[p.rag_status] ?? RAG_COLORS.none,
    }))
  }, [overview])

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-surface-200 border-t-primary-500" />
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-[--radius-sm]">
          Failed to load portfolio: {error.message}
        </div>
      </div>
    )
  }

  if (!overview || !filteredOverview) {
    return (
      <div>
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-[--radius-sm]">
          No portfolio data available.
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-text-primary">Portfolio</h2>

        <div className="relative inline-flex items-center">
          <Filter className="absolute left-3 h-4 w-4 text-text-secondary pointer-events-none" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none rounded-[--radius-sm] border border-surface-300 bg-white dark:bg-dark-surface pl-9 pr-8 py-1.5 text-sm text-text-primary outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors min-w-[160px]"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
          </select>
          <svg
            className="absolute right-2.5 h-4 w-4 text-text-tertiary pointer-events-none"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Summary charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* RAG distribution donut */}
        <div className="p-4 bg-white dark:bg-dark-surface border border-surface-200 rounded-[--radius-md] shadow-sm h-[280px]">
          <h3 className="text-sm font-semibold text-text-primary mb-2">RAG Distribution</h3>
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
            <div className="h-[230px] flex items-center justify-center">
              <span className="text-sm text-text-secondary">No data</span>
            </div>
          )}
        </div>

        {/* Budget overview */}
        <div className="p-4 bg-white dark:bg-dark-surface border border-surface-200 rounded-[--radius-md] shadow-sm h-[280px]">
          <h3 className="text-sm font-semibold text-text-primary mb-1">Budget Overview</h3>
          <p className="text-xs text-text-secondary mb-2">
            Spent: {formatCurrency(overview.summary?.total_budget_spent ?? 0)} / Allocated:{' '}
            {formatCurrency(overview.summary?.total_budget_allocated ?? 0)}
          </p>
          {budgetData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={budgetData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" fontSize={11} />
                <YAxis fontSize={11} />
                <RechartsTooltip formatter={(val: number) => formatCurrency(val)} />
                <Bar dataKey="allocated" fill="#B2DFDB" name="Allocated" />
                <Bar dataKey="spent" fill="#009688" name="Spent" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center">
              <span className="text-sm text-text-secondary">No budget data</span>
            </div>
          )}
        </div>

        {/* Timeline / progress chart */}
        <div className="p-4 bg-white dark:bg-dark-surface border border-surface-200 rounded-[--radius-md] shadow-sm h-[280px]">
          <h3 className="text-sm font-semibold text-text-primary mb-2">Project Progress</h3>
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
            <div className="h-[230px] flex items-center justify-center">
              <span className="text-sm text-text-secondary">No data</span>
            </div>
          )}
        </div>
      </div>

      {/* Program Board */}
      <ProgramBoard overview={filteredOverview} />
    </div>
  )
}
