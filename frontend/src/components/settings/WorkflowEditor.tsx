import { useState, useCallback, useEffect } from 'react'
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
import { Plus, Save, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Button } from '@/components/ui/Button'
import { Dialog, DialogFooter } from '@/components/ui/Dialog'
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

const selectClasses =
  'w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 dark:bg-dark-surface dark:border-dark-border'

const inputClasses =
  'w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 dark:bg-dark-surface dark:border-dark-border'

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
  const [toast, setToast] = useState<{ visible: boolean; message: string; severity: 'success' | 'error' }>({
    visible: false,
    message: '',
    severity: 'success',
  })

  // Auto-dismiss toast after 3s
  useEffect(() => {
    if (!toast.visible) return
    const timer = setTimeout(() => setToast((prev) => ({ ...prev, visible: false })), 3000)
    return () => clearTimeout(timer)
  }, [toast.visible])

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

  // Connect handler -- drag from source handle to target handle
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
          setToast({ visible: true, message: 'Workflow saved successfully.', severity: 'success' })
        },
        onError: () => {
          setToast({ visible: true, message: 'Failed to save workflow.', severity: 'error' })
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
      <div className="flex flex-col gap-4">
        <div className="skeleton-shimmer h-12 rounded-lg" />
        <div className="skeleton-shimmer h-[400px] rounded-lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
        Failed to load workflow. Please try again.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-text-primary">Workflow Editor</h2>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setAddStatusOpen(true)}
          >
            Add Status
          </Button>
          <Button
            variant="primary"
            leftIcon={<Save className="h-4 w-4" />}
            onClick={handleSave}
            disabled={saveWorkflow.isPending}
            loading={saveWorkflow.isPending}
          >
            {saveWorkflow.isPending ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      <p className="text-sm text-text-secondary">
        Drag between node handles to create transitions. Select a node or edge and press Delete to remove it.
      </p>

      <div
        className="w-full h-[500px] border border-surface-200 rounded-lg overflow-hidden"
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
      </div>

      {/* Add Status Dialog */}
      <Dialog
        open={addStatusOpen}
        onClose={() => setAddStatusOpen(false)}
        title="Add Status"
        size="sm"
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Status Name
            </label>
            <input
              type="text"
              className={inputClasses}
              value={statusForm.name}
              onChange={(e) => setStatusForm((prev) => ({ ...prev, name: e.target.value }))}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Category
            </label>
            <select
              className={selectClasses}
              value={statusForm.category}
              onChange={(e) =>
                setStatusForm((prev) => ({
                  ...prev,
                  category: e.target.value as WorkflowStatus['category'],
                }))
              }
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {CATEGORY_LABELS[cat]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <p className="text-sm text-text-secondary mb-2">Color</p>
            <div className="flex flex-wrap gap-2">
              {STATUS_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setStatusForm((prev) => ({ ...prev, color: c }))}
                  className={cn(
                    'w-8 h-8 rounded-full cursor-pointer transition-all hover:opacity-80',
                    statusForm.color === c
                      ? 'ring-2 ring-primary-500 ring-offset-2'
                      : 'ring-2 ring-transparent'
                  )}
                  style={{ backgroundColor: c }}
                  aria-label={`Select color ${c}`}
                />
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setAddStatusOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleAddStatus}
            disabled={!statusForm.name.trim()}
          >
            Add
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Toast notification for save feedback */}
      {toast.visible && (
        <div
          className={cn(
            'fixed bottom-6 left-1/2 -translate-x-1/2 z-50',
            'flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm text-white',
            toast.severity === 'success' ? 'bg-green-600' : 'bg-red-600'
          )}
        >
          <span>{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast((prev) => ({ ...prev, visible: false }))}
            className="ml-2 hover:opacity-80"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}
