import { useState } from 'react'
import type { Milestone } from '@/types/api'
import { formatDate } from '@/utils/formatters'

// ---- Status color mapping ----

const STATUS_COLORS: Record<string, string> = {
  not_started: '#9e9e9e',
  in_progress: '#3574D4',
  completed: '#2E9E5A',
  blocked: '#D84040',
}

const STATUS_LABELS: Record<string, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  completed: 'Completed',
  blocked: 'Blocked',
}

function getStatusColor(status: string): string {
  return STATUS_COLORS[status] ?? '#9e9e9e'
}

function getStatusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status
}

// ---- Props ----

interface MilestoneTimelineProps {
  milestones: Milestone[]
}

// ---- Component ----

export default function MilestoneTimeline({ milestones }: MilestoneTimelineProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Sort milestones by due_date (nulls last)
  const sorted = [...milestones].sort((a, b) => {
    if (!a.due_date && !b.due_date) return 0
    if (!a.due_date) return 1
    if (!b.due_date) return -1
    return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
  })

  if (sorted.length === 0) {
    return (
      <div className="py-8 text-center">
        <span className="text-sm text-text-secondary">
          No milestones yet. Create one to get started.
        </span>
      </div>
    )
  }

  const handleToggle = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  return (
    <div className="relative py-6">
      {/* Horizontal axis line */}
      <div
        className="absolute left-6 right-6 h-0.5 bg-surface-200"
        style={{ top: 56, zIndex: 0 }}
      />

      {/* Milestone markers */}
      <div className="flex justify-between items-start relative z-[1] px-6 overflow-x-auto gap-4 min-h-[120px]">
        {sorted.map((milestone) => {
          const color = getStatusColor(milestone.status)
          const isExpanded = expandedId === milestone.id

          return (
            <div
              key={milestone.id}
              className="flex flex-col items-center min-w-[120px] flex-[1_0_auto] cursor-pointer"
              onClick={() => handleToggle(milestone.id)}
            >
              {/* Name above the marker */}
              <span className="text-xs font-semibold mb-1 text-center max-w-[140px] overflow-hidden text-ellipsis whitespace-nowrap">
                {milestone.name}
              </span>

              {/* Diamond / circle icon */}
              <div
                title={`${getStatusLabel(milestone.status)} - ${formatDate(milestone.due_date)}`}
                className="transition-all duration-200"
                style={{
                  width: 20,
                  height: 20,
                  backgroundColor: color,
                  borderRadius: milestone.milestone_type === 'gate' ? '2px' : '50%',
                  transform: milestone.milestone_type === 'gate' ? 'rotate(45deg)' : 'none',
                  border: '3px solid white',
                  boxShadow: `0 0 0 2px ${color}`,
                }}
              />

              {/* Date below */}
              <span className="text-xs text-text-secondary mt-1">
                {formatDate(milestone.due_date)}
              </span>

              {/* Status chip */}
              <span
                className="mt-1 inline-flex items-center px-2 py-0.5 rounded-full text-[0.675rem] font-semibold"
                style={{
                  backgroundColor: `${color}20`,
                  color,
                }}
              >
                {getStatusLabel(milestone.status)}
              </span>

              {/* Expandable detail panel */}
              <div
                className="overflow-hidden transition-all duration-200"
                style={{
                  maxHeight: isExpanded ? '2000px' : '0px',
                }}
              >
                <div
                  className="mt-2 p-3 min-w-[200px] bg-white dark:bg-dark-surface border border-surface-200 rounded-[--radius-md] shadow-sm"
                  style={{ borderLeft: `3px solid ${color}` }}
                >
                  {milestone.description && (
                    <p className="text-sm text-text-primary mb-2">{milestone.description}</p>
                  )}
                  <span className="block text-xs text-text-secondary">
                    Type: {milestone.milestone_type}
                  </span>
                  <span className="block text-xs text-text-secondary">
                    Start: {formatDate(milestone.start_date)}
                  </span>
                  <span className="block text-xs text-text-secondary">
                    Due: {formatDate(milestone.due_date)}
                  </span>
                  {milestone.completed_date && (
                    <span className="block text-xs text-text-secondary">
                      Completed: {formatDate(milestone.completed_date)}
                    </span>
                  )}
                  <span className="block text-xs text-text-secondary">
                    Progress: {milestone.progress_pct}%
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
