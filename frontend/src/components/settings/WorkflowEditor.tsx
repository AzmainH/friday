import { useState, useCallback, useMemo, useEffect } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  type Node,
  type Edge,
  type Connection,
  type NodeTypes,
  type EdgeTypes,
  MarkerType,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import Alert from '@mui/material/Alert'
import Skeleton from '@mui/material/Skeleton'
import Snackbar from '@mui/material/Snackbar'
import AddIcon from '@mui/icons-material/Add'
import SaveIcon from '@mui/icons-material/Save'
import WorkflowNode, { type WorkflowNodeData } from '@/components/settings/WorkflowNode'
import WorkflowEdge from '@/components/settings/WorkflowEdge'
import {
  useWorkflow,
  useSaveWorkflow,
  type WorkflowTransition,
} from '@/hooks/useProjectSettings'
import type { WorkflowStatus } from '@/types/api'

interface WorkflowEditorProps {
  projectId: string
}

const CATEGORIES: WorkflowStatus['category'][] = ['todo', 'in_progress', 'done']

const CATEGORY_LABELS: Record<string, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  done: 'Done',
}

const STATUS_COLORS = [
  '#42a5f5', '#66bb6a', '#ffa726', '#ef5350',
  '#ab47bc', '#26c6da', '#8d6e63', '#78909c',
]

interface StatusFormState {
  name: string
  category: WorkflowStatus['category']
  color: string
}

const EMPTY_STATUS_FORM: StatusFormState = {
  name: '',
  category: 'todo',
  color: '#42a5f5',
}

// Column X positions for each category to auto-layout
const CATEGORY_X: Record<string, number> = {
  todo: 50,
  in_progress: 350,
  done: 650,
}

const nodeTypes: NodeTypes = {
  workflowStatus: WorkflowNode,
}

const edgeTypes: EdgeTypes = {
  workflowTransition: WorkflowEdge,
}

/** Convert API statuses to React Flow nodes */
function statusesToNodes(statuses: WorkflowStatus[]): Node[] {
  const categoryCounters: Record<string, number> = { todo: 0, in_progress: 0, done: 0 }

  return statuses.map((s) => {
    const yOffset = categoryCounters[s.category] ?? 0
    categoryCounters[s.category] = yOffset + 1

    return {
      id: s.id,
      type: 'workflowStatus',
      position: {
        x: CATEGORY_X[s.category] ?? 50,
        y: 80 + yOffset * 120,
      },
      data: {
        label: s.name,
        category: s.category,
        color: s.color,
      } satisfies WorkflowNodeData,
    }
  })
}

/** Convert API transitions to React Flow edges */
function transitionsToEdges(
  transitions: WorkflowTransition[],
  onDelete: (edgeId: string) => void,
): Edge[] {
  return transitions.map((t) => ({
    id: t.id,
    source: t.from_status_id,
    target: t.to_status_id,
    type: 'workflowTransition',
    markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
    data: { label: t.name, onDelete },
  }))
}

