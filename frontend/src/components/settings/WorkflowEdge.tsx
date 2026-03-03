import { useState, useCallback, memo } from 'react'
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from '@xyflow/react'
import { X } from 'lucide-react'

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
        <div
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          className="absolute flex items-center gap-1"
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
        >
          {edgeData?.label && (
            <span className="text-xs bg-white dark:bg-dark-surface px-2 py-0.5 rounded border border-surface-200 whitespace-nowrap">
              {edgeData.label}
            </span>
          )}

          {hovered && (
            <button
              type="button"
              onClick={handleDelete}
              className="flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
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
