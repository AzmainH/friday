import { useState, useCallback, useMemo } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Skeleton from '@mui/material/Skeleton'
import Alert from '@mui/material/Alert'
import ViewColumnIcon from '@mui/icons-material/ViewColumn'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import type { Issue } from '@/types/api'
import { useProjectStore } from '@/stores/projectStore'
import { useIssuesByStatus } from '@/hooks/useIssuesByStatus'
import { useMoveIssue } from '@/hooks/useIssueMutation'
import BoardColumn from '@/components/board/BoardColumn'
import DragOverlayCard from '@/components/board/DragOverlayCard'

/**
 * Main Kanban board page.
 *
 * Renders one column per workflow status (sorted by sort_order) with
 * drag-and-drop support for moving issues between columns. Uses
 * optimistic updates via useMoveIssue to keep the UI snappy.
 */
export default function BoardView() {
  const currentProject = useProjectStore((s) => s.currentProject)
  const statuses = useProjectStore((s) => s.statuses)

  const projectId = currentProject?.id
  const { columns, isLoading, error } = useIssuesByStatus(projectId)
  const moveIssue = useMoveIssue(projectId)

  // Track the currently-dragged issue for DragOverlay
  const [activeIssue, setActiveIssue] = useState<Issue | null>(null)

  // Sort statuses by sort_order for column rendering
  const sortedStatuses = useMemo(
    () => [...statuses].sort((a, b) => a.sort_order - b.sort_order),
    [statuses],
  )

  // Configure drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        // Require 5px of movement before starting drag to allow click-through
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  /**
   * When drag starts, find the active issue from the columns data
   * so we can render it inside DragOverlay.
   */
  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event
      const issueData = active.data.current
      if (issueData?.type === 'issue' && issueData.issue) {
        setActiveIssue(issueData.issue as Issue)
      }
    },
    [],
  )

  /**
   * When drag ends, determine the target column and new position,
   * then fire the optimistic mutation.
   */
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveIssue(null)

      const { active, over } = event
      if (!over) return

      const activeId = String(active.id)

      // Determine the target status_id
      let targetStatusId: string | null = null

      if (over.data.current?.type === 'column') {
        // Dropped on the column droppable area
        targetStatusId = over.data.current.statusId as string
      } else if (over.data.current?.type === 'issue') {
        // Dropped on another issue card — use that issue's status
        targetStatusId = (over.data.current.issue as Issue).status_id
      }

      if (!targetStatusId) return

      // Find current issue to check if the status actually changed or reordered
      let currentIssue: Issue | undefined
      for (const [, issues] of columns) {
        currentIssue = issues.find((i) => i.id === activeId)
        if (currentIssue) break
      }

      if (!currentIssue) return

      // Calculate the new sort_order based on the target column's existing issues
      const targetIssues = columns.get(targetStatusId) ?? []
      let newSortOrder: number

      if (over.data.current?.type === 'issue') {
        // Dropped on a specific issue — place after it
        const overIssue = over.data.current.issue as Issue
        const overIndex = targetIssues.findIndex((i) => i.id === overIssue.id)

        if (overIndex >= 0 && overIndex < targetIssues.length - 1) {
          // Place between the over issue and the next one
          const nextIssue = targetIssues[overIndex + 1]
          newSortOrder = (overIssue.sort_order + (nextIssue?.sort_order ?? overIssue.sort_order + 1000)) / 2
        } else {
          // Place after the last issue
          newSortOrder = overIssue.sort_order + 1000
        }
      } else {
        // Dropped on the column itself — place at the end
        const lastIssue = targetIssues[targetIssues.length - 1]
        newSortOrder = lastIssue ? lastIssue.sort_order + 1000 : 1000
      }

      // Skip mutation if nothing changed
      if (
        currentIssue.status_id === targetStatusId &&
        currentIssue.sort_order === newSortOrder
      ) {
        return
      }

      moveIssue.mutate({
        issueId: activeId,
        newStatusId: targetStatusId,
        newSortOrder,
      })
    },
    [columns, moveIssue],
  )

  const handleDragCancel = useCallback(() => {
    setActiveIssue(null)
  }, [])

  // Placeholder callback for the "+" button in column headers
  const handleAddIssue = useCallback((_statusId: string) => {
    // TODO: Open issue creation dialog pre-filled with the selected status
  }, [])

  // --- Empty state: no project selected ---
  if (!currentProject) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '60vh',
          gap: 2,
        }}
      >
        <ViewColumnIcon sx={{ fontSize: 64, color: 'text.disabled' }} />
        <Typography variant="h6" color="text.secondary">
          Select a project to view the board
        </Typography>
        <Typography variant="body2" color="text.disabled">
          Choose a project from the sidebar to see its Kanban board.
        </Typography>
      </Box>
    )
  }

  // --- Error state ---
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Failed to load board: {error.message}
        </Alert>
      </Box>
    )
  }

  // --- Loading skeleton ---
  if (isLoading) {
    return (
      <Box sx={{ p: 2 }}>
        {/* Board header skeleton */}
        <Skeleton variant="text" width={200} height={36} sx={{ mb: 2 }} />

        {/* Column skeletons */}
        <Box sx={{ display: 'flex', gap: 1.5, overflowX: 'auto' }}>
          {Array.from({ length: Math.max(statuses.length, 3) }, (_, i) => (
            <Box
              key={i}
              sx={{
                minWidth: 280,
                width: 280,
                flexShrink: 0,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                overflow: 'hidden',
              }}
            >
              {/* Column header skeleton */}
              <Box sx={{ px: 1.5, py: 1.25, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Skeleton variant="text" width="60%" height={24} />
              </Box>

              {/* Card skeletons */}
              <Box sx={{ p: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                {Array.from({ length: 3 - i }, (_, j) => (
                  <Skeleton
                    key={j}
                    variant="rectangular"
                    height={80}
                    sx={{ borderRadius: 1.5 }}
                  />
                ))}
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    )
  }

  // --- Main board ---
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Board header */}
      <Box sx={{ px: 2, pt: 2, pb: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Board
        </Typography>
      </Box>

      {/* Board columns (horizontally scrollable) */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            gap: 1.5,
            px: 2,
            pb: 2,
            overflowX: 'auto',
            overflowY: 'hidden',
            alignItems: 'flex-start',
          }}
        >
          {sortedStatuses.map((status) => (
            <BoardColumn
              key={status.id}
              status={status}
              issues={columns.get(status.id) ?? []}
              onAddIssue={() => handleAddIssue(status.id)}
            />
          ))}

          {sortedStatuses.length === 0 && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                py: 6,
              }}
            >
              <Typography variant="body1" color="text.secondary">
                No workflow statuses configured for this project.
              </Typography>
            </Box>
          )}
        </Box>

        {/* Drag overlay — rendered outside the normal flow */}
        <DragOverlay dropAnimation={null}>
          {activeIssue ? <DragOverlayCard issue={activeIssue} /> : null}
        </DragOverlay>
      </DndContext>
    </Box>
  )
}
