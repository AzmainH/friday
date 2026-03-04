import { useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, Play, CheckCircle2, Calendar, Target, Zap, Layers } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import SprintPlanningDialog from '@/components/sprint/SprintPlanningDialog'
import SprintCompleteDialog from '@/components/sprint/SprintCompleteDialog'
import SprintBurndown from '@/components/sprint/SprintBurndown'
import {
  useProjectSprints,
  useSprintBurndown,
  useStartSprint,
} from '@/hooks/useSprints'
import type { Sprint } from '@/hooks/useSprints'
import { formatDate } from '@/utils/formatters'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const statusBadgeVariant: Record<string, 'default' | 'success' | 'warning' | 'info' | 'error'> = {
  planning: 'default',
  active: 'info',
  completed: 'success',
  cancelled: 'error',
}

function daysRemaining(endDate: string): number {
  const end = new Date(endDate)
  const now = new Date()
  return Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function SprintPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const pid = projectId ?? ''

  const { data: sprints, isLoading } = useProjectSprints(pid)
  const startSprint = useStartSprint()

  const [planningOpen, setPlanningOpen] = useState(false)
  const [completeOpen, setCompleteOpen] = useState(false)

  // Find the active or most recent planning sprint
  const activeSprint = useMemo(() => {
    if (!sprints) return null
    return (
      sprints.find((s) => s.status === 'active') ??
      sprints.find((s) => s.status === 'planning') ??
      null
    )
  }, [sprints])

  const pastSprints = useMemo(() => {
    if (!sprints) return []
    return sprints
      .filter((s) => s.status === 'completed' || s.status === 'cancelled')
      .sort((a, b) => b.end_date.localeCompare(a.end_date))
  }, [sprints])

  const { data: burndown } = useSprintBurndown(activeSprint?.id ?? '')

  const handleStart = async (sprint: Sprint) => {
    await startSprint.mutateAsync(sprint.id)
  }

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-surface-200 border-t-primary-500 mx-auto" />
      </div>
    )
  }

  // Full empty state when no sprints exist at all
  if (sprints && sprints.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-text-primary">Sprints</h1>
        </div>
        <EmptyState
          icon={Layers}
          title="Plan your first sprint"
          description="Sprints help you organize work into time-boxed iterations. Create a sprint to start planning your team's delivery cycle."
          action={
            <Button
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => setPlanningOpen(true)}
            >
              Create Sprint
            </Button>
          }
        />
        <SprintPlanningDialog
          open={planningOpen}
          onClose={() => setPlanningOpen(false)}
          projectId={pid}
        />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Sprints</h1>
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setPlanningOpen(true)}>
          Create Sprint
        </Button>
      </div>

      {/* Active Sprint Panel */}
      {activeSprint ? (
        <Card className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-text-primary">{activeSprint.name}</h2>
                <Badge
                  variant={statusBadgeVariant[activeSprint.status] ?? 'default'}
                  size="sm"
                >
                  {activeSprint.status}
                </Badge>
              </div>
              {activeSprint.goal && (
                <p className="text-sm text-text-secondary mt-1">{activeSprint.goal}</p>
              )}
            </div>
            <div className="flex gap-2">
              {activeSprint.status === 'planning' && (
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<Play className="h-3.5 w-3.5" />}
                  onClick={() => handleStart(activeSprint)}
                  loading={startSprint.isPending}
                >
                  Start Sprint
                </Button>
              )}
              {activeSprint.status === 'active' && (
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<CheckCircle2 className="h-3.5 w-3.5" />}
                  onClick={() => setCompleteOpen(true)}
                >
                  Complete Sprint
                </Button>
              )}
            </div>
          </div>

          {/* Sprint stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-text-tertiary" />
              <span className="text-text-secondary">
                {formatDate(activeSprint.start_date)} &ndash; {formatDate(activeSprint.end_date)}
              </span>
            </div>
            {activeSprint.status === 'active' && (
              <div className="flex items-center gap-2 text-sm">
                <Target className="h-4 w-4 text-text-tertiary" />
                <span className="text-text-secondary">
                  {daysRemaining(activeSprint.end_date)} days remaining
                </span>
              </div>
            )}
            {activeSprint.velocity != null && (
              <div className="flex items-center gap-2 text-sm">
                <Zap className="h-4 w-4 text-text-tertiary" />
                <span className="text-text-secondary">Velocity: {activeSprint.velocity}</span>
              </div>
            )}
          </div>

          {/* Progress bar */}
          {burndown && burndown.total_issues > 0 && (
            <div className="mb-4">
              <div className="flex justify-between text-xs text-text-secondary mb-1">
                <span>
                  {burndown.completed_issues} / {burndown.total_issues} issues completed
                </span>
                <span>
                  {burndown.completed_points} / {burndown.total_points} points
                </span>
              </div>
              <div className="w-full bg-surface-100 dark:bg-surface-200 rounded-full h-2">
                <div
                  className="bg-primary-500 h-2 rounded-full transition-all"
                  style={{
                    width: `${Math.round((burndown.completed_issues / burndown.total_issues) * 100)}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Burndown chart */}
          {burndown && burndown.total_points > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-text-primary mb-2">Burndown</h3>
              <SprintBurndown burndown={burndown} />
            </div>
          )}
        </Card>
      ) : (
        <Card className="mb-8">
          <div className="text-center py-8">
            <p className="text-text-secondary text-sm">No active sprint.</p>
            <Button
              size="sm"
              className="mt-3"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => setPlanningOpen(true)}
            >
              Create Sprint
            </Button>
          </div>
        </Card>
      )}

      {/* Sprint History */}
      {pastSprints.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-text-primary mb-3">Sprint History</h2>
          <div className="border border-surface-200 rounded-[--radius-md] bg-white dark:bg-dark-surface overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-surface-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-text-secondary uppercase">
                    Name
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-text-secondary uppercase">
                    Dates
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-semibold text-text-secondary uppercase">
                    Velocity
                  </th>
                  <th className="px-4 py-2 text-center text-xs font-semibold text-text-secondary uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {pastSprints.map((sprint) => (
                  <tr key={sprint.id} className="hover:bg-surface-50 transition-colors">
                    <td className="px-4 py-2.5 border-t border-surface-200 font-medium text-text-primary">
                      {sprint.name}
                    </td>
                    <td className="px-4 py-2.5 border-t border-surface-200 text-text-secondary">
                      {formatDate(sprint.start_date)} &ndash; {formatDate(sprint.end_date)}
                    </td>
                    <td className="px-4 py-2.5 border-t border-surface-200 text-right text-text-primary">
                      {sprint.velocity ?? '--'}
                    </td>
                    <td className="px-4 py-2.5 border-t border-surface-200 text-center">
                      <Badge
                        variant={statusBadgeVariant[sprint.status] ?? 'default'}
                        size="sm"
                      >
                        {sprint.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Dialogs */}
      <SprintPlanningDialog
        open={planningOpen}
        onClose={() => setPlanningOpen(false)}
        projectId={pid}
      />

      {activeSprint && (
        <SprintCompleteDialog
          open={completeOpen}
          onClose={() => setCompleteOpen(false)}
          sprintId={activeSprint.id}
          sprintName={activeSprint.name}
          burndown={burndown}
        />
      )}
    </div>
  )
}
