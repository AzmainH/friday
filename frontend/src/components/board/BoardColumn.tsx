import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import AddIcon from '@mui/icons-material/Add'
import { useTheme } from '@mui/material/styles'
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
    <Box ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <BoardCard issue={issue} isDragging={isDragging} />
    </Box>
  )
}

export default function BoardColumn({ status, issues, onAddIssue }: BoardColumnProps) {
  const theme = useTheme()
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
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minWidth: 280,
        maxWidth: 320,
        width: 280,
        flexShrink: 0,
        bgcolor: 'background.default',
        borderRadius: 2,
        border: '1px solid',
        borderColor: isOver ? 'primary.light' : 'divider',
        transition: 'border-color 0.2s',
        overflow: 'hidden',
      }}
    >
      {/* Column header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 1.5,
          py: 1.25,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        {/* Status color indicator */}
        <Box
          sx={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            bgcolor: categoryColor,
            flexShrink: 0,
          }}
        />

        {/* Status name */}
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 600,
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {status.name}
        </Typography>

        {/* Issue count badge */}
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
            fontWeight: 500,
            minWidth: 20,
            textAlign: 'center',
          }}
        >
          {issues.length}
        </Typography>

        {/* Add issue button */}
        <IconButton
          size="small"
          onClick={onAddIssue}
          aria-label={`Add issue to ${status.name}`}
          sx={{
            width: 24,
            height: 24,
            color: 'text.secondary',
            '&:hover': { color: 'primary.main' },
          }}
        >
          <AddIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Box>

      {/* Column body — scrollable list of cards */}
      <Box
        ref={setNodeRef}
        sx={{
          flex: 1,
          overflowY: 'auto',
          p: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          minHeight: 100,
          bgcolor: isOver
            ? theme.palette.action.hover
            : 'transparent',
          transition: 'background-color 0.2s',
        }}
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
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              py: 3,
              color: 'text.disabled',
            }}
          >
            <Typography variant="caption">No issues</Typography>
          </Box>
        )}
      </Box>
    </Box>
  )
}
