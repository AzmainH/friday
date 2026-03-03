import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'

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

      <Box
        sx={{
          minWidth: 160,
          borderRadius: 2,
          border: selected ? '2px solid' : '1px solid',
          borderColor: selected ? 'primary.main' : 'divider',
          bgcolor: 'background.paper',
          overflow: 'hidden',
          boxShadow: selected ? 3 : 1,
          transition: 'box-shadow 0.2s, border-color 0.2s',
        }}
      >
        {/* Color indicator bar at top */}
        <Box
          sx={{
            height: 4,
            bgcolor: nodeData.color || '#9e9e9e',
          }}
        />

        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle2" fontWeight={600} noWrap>
            {nodeData.label}
          </Typography>

          <Chip
            label={categoryLabels[nodeData.category] ?? nodeData.category}
            size="small"
            sx={{
              mt: 0.5,
              height: 20,
              fontSize: '0.7rem',
              bgcolor: catStyle.bg,
              color: catStyle.text,
              fontWeight: 600,
            }}
          />
        </Box>
      </Box>

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
