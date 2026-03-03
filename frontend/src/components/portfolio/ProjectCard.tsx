import { Bug, AlertTriangle, CheckCircle } from 'lucide-react'
import type { PortfolioProject } from '@/hooks/usePortfolio'
import { RAG_COLORS, formatPercent, formatCurrency } from '@/utils/formatters'

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export interface ProjectCardProps {
  project: PortfolioProject
  onClick?: (projectId: string) => void
}

/* ------------------------------------------------------------------ */
/*  Status label map                                                   */
/* ------------------------------------------------------------------ */

const STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  paused: 'Paused',
  completed: 'Completed',
  archived: 'Archived',
}

const STATUS_CHIP_CLASSES: Record<string, string> = {
  active: 'border-primary-300 text-primary-600',
  completed: 'border-green-300 text-green-600',
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function ProjectCard({ project, onClick }: ProjectCardProps) {
  const ragColor = RAG_COLORS[project.rag_status] ?? RAG_COLORS.none

  return (
    <div
      className={
        'h-full rounded-[--radius-md] border border-surface-200 bg-white p-4 shadow-sm transition-all dark:bg-surface-50' +
        (onClick ? ' cursor-pointer hover:-translate-y-0.5 hover:shadow-md' : '')
      }
      onClick={() => onClick?.(project.id)}
    >
      {/* Top row: RAG indicator + name + status */}
      <div className="mb-1 flex items-center gap-1">
        <span
          title={`RAG: ${project.rag_status}`}
          className="h-3.5 w-3.5 flex-shrink-0 rounded-full"
          style={{
            backgroundColor: ragColor,
            boxShadow: `0 0 0 2px ${ragColor}33`,
          }}
        />
        <span className="flex-1 truncate text-sm font-semibold text-text-primary">
          {project.name}
        </span>
        <span
          className={
            'inline-flex items-center rounded-full border px-2 py-0.5 text-xs ' +
            (STATUS_CHIP_CLASSES[project.status] ?? 'border-surface-200 text-text-secondary')
          }
        >
          {STATUS_LABELS[project.status] ?? project.status}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-1.5">
        <div className="mb-0.5 flex justify-between">
          <span className="text-xs text-text-secondary">Progress</span>
          <span className="text-xs font-semibold text-text-primary">
            {formatPercent(project.progress_pct)}
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-surface-200">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${Math.min(project.progress_pct, 100)}%`,
              backgroundColor: ragColor,
            }}
          />
        </div>
      </div>

      {/* Key metrics row */}
      <div className="mb-1 flex items-center gap-2">
        <span className="flex items-center gap-0.5" title="Total issues">
          <Bug className="h-4 w-4 text-text-secondary" />
          <span className="text-sm text-text-primary">{project.total_issues}</span>
        </span>
        <span className="flex items-center gap-0.5" title="Completed issues">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span className="text-sm text-text-primary">{project.completed_issues}</span>
        </span>
        {project.overdue_issues > 0 && (
          <span className="flex items-center gap-0.5" title="Overdue issues">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <span className="text-sm text-red-500">{project.overdue_issues}</span>
          </span>
        )}
      </div>

      {/* Budget (if available) */}
      {project.budget_allocated != null && project.budget_allocated > 0 && (
        <p className="mb-1 text-xs text-text-secondary">
          Budget: {formatCurrency(project.budget_spent ?? 0)} /{' '}
          {formatCurrency(project.budget_allocated)}
        </p>
      )}

      {/* Lead avatar */}
      <div className="mt-0.5 flex items-center gap-1">
        {project.lead_avatar_url ? (
          <img
            src={project.lead_avatar_url}
            alt={project.lead_name ?? 'Lead'}
            className="h-6 w-6 rounded-full object-cover"
          />
        ) : (
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-200 text-xs font-medium text-text-secondary">
            {project.lead_name ? project.lead_name.charAt(0).toUpperCase() : '?'}
          </span>
        )}
        <span className="text-xs text-text-secondary">
          {project.lead_name ?? 'Unassigned'}
        </span>
      </div>
    </div>
  )
}
