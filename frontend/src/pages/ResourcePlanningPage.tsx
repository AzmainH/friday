import { useState } from 'react'
import { Users, BarChart3, Calendar } from 'lucide-react'
import { TabGroup, TabList, Tab, TabPanels, TabPanel } from '@headlessui/react'
import { cn } from '@/lib/cn'
import UtilizationChart from '@/components/resource/UtilizationChart'
import CapacityTable from '@/components/resource/CapacityTable'
import {
  useUtilizationReport,
  useTeamCapacity,
  useTeamAllocation,
} from '@/hooks/useResourcePlanning'

const WORKSPACE_ID = 'default' // Placeholder until workspace context is wired

const WEEK_OPTIONS = [2, 4, 8, 12] as const

const TABS = ['Utilization', 'Capacity', 'Allocation'] as const

export default function ResourcePlanningPage() {
  const [weeks, setWeeks] = useState<number>(4)

  const { data: utilization, isLoading: loadingUtil } = useUtilizationReport(WORKSPACE_ID, weeks)
  const { data: capacity, isLoading: loadingCap } = useTeamCapacity(WORKSPACE_ID, weeks)
  const { data: allocation, isLoading: loadingAlloc } = useTeamAllocation(WORKSPACE_ID, weeks)

  const isLoading = loadingUtil || loadingCap || loadingAlloc

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Users className="h-6 w-6 text-primary-600" />
            Resource Planning
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Team capacity, allocation, and utilization overview.
          </p>
        </div>

        {/* Week selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-text-secondary">Forecast:</span>
          <div className="flex gap-1">
            {WEEK_OPTIONS.map((w) => (
              <button
                key={w}
                onClick={() => setWeeks(w)}
                className={cn(
                  'px-3 py-1 text-sm rounded-[--radius-sm] font-medium transition-colors',
                  weeks === w
                    ? 'bg-primary-600 text-white'
                    : 'bg-surface-100 text-text-secondary hover:bg-surface-200',
                )}
              >
                {w}w
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary cards */}
      {utilization && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <SummaryCard
            icon={<Users className="h-5 w-5 text-primary-500" />}
            label="Team Members"
            value={utilization.utilization.length}
          />
          <SummaryCard
            icon={<BarChart3 className="h-5 w-5 text-emerald-500" />}
            label="Avg Utilization"
            value={`${avgUtilization(utilization.utilization)}%`}
          />
          <SummaryCard
            icon={<Calendar className="h-5 w-5 text-amber-500" />}
            label="Over-allocated"
            value={utilization.utilization.filter((m) => m.status === 'over').length}
          />
        </div>
      )}

      {/* Tabs */}
      <TabGroup>
        <TabList className="flex gap-1 border-b border-surface-200 mb-6">
          {TABS.map((tab) => (
            <Tab
              key={tab}
              className={({ selected }) =>
                cn(
                  'px-4 py-2 text-sm font-medium outline-none transition-colors -mb-px border-b-2',
                  selected
                    ? 'border-primary-500 text-primary-700'
                    : 'border-transparent text-text-secondary hover:text-text-primary hover:border-surface-300',
                )
              }
            >
              {tab}
            </Tab>
          ))}
        </TabList>

        <TabPanels>
          {/* Utilization */}
          <TabPanel>
            <div className="bg-white dark:bg-surface-100 rounded-[--radius-md] border border-surface-200 p-6">
              <h2 className="text-lg font-semibold text-text-primary mb-4">
                Team Utilization ({weeks}-week view)
              </h2>
              {isLoading ? (
                <LoadingSkeleton />
              ) : utilization ? (
                <UtilizationChart data={utilization.utilization} />
              ) : null}
            </div>
          </TabPanel>

          {/* Capacity */}
          <TabPanel>
            <div className="bg-white dark:bg-surface-100 rounded-[--radius-md] border border-surface-200 p-6">
              <h2 className="text-lg font-semibold text-text-primary mb-4">
                Capacity Overview ({weeks}-week view)
              </h2>
              {isLoading ? (
                <LoadingSkeleton />
              ) : capacity && allocation ? (
                <CapacityTable
                  members={capacity.members}
                  allocations={allocation.allocations}
                  weeks={weeks}
                />
              ) : null}
            </div>
          </TabPanel>

          {/* Allocation breakdown */}
          <TabPanel>
            <div className="bg-white dark:bg-surface-100 rounded-[--radius-md] border border-surface-200 p-6">
              <h2 className="text-lg font-semibold text-text-primary mb-4">
                Allocation by Member
              </h2>
              {isLoading ? (
                <LoadingSkeleton />
              ) : allocation ? (
                <AllocationBreakdown allocations={allocation.allocations} />
              ) : null}
            </div>
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function avgUtilization(data: { utilization_percent: number }[]): number {
  if (data.length === 0) return 0
  const sum = data.reduce((acc, m) => acc + m.utilization_percent, 0)
  return Math.round(sum / data.length)
}

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
}) {
  return (
    <div className="bg-white dark:bg-surface-100 rounded-[--radius-md] border border-surface-200 p-4 flex items-center gap-3">
      <div className="p-2 rounded-[--radius-sm] bg-surface-50 dark:bg-surface-200">{icon}</div>
      <div>
        <p className="text-xs text-text-tertiary font-medium uppercase tracking-wide">{label}</p>
        <p className="text-xl font-bold text-text-primary tabular-nums">{value}</p>
      </div>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <div className="skeleton-shimmer h-5 w-32 rounded" />
          <div className="skeleton-shimmer h-7 flex-1 rounded" />
          <div className="skeleton-shimmer h-5 w-20 rounded" />
        </div>
      ))}
    </div>
  )
}

function AllocationBreakdown({
  allocations,
}: {
  allocations: { user_id: string; total_allocated_hours: number; projects: { project_id: string; allocated_hours: number; issue_count: number }[] }[]
}) {
  if (!allocations || allocations.length === 0) {
    return (
      <div className="text-sm text-text-secondary py-8 text-center">
        No allocations found.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {allocations.map((alloc) => (
        <div key={alloc.user_id} className="border-b border-surface-100 pb-3 last:border-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-text-primary">{alloc.user_id}</span>
            <span className="text-sm tabular-nums text-text-secondary">
              {alloc.total_allocated_hours}h total
            </span>
          </div>
          {alloc.projects.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {alloc.projects.map((proj) => (
                <span
                  key={proj.project_id}
                  className="text-xs bg-surface-100 dark:bg-surface-200 px-2 py-1 rounded-[--radius-sm] text-text-secondary"
                >
                  {proj.project_id.slice(0, 8)}... &middot; {proj.allocated_hours}h &middot;{' '}
                  {proj.issue_count} issues
                </span>
              ))}
            </div>
          ) : (
            <span className="text-xs text-text-tertiary">No project allocations</span>
          )}
        </div>
      ))}
    </div>
  )
}
