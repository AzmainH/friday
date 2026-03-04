import { useState, useCallback, useMemo } from 'react'
import { Columns3 } from 'lucide-react'
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
import { EmptyState } from '@/components/ui/EmptyState'

/**
 * Main Kanban board page.
 *
 * Renders one column per workflow status (sorted by sort_order) with
 * drag-and-drop support for moving issues between columns. Uses
 * optimistic updates via useMoveIssue to keep the UI snappy.
 */
interface BoardViewProps {
  onAddIssue?: () => void
  onIssueClick?: (id: string) => void
}

export default function BoardView({ onAddIssue, onIssueClick }: BoardViewProps) {
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

  const handleAddIssue = useCallback((_statusId: string) => {
    onAddIssue?.()
  }, [onAddIssue])

  // --- Empty state: no project selected ---
  if (!currentProject) {
    return (
      <EmptyState
        icon={Columns3}
        title="Select a project to view the board"
        description="Choose a project from the sidebar to see its Kanban board."
        className="h-[60vh]"
      />
    )
  }

  // --- Error state ---
  if (error) {
    return (
      <div className="p-3">
        <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-[--radius-sm]">
          Failed to load board: {error.message}
        </div>
      </div>
    )
  }

  // --- Loading skeleton ---
  if (isLoading) {
    return (
      <div className="p-2">
        {/* Board header skeleton */}
        <div className="skeleton-shimmer h-9 w-[200px] rounded mb-2" />

        {/* Column skeletons */}
        <div className="flex gap-3 overflow-x-auto">
          {Array.from({ length: Math.max(statuses.length, 3) }, (_, i) => (
            <div
              key={i}
              className="min-w-[280px] w-[280px] shrink-0 rounded-[--radius-md] border border-surface-200 overflow-hidden"
            >
              {/* Column header skeleton */}
              <div className="px-3 py-2.5 border-b border-surface-200">
                <div className="skeleton-shimmer h-6 w-[60%] rounded" />
              </div>

              {/* Card skeletons */}
              <div className="p-2 flex flex-col gap-2">
                {Array.from({ length: 3 - i }, (_, j) => (
                  <div
                    key={j}
                    className="skeleton-shimmer h-20 rounded-[--radius-sm]"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // --- Main board ---
  return (
    <div className="h-full flex flex-col">
      {/* Board header */}
      <div className="px-4 pt-4 pb-2">
        <h2 className="text-lg font-semibold text-text-primary">Board</h2>
      </div>

      {/* Board columns (horizontally scrollable) */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="flex-1 flex gap-3 px-4 pb-4 overflow-x-auto overflow-y-hidden items-start">
          {sortedStatuses.map((status) => (
            <BoardColumn
              key={status.id}
              status={status}
              issues={columns.get(status.id) ?? []}
              onAddIssue={() => handleAddIssue(status.id)}
              onIssueClick={onIssueClick}
            />
          ))}

          {sortedStatuses.length === 0 && (
            <div className="flex items-center justify-center w-full py-6">
              <p className="text-base text-text-secondary">
                No workflow statuses configured for this project.
              </p>
            </div>
          )}
        </div>

        {/* Drag overlay — rendered outside the normal flow */}
        <DragOverlay dropAnimation={null}>
          {activeIssue ? <DragOverlayCard issue={activeIssue} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
