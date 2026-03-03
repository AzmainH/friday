import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { cn } from '@/lib/cn'

export interface WorkflowNodeData {
  label: string
  category: 'todo' | 'in_progress' | 'done'
  color: string
  [key: string]: unknown
}

const categoryColors: Record<string, { bg: string; text: string }> = {
  todo: { bg: '#e3f2fd', text: '#1565c0' },
  in_progress: { bg: '#fff3e0', text: '#e65100' },
  done: { bg: '#e8f5e9', text: '#2e7d32' },
}

const categoryLabels: Record<string, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  done: 'Done',
}

function WorkflowNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as WorkflowNodeData
  const catStyle = categoryColors[nodeData.category] ?? categoryColors.todo

  return (
    <>
      <Handle
        type="target"
        position={Position.Left}
        style={{
          width: 10,
          height: 10,
          background: '#555',
          border: '2px solid #fff',
        }}
      />

      <div
        className={cn(
          'min-w-[160px] rounded-lg overflow-hidden bg-white dark:bg-dark-surface',
          'transition-shadow duration-200 transition-[border-color] duration-200',
          selected
            ? 'border-2 border-primary-500 shadow-lg'
            : 'border border-surface-200 shadow-sm'
        )}
      >
        {/* Color indicator bar at top */}
        <div
          className="h-1"
          style={{ backgroundColor: nodeData.color || '#9e9e9e' }}
        />

        <div className="px-3 py-2">
          <span className="text-sm font-semibold text-text-primary block truncate">
            {nodeData.label}
          </span>

          <span
            className="inline-block text-xs px-2 py-0.5 rounded-full mt-1 font-semibold"
            style={{
              backgroundColor: catStyle.bg,
              color: catStyle.text,
            }}
          >
            {categoryLabels[nodeData.category] ?? nodeData.category}
          </span>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        style={{
          width: 10,
          height: 10,
          background: '#555',
          border: '2px solid #fff',
        }}
      />
    </>
  )
}

export default memo(WorkflowNode)
