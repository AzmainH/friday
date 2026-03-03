import { useState, useCallback, memo } from 'react'
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from '@xyflow/react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import CloseIcon from '@mui/icons-material/Close'

export interface WorkflowEdgeData {
  label?: string
  onDelete?: (edgeId: string) => void
  [key: string]: unknown
}

function WorkflowEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}: EdgeProps) {
  const [hovered, setHovered] = useState(false)

  const edgeData = data as WorkflowEdgeData | undefined

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  const handleDelete = useCallback(() => {
    edgeData?.onDelete?.(id)
  }, [id, edgeData])

  return (
    <>
      {/* Invisible wider path for hover detection */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      />

      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          strokeDasharray: '6 3',
          strokeWidth: hovered ? 2.5 : 1.5,
          stroke: hovered ? '#1976d2' : '#888',
          animation: 'dashmove 0.5s linear infinite',
          transition: 'stroke 0.2s, stroke-width 0.2s',
        }}
      />

      <EdgeLabelRenderer>
        <Box
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          sx={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
          }}
        >
          {edgeData?.label && (
            <Typography
              variant="caption"
              sx={{
                bgcolor: 'background.paper',
                px: 1,
                py: 0.25,
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider',
                fontSize: '0.7rem',
                whiteSpace: 'nowrap',
              }}
            >
              {edgeData.label}
            </Typography>
          )}

          {hovered && (
            <IconButton
              size="small"
              onClick={handleDelete}
              sx={{
                width: 20,
                height: 20,
                bgcolor: 'error.main',
                color: 'white',
                '&:hover': { bgcolor: 'error.dark' },
              }}
            >
              <CloseIcon sx={{ fontSize: 12 }} />
            </IconButton>
          )}
        </Box>
      </EdgeLabelRenderer>

      {/* CSS animation for dashed edge movement */}
      <style>{`
        @keyframes dashmove {
          to {
            stroke-dashoffset: -9;
          }
        }
      `}</style>
    </>
  )
}

export default memo(WorkflowEdge)
