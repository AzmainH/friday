import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table'
import { cn } from '@/lib/cn'
import {
  Package, ListChecks, Users, Calendar, ChevronDown, ChevronRight,
} from 'lucide-react'
import { useState } from 'react'
import type {
  ProjectPlanResponse,
  PlanDeliverable,
  PlanTask,
  PlanRole,
} from '@/hooks/useNLProjectGenerator'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PlanPreviewProps {
  plan: ProjectPlanResponse
  onApply?: () => void
  applyLoading?: boolean
}

// ---------------------------------------------------------------------------
// Priority badge mapping
// ---------------------------------------------------------------------------

const priorityVariant: Record<string, 'error' | 'warning' | 'info' | 'default'> = {
  critical: 'error',
  high: 'warning',
  medium: 'info',
  low: 'default',
}

// ---------------------------------------------------------------------------
// Deliverables Section
// ---------------------------------------------------------------------------

function DeliverablesSection({ deliverables }: { deliverables: PlanDeliverable[] }) {
  const [expanded, setExpanded] = useState<Record<number, boolean>>({})

  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <Package size={18} className="text-primary-500" />
        <h3 className="text-sm font-semibold text-text-primary">
          Deliverables ({deliverables.length})
        </h3>
      </div>
      <div className="space-y-2">
        {deliverables.map((d, idx) => (
          <div
            key={idx}
            className="border border-surface-200 dark:border-surface-200 rounded-[--radius-md] overflow-hidden"
          >
            <button
              onClick={() =>
                setExpanded((prev) => ({ ...prev, [idx]: !prev[idx] }))
              }
              className="flex items-center gap-2 w-full px-4 py-3 text-left hover:bg-surface-50 dark:hover:bg-surface-100 transition-colors"
            >
              {expanded[idx] ? (
                <ChevronDown size={16} className="text-text-tertiary shrink-0" />
              ) : (
                <ChevronRight size={16} className="text-text-tertiary shrink-0" />
              )}
              <span className="text-sm font-medium text-text-primary">
                {d.name}
              </span>
            </button>
            {expanded[idx] && (
              <div className="px-4 pb-3 border-t border-surface-100 dark:border-surface-200">
                <p className="text-sm text-text-secondary mt-2 mb-2">
                  {d.description}
                </p>
                {d.acceptance_criteria && d.acceptance_criteria.length > 0 && (
                  <div>
                    <span className="text-xs font-medium text-text-tertiary uppercase tracking-wide">
                      Acceptance Criteria
                    </span>
                    <ul className="mt-1 space-y-1">
                      {d.acceptance_criteria.map((c, ci) => (
                        <li
                          key={ci}
                          className="text-sm text-text-secondary flex items-start gap-1.5"
                        >
                          <span className="text-green-500 mt-0.5 shrink-0">
                            &bull;
                          </span>
                          {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Tasks Table
// ---------------------------------------------------------------------------

function TasksTable({ tasks }: { tasks: PlanTask[] }) {
  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <ListChecks size={18} className="text-primary-500" />
        <h3 className="text-sm font-semibold text-text-primary">
          Tasks ({tasks.length})
        </h3>
      </div>
      <div className="overflow-x-auto -mx-6 px-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Summary</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Est. Hours</TableHead>
              <TableHead>Start</TableHead>
              <TableHead>End</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((task, idx) => (
              <TableRow key={idx}>
                <TableCell>
                  <span className="text-sm text-text-primary font-medium">
                    {task.summary}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={priorityVariant[task.priority] ?? 'default'}
                    size="sm"
                  >
                    {task.priority}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-text-secondary">
                    {task.estimated_hours ?? '-'}h
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-text-secondary">
                    {task.planned_start ?? '-'}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-text-secondary">
                    {task.planned_end ?? '-'}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Roles Section
// ---------------------------------------------------------------------------

function RolesSection({ roles }: { roles: PlanRole[] }) {
  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <Users size={18} className="text-primary-500" />
        <h3 className="text-sm font-semibold text-text-primary">
          Roles ({roles.length})
        </h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {roles.map((role, idx) => (
          <div
            key={idx}
            className={cn(
              'border border-surface-200 dark:border-surface-200',
              'rounded-[--radius-md] p-4',
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-text-primary">
                {role.title}
              </span>
              <Badge variant="default" size="sm">
                x{role.count}
              </Badge>
            </div>
            <ul className="space-y-1">
              {role.responsibilities.map((r, ri) => (
                <li key={ri} className="text-xs text-text-secondary">
                  &bull; {r}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Timeline Summary
// ---------------------------------------------------------------------------

function TimelineSummary({ timeline }: { timeline: ProjectPlanResponse['timeline'] }) {
  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <Calendar size={18} className="text-primary-500" />
        <h3 className="text-sm font-semibold text-text-primary">Timeline</h3>
      </div>
      <div className="flex items-center gap-4 mb-4">
        <div>
          <span className="text-xs text-text-tertiary uppercase tracking-wide">
            Start
          </span>
          <p className="text-sm font-medium text-text-primary">
            {timeline.start_date}
          </p>
        </div>
        <div className="flex-1 h-px bg-surface-200 dark:bg-surface-200" />
        <div className="text-right">
          <span className="text-xs text-text-tertiary uppercase tracking-wide">
            End
          </span>
          <p className="text-sm font-medium text-text-primary">
            {timeline.end_date}
          </p>
        </div>
      </div>
      {timeline.milestones && timeline.milestones.length > 0 && (
        <div className="space-y-2">
          <span className="text-xs font-medium text-text-tertiary uppercase tracking-wide">
            Milestones
          </span>
          {timeline.milestones.map((m, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between py-2 border-b border-surface-100 dark:border-surface-200 last:border-0"
            >
              <div>
                <p className="text-sm font-medium text-text-primary">
                  {m.name}
                </p>
                <p className="text-xs text-text-secondary">
                  {m.deliverables.join(', ')}
                </p>
              </div>
              <Badge variant="info" size="sm">
                {m.target_date}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function PlanPreview({ plan, onApply, applyLoading }: PlanPreviewProps) {
  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card>
        <h3 className="text-sm font-semibold text-text-primary mb-2">
          Summary
        </h3>
        <p className="text-sm text-text-secondary">{plan.summary}</p>
      </Card>

      <DeliverablesSection deliverables={plan.deliverables} />
      <TasksTable tasks={plan.tasks} />
      <RolesSection roles={plan.roles} />
      <TimelineSummary timeline={plan.timeline} />

      {onApply && (
        <div className="flex justify-end">
          <Button
            onClick={onApply}
            loading={applyLoading}
            disabled={applyLoading}
          >
            Apply Plan & Create Project
          </Button>
        </div>
      )}
    </div>
  )
}
