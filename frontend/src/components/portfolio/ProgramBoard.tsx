import { useMemo, useState, useCallback } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Grid from '@mui/material/Grid2'
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
    <Box ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <ProjectCard project={project} onClick={onClick} />
    </Box>
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
    <Box>
      {/* Summary bar */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          mb: 2,
          p: 1.5,
          borderRadius: 2,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          flexWrap: 'wrap',
        }}
      >
        <Typography variant="subtitle2">
          {summary.total_projects} project{summary.total_projects !== 1 ? 's' : ''}
        </Typography>

        {/* RAG chips */}
        {Object.entries(summary.by_rag).map(([rag, count]) =>
          count > 0 ? (
            <Chip
              key={rag}
              size="small"
              label={`${rag}: ${count}`}
              sx={{
                bgcolor: `${RAG_COLORS[rag] ?? RAG_COLORS.none}22`,
                color: RAG_COLORS[rag] ?? RAG_COLORS.none,
                fontWeight: 600,
              }}
            />
          ) : null,
        )}

        {/* Status chips */}
        {Object.entries(summary.by_status).map(([status, count]) =>
          count > 0 ? (
            <Chip key={status} size="small" label={`${status}: ${count}`} variant="outlined" />
          ) : null,
        )}

        <Box sx={{ flex: 1 }} />

        {/* Group toggle */}
        <ToggleButtonGroup
          size="small"
          value={groupBy}
          exclusive
          onChange={(_e, val: GroupBy | null) => {
            if (val) setGroupBy(val)
          }}
        >
          <ToggleButton value="status">By Status</ToggleButton>
          <ToggleButton value="rag">By RAG</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Grouped cards with drag-and-drop */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        {Array.from(groups.entries()).map(([groupKey, projects]) => {
          if (projects.length === 0) return null
          return (
            <Box key={groupKey} sx={{ mb: 3 }}>
              <Typography
                variant="overline"
                sx={{
                  mb: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  color: 'text.secondary',
                }}
              >
                {groupBy === 'rag' && (
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      bgcolor: RAG_COLORS[groupKey] ?? RAG_COLORS.none,
                    }}
                  />
                )}
                {GROUP_LABELS[groupKey] ?? groupKey} ({projects.length})
              </Typography>

              <SortableContext
                items={projects.map((p) => p.id)}
                strategy={rectSortingStrategy}
              >
                <Grid container spacing={2}>
                  {projects.map((project) => (
                    <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={project.id}>
                      <SortableProjectCard project={project} onClick={onProjectClick} />
                    </Grid>
                  ))}
                </Grid>
              </SortableContext>
            </Box>
          )
        })}
      </DndContext>
    </Box>
  )
}
