import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/cn'
import type { PortfolioProject } from '@/hooks/usePortfolio'

interface PortfolioHealthGridProps {
  projects: PortfolioProject[]
}

function ragBadge(rag: string) {
  switch (rag) {
    case 'green':
      return { bg: 'bg-emerald-100 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500' }
    case 'amber':
      return { bg: 'bg-amber-100 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-300', dot: 'bg-amber-500' }
    case 'red':
      return { bg: 'bg-red-100 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-300', dot: 'bg-red-500' }
    default:
      return { bg: 'bg-surface-100 dark:bg-surface-200', text: 'text-text-secondary', dot: 'bg-surface-400' }
  }
}

export default function PortfolioHealthGrid({ projects }: PortfolioHealthGridProps) {
  const navigate = useNavigate()

  if (!projects || projects.length === 0) {
    return (
      <div className="text-sm text-text-secondary py-8 text-center">
        No projects found.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {projects.map((project) => {
        const rag = ragBadge(project.rag_status)
        const progressPct = Math.min(project.progress_pct, 100)

        return (
          <div
            key={project.id}
            className="bg-white dark:bg-surface-100 rounded-[--radius-md] border border-surface-200 p-4 cursor-pointer hover:shadow-sm transition-shadow"
            onClick={() => navigate(`/projects/${project.id}/dashboard`)}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-text-primary truncate">
                  {project.name}
                </p>
                <p className="text-xs text-text-tertiary">{project.key_prefix}</p>
              </div>
              <span
                className={cn(
                  'flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full shrink-0',
                  rag.bg,
                  rag.text,
                )}
              >
                <span className={cn('w-1.5 h-1.5 rounded-full', rag.dot)} />
                {project.rag_status === 'none' ? 'N/A' : project.rag_status.toUpperCase()}
              </span>
            </div>

            {/* Progress bar */}
            <div className="mb-3">
              <div className="flex justify-between text-xs text-text-tertiary mb-1">
                <span>{progressPct}% complete</span>
                <span>
                  {project.completed_issues}/{project.total_issues}
                </span>
              </div>
              <div className="h-2 bg-surface-100 dark:bg-surface-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-500 rounded-full transition-all"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            {/* Stats */}
            <div className="flex justify-between text-xs">
              <span className="text-text-secondary">
                {project.overdue_issues > 0 && (
                  <span className="text-red-600 dark:text-red-400 font-medium">
                    {project.overdue_issues} overdue
                  </span>
                )}
                {project.overdue_issues === 0 && 'On track'}
              </span>
              {project.target_date && (
                <span className="text-text-tertiary">
                  Due {new Date(project.target_date).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
