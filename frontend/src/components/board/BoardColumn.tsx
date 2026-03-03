import { Plus } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useDroppable } from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Issue, WorkflowStatus } from '@/types/api'
import { STATUS_CATEGORY_COLORS } from '@/utils/formatters'
import BoardCard from '@/components/board/BoardCard'

interface BoardColumnProps {
  status: WorkflowStatus
  issues: Issue[]
  onAddIssue: () => void
}

/**
 * Wrapper that makes an individual card sortable within and across columns.
 */
function SortableCard({ issue }: { issue: Issue }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: issue.id,
    data: {
      type: 'issue',
      issue,
      statusId: issue.status_id,
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <BoardCard issue={issue} isDragging={isDragging} />
    </div>
  )
}

export default function BoardColumn({ status, issues, onAddIssue }: BoardColumnProps) {
  const categoryColor = STATUS_CATEGORY_COLORS[status.category] ?? status.color

  // Make the column body a droppable target so cards can be dragged into empty columns
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${status.id}`,
    data: {
      type: 'column',
      statusId: status.id,
    },
  })

  return (
    <div
      className={cn(
        'flex flex-col min-w-[280px] max-w-[320px] w-[280px] shrink-0 rounded-[--radius-md] border overflow-hidden bg-surface-50 dark:bg-surface-100 transition-colors',
        isOver ? 'border-primary-400' : 'border-surface-200',
      )}
    >
      {/* Column header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-surface-200 bg-white dark:bg-surface-100">
        {/* Status color indicator */}
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ backgroundColor: categoryColor }}
        />

        {/* Status name */}
        <span className="text-sm font-semibold text-text-primary flex-1 truncate">
          {status.name}
        </span>

        {/* Issue count badge */}
        <span className="text-xs text-text-secondary font-medium min-w-[20px] text-center">
          {issues.length}
        </span>

        {/* Add issue button */}
        <button
          onClick={onAddIssue}
          aria-label={`Add issue to ${status.name}`}
          className="p-1 rounded-[--radius-sm] text-text-tertiary hover:text-primary-500 hover:bg-surface-100 transition-colors"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Column body — scrollable list of cards */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 overflow-y-auto p-2 flex flex-col gap-2 min-h-[100px] transition-colors',
          isOver ? 'bg-primary-50/30 dark:bg-primary-900/10' : '',
        )}
      >
        <SortableContext
          items={issues.map((i) => i.id)}
          strategy={verticalListSortingStrategy}
        >
          {issues.map((issue) => (
            <SortableCard key={issue.id} issue={issue} />
          ))}
        </SortableContext>

        {issues.length === 0 && (
          <div className="flex items-center justify-center py-6">
            <span className="text-xs text-text-tertiary">No issues</span>
          </div>
        )}
      </div>
    </div>
  )
}
