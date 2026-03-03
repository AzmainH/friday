import { useMemo, useState, useCallback } from 'react'
import { cn } from '@/lib/cn'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import ProjectCard from '@/components/portfolio/ProjectCard'
import type { PortfolioProject, PortfolioOverview } from '@/hooks/usePortfolio'
import { RAG_COLORS } from '@/utils/formatters'

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export interface ProgramBoardProps {
  overview: PortfolioOverview
  onProjectClick?: (projectId: string) => void
  onReorder?: (projectId: string, newIndex: number) => void
}

type GroupBy = 'status' | 'rag'

/* ------------------------------------------------------------------ */
/*  Sortable wrapper                                                   */
/* ------------------------------------------------------------------ */

function SortableProjectCard({
  project,
  onClick,
}: {
  project: PortfolioProject
  onClick?: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: project.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <ProjectCard project={project} onClick={onClick} />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Group helpers                                                      */
/* ------------------------------------------------------------------ */

const STATUS_ORDER = ['active', 'paused', 'completed', 'archived']
const RAG_ORDER = ['red', 'amber', 'green', 'none']

function groupProjects(projects: PortfolioProject[], groupBy: GroupBy) {
  const groups = new Map<string, PortfolioProject[]>()
  const order = groupBy === 'status' ? STATUS_ORDER : RAG_ORDER

  // Pre-create groups in order
  for (const key of order) {
    groups.set(key, [])
  }

  for (const p of projects) {
    const key = groupBy === 'status' ? p.status : p.rag_status
    const arr = groups.get(key)
    if (arr) {
      arr.push(p)
    } else {
      groups.set(key, [p])
    }
  }

  return groups
}

const GROUP_LABELS: Record<string, string> = {
  active: 'Active',
  paused: 'Paused',
  completed: 'Completed',
  archived: 'Archived',
  red: 'Red',
  amber: 'Amber',
  green: 'Green',
  none: 'None',
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function ProgramBoard({ overview, onProjectClick, onReorder }: ProgramBoardProps) {
  const [groupBy, setGroupBy] = useState<GroupBy>('status')

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const groups = useMemo(
    () => groupProjects(overview.projects, groupBy),
    [overview.projects, groupBy],
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id || !onReorder) return
      const allIds = overview.projects.map((p) => p.id)
      const newIndex = allIds.indexOf(over.id as string)
      if (newIndex >= 0) {
        onReorder(active.id as string, newIndex)
      }
    },
    [overview.projects, onReorder],
  )

  const { summary } = overview

  return (
    <div>
      {/* Summary bar */}
      <div className="mb-2 flex flex-wrap items-center gap-2 rounded-[--radius-sm] border border-surface-200 bg-white p-1.5 dark:bg-surface-50">
        <span className="text-sm font-semibold text-text-primary">
          {summary.total_projects} project{summary.total_projects !== 1 ? 's' : ''}
        </span>

        {/* RAG chips */}
        {Object.entries(summary.by_rag).map(([rag, count]) =>
          count > 0 ? (
            <span
              key={rag}
              className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold"
              style={{
                backgroundColor: `${RAG_COLORS[rag] ?? RAG_COLORS.none}22`,
                color: RAG_COLORS[rag] ?? RAG_COLORS.none,
              }}
            >
              {rag}: {count}
            </span>
          ) : null,
        )}

        {/* Status chips */}
        {Object.entries(summary.by_status).map(([status, count]) =>
          count > 0 ? (
            <span
              key={status}
              className="inline-flex items-center rounded-full border border-surface-200 px-2 py-0.5 text-xs text-text-secondary"
            >
              {status}: {count}
            </span>
          ) : null,
        )}

        <div className="flex-1" />

        {/* Group toggle */}
        <div className="inline-flex rounded-[--radius-sm] border border-surface-200 bg-surface-50 p-0.5">
          <button
            type="button"
            onClick={() => setGroupBy('status')}
            className={cn(
              'rounded px-3 py-1 text-sm transition-colors',
              groupBy === 'status'
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            )}
          >
            By Status
          </button>
          <button
            type="button"
            onClick={() => setGroupBy('rag')}
            className={cn(
              'rounded px-3 py-1 text-sm transition-colors',
              groupBy === 'rag'
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            )}
          >
            By RAG
          </button>
        </div>
      </div>

      {/* Grouped cards with drag-and-drop */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        {Array.from(groups.entries()).map(([groupKey, projects]) => {
          if (projects.length === 0) return null
          return (
            <div key={groupKey} className="mb-3">
              <span className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-text-secondary">
                {groupBy === 'rag' && (
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: RAG_COLORS[groupKey] ?? RAG_COLORS.none }}
                  />
                )}
                {GROUP_LABELS[groupKey] ?? groupKey} ({projects.length})
              </span>

              <SortableContext
                items={projects.map((p) => p.id)}
                strategy={rectSortingStrategy}
              >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {projects.map((project) => (
                    <SortableProjectCard
                      key={project.id}
                      project={project}
                      onClick={onProjectClick}
                    />
                  ))}
                </div>
              </SortableContext>
            </div>
          )
        })}
      </DndContext>
    </div>
  )
}
