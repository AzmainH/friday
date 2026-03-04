import { useState } from 'react'
import { ChevronRight, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/cn'
import type { TaskPreview } from '@/hooks/useDocumentImport'

interface WBSTreePreviewProps {
  tasks: TaskPreview[]
  maxVisible?: number
}

interface TreeNode {
  task: TaskPreview
  children: TreeNode[]
}

function buildTree(tasks: TaskPreview[]): TreeNode[] {
  const nodeMap = new Map<string, TreeNode>()
  const roots: TreeNode[] = []

  // Create nodes
  for (const task of tasks) {
    nodeMap.set(task.wbs, { task, children: [] })
  }

  // Link parent-child
  for (const task of tasks) {
    const node = nodeMap.get(task.wbs)!
    const parentWbs = getParentWbs(task.wbs)
    if (parentWbs && nodeMap.has(parentWbs)) {
      nodeMap.get(parentWbs)!.children.push(node)
    } else {
      roots.push(node)
    }
  }

  return roots
}

function getParentWbs(wbs: string): string | null {
  const parts = wbs.split('.')
  if (parts.length <= 1) return null
  return parts.slice(0, -1).join('.')
}

const STATUS_COLORS: Record<string, string> = {
  Complete: 'bg-green-100 text-green-700',
  Completed: 'bg-green-100 text-green-700',
  'In Progress': 'bg-blue-100 text-blue-700',
  Planned: 'bg-surface-100 text-text-secondary',
  'Not Started': 'bg-surface-100 text-text-secondary',
}

function TreeNodeRow({
  node,
  depth,
  defaultExpanded,
}: {
  node: TreeNode
  depth: number
  defaultExpanded: boolean
}) {
  const [expanded, setExpanded] = useState(defaultExpanded && depth < 2)
  const hasChildren = node.children.length > 0
  const statusClass = STATUS_COLORS[node.task.status] ?? 'bg-surface-100 text-text-secondary'

  return (
    <>
      <div
        className={cn(
          'flex items-center gap-2 py-1.5 px-2 rounded hover:bg-surface-50 text-sm',
          depth === 0 && 'font-semibold',
        )}
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
      >
        {hasChildren ? (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex-shrink-0 p-0.5 rounded hover:bg-surface-200"
          >
            {expanded ? (
              <ChevronDown className="h-3.5 w-3.5 text-text-secondary" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-text-secondary" />
            )}
          </button>
        ) : (
          <span className="w-4.5 flex-shrink-0" />
        )}

        <span className="text-xs font-mono text-text-tertiary w-14 flex-shrink-0">
          {node.task.wbs}
        </span>

        <span className="flex-1 truncate text-text-primary">{node.task.name}</span>

        <span
          className={cn(
            'inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium flex-shrink-0',
            statusClass,
          )}
        >
          {node.task.status}
        </span>

        {node.task.resource_names.length > 0 && (
          <span className="text-xs text-text-tertiary truncate max-w-[120px] flex-shrink-0">
            {node.task.resource_names[0]}
          </span>
        )}
      </div>

      {expanded &&
        node.children.map((child) => (
          <TreeNodeRow
            key={child.task.wbs}
            node={child}
            depth={depth + 1}
            defaultExpanded={defaultExpanded}
          />
        ))}
    </>
  )
}

export default function WBSTreePreview({ tasks, maxVisible = 100 }: WBSTreePreviewProps) {
  const displayTasks = tasks.slice(0, maxVisible)
  const tree = buildTree(displayTasks)
  const remaining = tasks.length - maxVisible

  return (
    <div className="border border-surface-200 rounded-[--radius-md] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-4 px-3 py-2 bg-surface-50 border-b border-surface-200 text-xs font-semibold text-text-secondary uppercase">
        <span className="w-4.5" />
        <span className="w-14">WBS</span>
        <span className="flex-1">Task Name</span>
        <span className="w-24 text-center">Status</span>
        <span className="w-[120px]">Resource</span>
      </div>

      {/* Tree */}
      <div className="max-h-[400px] overflow-y-auto">
        {tree.map((node) => (
          <TreeNodeRow key={node.task.wbs} node={node} depth={0} defaultExpanded={true} />
        ))}
      </div>

      {remaining > 0 && (
        <div className="px-3 py-2 text-xs text-text-tertiary bg-surface-50 border-t border-surface-200">
          ... and {remaining} more tasks
        </div>
      )}
    </div>
  )
}
