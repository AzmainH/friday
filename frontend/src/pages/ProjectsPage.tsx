import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Plus, FolderKanban } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Button } from '@/components/ui/Button'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import client from '@/api/client'
import { RAG_COLORS, formatDate } from '@/utils/formatters'

interface Project {
  id: string
  name: string
  key_prefix: string
  description: string | null
  status: string
  rag_status: string
  lead_id: string | null
  start_date: string | null
  target_end_date: string | null
  created_at: string
}

export default function ProjectsPage() {
  const navigate = useNavigate()

  const { data, isLoading, error } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data: res } = await client.get('/projects', {
        params: { workspace_id: 'default', include_count: true },
      })
      const items = res?.data ?? res
      return Array.isArray(items) ? items : []
    },
  })

  const projects: Project[] = data ?? []

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Projects</h1>
        <Button onClick={() => navigate('/projects/new')}>
          <Plus size={16} className="mr-1.5" />
          Create Project
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-[--radius-sm] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to load projects: {(error as Error).message}
        </div>
      )}

      {/* Loading */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }, (_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : projects.length === 0 ? (
        /* Empty state */
        <EmptyState
          icon={FolderKanban}
          title="No projects yet"
          description="Create your first project to start tracking issues, sprints, and milestones."
          action={
            <Button onClick={() => navigate('/projects/new')}>
              <Plus size={16} className="mr-1.5" />
              Create Your First Project
            </Button>
          }
        />
      ) : (
        /* Project cards */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => {
            const ragColor = RAG_COLORS[project.rag_status] ?? RAG_COLORS.none
            return (
              <div
                key={project.id}
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/projects/${project.id}/board`)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    navigate(`/projects/${project.id}/board`)
                  }
                }}
                className={cn(
                  'bg-white dark:bg-surface-100',
                  'rounded-[--radius-md] shadow-[--shadow-sm]',
                  'border border-surface-200 border-l-4',
                  'p-5 cursor-pointer',
                  'hover:shadow-[--shadow-md] hover:-translate-y-0.5',
                  'transition-all duration-200',
                )}
                style={{ borderLeftColor: ragColor }}
              >
                {/* Title + status */}
                <div className="flex items-center gap-2 mb-1">
                  <span className="flex-1 text-sm font-semibold text-text-primary truncate">
                    {project.name}
                  </span>
                  <span
                    className={cn(
                      'inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full capitalize',
                      project.status === 'active' && 'bg-primary-50 text-primary-700',
                      project.status === 'completed' && 'bg-green-50 text-green-700',
                      project.status === 'planning' && 'bg-secondary-50 text-secondary-700',
                      !['active', 'completed', 'planning'].includes(project.status) &&
                        'bg-surface-50 text-text-secondary',
                    )}
                  >
                    {project.status}
                  </span>
                </div>

                {/* Key prefix */}
                <span className="text-xs font-semibold text-primary-500">
                  {project.key_prefix}
                </span>

                {/* Description */}
                {project.description && (
                  <p className="mt-2 text-sm text-text-secondary line-clamp-2">
                    {project.description}
                  </p>
                )}

                {/* Dates */}
                <div className="mt-3 flex gap-4">
                  {project.start_date && (
                    <span className="text-xs text-text-tertiary">
                      Start: {formatDate(project.start_date)}
                    </span>
                  )}
                  {project.target_end_date && (
                    <span className="text-xs text-text-tertiary">
                      Target: {formatDate(project.target_end_date)}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