export default function WorkflowEditor({ projectId }: WorkflowEditorProps) {
  const { data: workflow, isLoading, error } = useWorkflow(projectId)
  const saveWorkflow = useSaveWorkflow()

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])

  const [addStatusOpen, setAddStatusOpen] = useState(false)
  const [statusForm, setStatusForm] = useState<StatusFormState>(EMPTY_STATUS_FORM)
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  })

  // Callback for deleting an edge (passed into edge data)
  const handleDeleteEdge = useCallback(
    (edgeId: string) => {
      setEdges((eds) => eds.filter((e) => e.id !== edgeId))
    },
    [setEdges],
  )

  // Sync workflow data to nodes/edges on load
  useEffect(() => {
    if (!workflow) return
    setNodes(statusesToNodes(workflow.statuses ?? []))
    setEdges(transitionsToEdges(workflow.transitions ?? [], handleDeleteEdge))
  }, [workflow, setNodes, setEdges, handleDeleteEdge])

  // Connect handler — drag from source handle to target handle
  const onConnect = useCallback(
    (connection: Connection) => {
      const newEdge: Edge = {
        ...connection,
        id: `e-${connection.source}-${connection.target}-${Date.now()}`,
        type: 'workflowTransition',
        markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
        data: { label: '', onDelete: handleDeleteEdge },
      } as Edge
      setEdges((eds) => addEdge(newEdge, eds))
    },
    [setEdges, handleDeleteEdge],
  )

  // Delete selected nodes/edges on keyboard delete
  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Delete' || event.key === 'Backspace') {
        setNodes((nds) => nds.filter((n) => !n.selected))
        setEdges((eds) => eds.filter((e) => !e.selected))
      }
    },
    [setNodes, setEdges],
  )

  // Add a new status node
  const handleAddStatus = useCallback(() => {
    const newId = `status-${Date.now()}`
    const categoryCount = nodes.filter(
      (n) => (n.data as WorkflowNodeData).category === statusForm.category,
    ).length

    const newNode: Node = {
      id: newId,
      type: 'workflowStatus',
      position: {
        x: CATEGORY_X[statusForm.category] ?? 50,
        y: 80 + categoryCount * 120,
      },
      data: {
        label: statusForm.name,
        category: statusForm.category,
        color: statusForm.color,
      } satisfies WorkflowNodeData,
    }

    setNodes((nds) => [...nds, newNode])
    setAddStatusOpen(false)
    setStatusForm(EMPTY_STATUS_FORM)
  }, [statusForm, nodes, setNodes])

  // Save workflow to API
  const handleSave = useCallback(() => {
    if (!workflow) return

    const statuses: Partial<WorkflowStatus>[] = nodes.map((n, idx) => {
      const d = n.data as WorkflowNodeData
      return {
        // Preserve existing IDs; new nodes have temp IDs that the backend will handle
        id: n.id.startsWith('status-') ? undefined : n.id,
        name: d.label,
        category: d.category,
        color: d.color,
        sort_order: idx,
      }
    })

    const transitions: Partial<WorkflowTransition>[] = edges.map((e) => ({
      id: e.id.startsWith('e-') ? undefined : e.id,
      from_status_id: e.source,
      to_status_id: e.target,
      name: (e.data as { label?: string })?.label ?? '',
    }))

    saveWorkflow.mutate(
      {
        projectId,
        workflowId: workflow.id,
        body: { statuses, transitions },
      },
      {
        onSuccess: () => {
          setSnackbar({ open: true, message: 'Workflow saved successfully.', severity: 'success' })
        },
        onError: () => {
          setSnackbar({ open: true, message: 'Failed to save workflow.', severity: 'error' })
        },
      },
    )
  }, [workflow, nodes, edges, projectId, saveWorkflow])

  // MiniMap node color based on category
  const miniMapNodeColor = useCallback((node: Node) => {
    const d = node.data as WorkflowNodeData
    return d.color || '#999'
  }, [])

  if (isLoading) {
    return (
      <Stack spacing={2}>
        <Skeleton variant="rounded" height={48} />
        <Skeleton variant="rounded" height={400} />
      </Stack>
    )
  }

  if (error) {
    return <Alert severity="error">Failed to load workflow. Please try again.</Alert>
  }

  return (
    <Stack spacing={2}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Workflow Editor</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setAddStatusOpen(true)}
          >
            Add Status
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={saveWorkflow.isPending}
          >
            {saveWorkflow.isPending ? 'Saving...' : 'Save'}
          </Button>
        </Box>
      </Box>

      <Typography variant="body2" color="text.secondary">
        Drag between node handles to create transitions. Select a node or edge and press Delete to remove it.
      </Typography>

      <Box
        sx={{
          width: '100%',
          height: 500,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          overflow: 'hidden',
        }}
        onKeyDown={onKeyDown}
        tabIndex={0}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          deleteKeyCode={['Delete', 'Backspace']}
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={16} size={1} />
          <Controls />
          <MiniMap
            nodeColor={miniMapNodeColor}
            nodeStrokeWidth={3}
            zoomable
            pannable
          />
        </ReactFlow>
      </Box>

      {/* Add Status Dialog */}
      <Dialog open={addStatusOpen} onClose={() => setAddStatusOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Status</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="Status Name"
              value={statusForm.name}
              onChange={(e) => setStatusForm((prev) => ({ ...prev, name: e.target.value }))}
              fullWidth
              autoFocus
            />

            <TextField
              select
              label="Category"
              value={statusForm.category}
              onChange={(e) =>
                setStatusForm((prev) => ({
                  ...prev,
                  category: e.target.value as WorkflowStatus['category'],
                }))
              }
              fullWidth
            >
              {CATEGORIES.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {CATEGORY_LABELS[cat]}
                </MenuItem>
              ))}
            </TextField>

            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Color
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {STATUS_COLORS.map((c) => (
                  <Box
                    key={c}
                    onClick={() => setStatusForm((prev) => ({ ...prev, color: c }))}
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      bgcolor: c,
                      cursor: 'pointer',
                      border: statusForm.color === c ? '3px solid' : '2px solid transparent',
                      borderColor: statusForm.color === c ? 'primary.main' : 'transparent',
                      transition: 'border-color 0.2s',
                      '&:hover': { opacity: 0.8 },
                    }}
                  />
                ))}
              </Box>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setAddStatusOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleAddStatus}
            disabled={!statusForm.name.trim()}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for save feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Stack>
  )
}
