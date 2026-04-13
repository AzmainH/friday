import { useState, useCallback } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/cn'
import { MessageSquare, ArrowRight, RefreshCw } from 'lucide-react'
import type { ProjectPlanResponse } from '@/hooks/useNLProjectGenerator'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RefinementChatProps {
  currentPlan: ProjectPlanResponse
  previousPlan?: ProjectPlanResponse | null
  onSubmitCorrections: (corrections: string) => void
  isRefining: boolean
}

// ---------------------------------------------------------------------------
// Diff helpers
// ---------------------------------------------------------------------------

function countChanges(
  prev: ProjectPlanResponse | null | undefined,
  current: ProjectPlanResponse,
): { tasks: number; deliverables: number; roles: number } {
  if (!prev) return { tasks: 0, deliverables: 0, roles: 0 }
  return {
    tasks: Math.abs(current.tasks.length - prev.tasks.length),
    deliverables: Math.abs(current.deliverables.length - prev.deliverables.length),
    roles: Math.abs(current.roles.length - prev.roles.length),
  }
}

// ---------------------------------------------------------------------------
// Comparison Panel
// ---------------------------------------------------------------------------

function ComparisonPanel({
  previousPlan,
  currentPlan,
}: {
  previousPlan: ProjectPlanResponse
  currentPlan: ProjectPlanResponse
}) {
  const changes = countChanges(previousPlan, currentPlan)
  const summaryChanged = previousPlan.summary !== currentPlan.summary
  const timelineChanged =
    previousPlan.timeline.start_date !== currentPlan.timeline.start_date ||
    previousPlan.timeline.end_date !== currentPlan.timeline.end_date

  return (
    <Card>
      <div className="flex items-center gap-2 mb-3">
        <RefreshCw size={16} className="text-primary-500" />
        <h4 className="text-sm font-semibold text-text-primary">
          Changes Applied
        </h4>
      </div>
      <div className="space-y-2">
        {summaryChanged && (
          <div className="flex items-start gap-3">
            <Badge variant="info" size="sm">
              Summary
            </Badge>
            <div className="flex-1 space-y-1">
              <p className="text-xs text-text-tertiary line-through">
                {previousPlan.summary.slice(0, 100)}
                {previousPlan.summary.length > 100 ? '...' : ''}
              </p>
              <div className="flex items-center gap-1 text-text-tertiary">
                <ArrowRight size={12} />
              </div>
              <p className="text-xs text-text-secondary">
                {currentPlan.summary.slice(0, 100)}
                {currentPlan.summary.length > 100 ? '...' : ''}
              </p>
            </div>
          </div>
        )}
        {changes.tasks > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="warning" size="sm">
              Tasks
            </Badge>
            <span className="text-xs text-text-secondary">
              {previousPlan.tasks.length} &rarr; {currentPlan.tasks.length} tasks
            </span>
          </div>
        )}
        {changes.deliverables > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="success" size="sm">
              Deliverables
            </Badge>
            <span className="text-xs text-text-secondary">
              {previousPlan.deliverables.length} &rarr;{' '}
              {currentPlan.deliverables.length} deliverables
            </span>
          </div>
        )}
        {changes.roles > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="default" size="sm">
              Roles
            </Badge>
            <span className="text-xs text-text-secondary">
              {previousPlan.roles.length} &rarr; {currentPlan.roles.length} roles
            </span>
          </div>
        )}
        {timelineChanged && (
          <div className="flex items-center gap-2">
            <Badge variant="info" size="sm">
              Timeline
            </Badge>
            <span className="text-xs text-text-secondary">
              {previousPlan.timeline.start_date}~{previousPlan.timeline.end_date}
              {' '}&rarr;{' '}
              {currentPlan.timeline.start_date}~{currentPlan.timeline.end_date}
            </span>
          </div>
        )}
        {!summaryChanged &&
          changes.tasks === 0 &&
          changes.deliverables === 0 &&
          changes.roles === 0 &&
          !timelineChanged && (
            <p className="text-xs text-text-tertiary">
              No structural changes detected. Content within items may have been updated.
            </p>
          )}
      </div>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function RefinementChat({
  currentPlan,
  previousPlan,
  onSubmitCorrections,
  isRefining,
}: RefinementChatProps) {
  const [corrections, setCorrections] = useState('')

  const handleSubmit = useCallback(() => {
    const trimmed = corrections.trim()
    if (!trimmed) return
    onSubmitCorrections(trimmed)
    setCorrections('')
  }, [corrections, onSubmitCorrections])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        handleSubmit()
      }
    },
    [handleSubmit],
  )

  return (
    <div className="space-y-4">
      {/* Comparison of before/after */}
      {previousPlan && (
        <ComparisonPanel previousPlan={previousPlan} currentPlan={currentPlan} />
      )}

      {/* Correction input */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare size={16} className="text-primary-500" />
          <h4 className="text-sm font-semibold text-text-primary">
            Refine Your Plan
          </h4>
        </div>
        <p className="text-xs text-text-secondary mb-3">
          Describe what you'd like to change. For example: "Add a security review
          phase", "Reduce the timeline to 2 weeks", or "Split the backend task
          into API and database tasks".
        </p>
        <Textarea
          value={corrections}
          onChange={(e) => setCorrections(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe the changes you want to make to the plan..."
          rows={4}
          disabled={isRefining}
        />
        <div
          className={cn(
            'flex items-center justify-between mt-3',
          )}
        >
          <span className="text-xs text-text-tertiary">
            Ctrl+Enter to submit
          </span>
          <Button
            onClick={handleSubmit}
            disabled={!corrections.trim() || isRefining}
            loading={isRefining}
            size="sm"
          >
            Apply Corrections
          </Button>
        </div>
      </Card>
    </div>
  )
}
