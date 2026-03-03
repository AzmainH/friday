import { useState, useCallback, useMemo, useRef, type DragEvent } from 'react'
import { Menu, MenuButton, MenuItems, MenuItem, Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Plus,
  FilePlus,
  Trash2,
  GripVertical,
  ArrowUp,
  ArrowDown,
  MoreVertical,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { useWikiTree, useCreatePage, useDeletePage, useMovePage } from '@/hooks/useWiki'
import type { WikiTreeNode } from '@/hooks/useWiki'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface WikiTreeProps {
  spaceId: string
  currentPageId: string | null
  onPageSelect: (pageId: string) => void
}

// ---------------------------------------------------------------------------
// Tree node component
// ---------------------------------------------------------------------------

interface TreeNodeProps {
  node: WikiTreeNode
  depth: number
  spaceId: string
  currentPageId: string | null
  expanded: Set<string>
  toggleExpand: (id: string) => void
  onPageSelect: (pageId: string) => void
  onCreateChild: (parentId: string) => void
  onDelete: (pageId: string, title: string) => void
  onDragStart: (e: DragEvent, nodeId: string) => void
  onDragOver: (e: DragEvent) => void
  onDrop: (e: DragEvent, targetId: string) => void
  siblings: WikiTreeNode[]
  index: number
  onMoveUp: (pageId: string) => void
  onMoveDown: (pageId: string) => void
}

function TreeNode({
  node,
  depth,
  spaceId,
  currentPageId,
  expanded,
  toggleExpand,
  onPageSelect,
  onCreateChild,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
  siblings,
  index,
  onMoveUp,
  onMoveDown,
}: TreeNodeProps) {
  const hasChildren = node.children.length > 0
  const isExpanded = expanded.has(node.id)
  const isSelected = node.id === currentPageId

  return (
    <>
      <div
        draggable
        onDragStart={(e) => onDragStart(e, node.id)}
        onDragOver={onDragOver}
        onDrop={(e) => onDrop(e, node.id)}
        onClick={() => onPageSelect(node.id)}
        className={cn(
          'group flex items-center gap-1 pr-1 py-1 cursor-pointer rounded-[var(--radius-sm)] select-none',
          isSelected
            ? 'bg-primary-50 dark:bg-primary-900/20'
            : 'hover:bg-surface-50',
        )}
        style={{ paddingLeft: `${8 + depth * 24}px` }}
      >
        <GripVertical
          size={16}
          className="shrink-0 cursor-grab text-text-tertiary"
        />

        {hasChildren ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              toggleExpand(node.id)
            }}
            className="p-0.5 rounded hover:bg-surface-100 transition-colors"
          >
            {isExpanded ? (
              <ChevronDown size={18} className="text-text-secondary" />
            ) : (
              <ChevronRight size={18} className="text-text-secondary" />
            )}
          </button>
        ) : (
          <span className="w-[26px]" />
        )}

        <FileText size={18} className="shrink-0 text-text-secondary" />

        <span
          className={cn(
            'flex-1 truncate text-sm',
            isSelected
              ? 'font-semibold text-primary-700'
              : 'text-text-primary',
          )}
        >
          {node.title}
        </span>

        <div className="flex opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          <Menu as="div" className="relative">
            <MenuButton
              as="button"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
              className="p-0.5 rounded hover:bg-surface-100 transition-colors"
            >
              <MoreVertical size={16} className="text-text-secondary" />
            </MenuButton>
            <MenuItems
              anchor="bottom end"
              className="z-50 w-48 rounded-[var(--radius-md)] bg-white dark:bg-surface-800 shadow-lg ring-1 ring-black/5 focus:outline-none py-1"
            >
              <MenuItem>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-text-primary data-[focus]:bg-surface-50"
                  onClick={(e) => {
                    e.stopPropagation()
                    onCreateChild(node.id)
                  }}
                >
                  <FilePlus size={16} className="text-text-secondary" />
                  New child page
                </button>
              </MenuItem>
              {index > 0 && (
                <MenuItem>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-text-primary data-[focus]:bg-surface-50"
                    onClick={(e) => {
                      e.stopPropagation()
                      onMoveUp(node.id)
                    }}
                  >
                    <ArrowUp size={16} className="text-text-secondary" />
                    Move up
                  </button>
                </MenuItem>
              )}
              {index < siblings.length - 1 && (
                <MenuItem>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-text-primary data-[focus]:bg-surface-50"
                    onClick={(e) => {
                      e.stopPropagation()
                      onMoveDown(node.id)
                    }}
                  >
                    <ArrowDown size={16} className="text-text-secondary" />
                    Move down
                  </button>
                </MenuItem>
              )}
              <MenuItem>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-red-600 data-[focus]:bg-surface-50"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(node.id, node.title)
                  }}
                >
                  <Trash2 size={16} className="text-red-500" />
                  Delete
                </button>
              </MenuItem>
            </MenuItems>
          </Menu>
        </div>
      </div>

      {hasChildren && (
        <div
          className={cn(
            'overflow-hidden transition-all duration-200',
            isExpanded ? 'max-h-[9999px]' : 'max-h-0',
          )}
        >
          {node.children.map((child, childIndex) => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              spaceId={spaceId}
              currentPageId={currentPageId}
              expanded={expanded}
              toggleExpand={toggleExpand}
              onPageSelect={onPageSelect}
              onCreateChild={onCreateChild}
              onDelete={onDelete}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDrop={onDrop}
              siblings={node.children}
              index={childIndex}
              onMoveUp={onMoveUp}
              onMoveDown={onMoveDown}
            />
          ))}
        </div>
      )}
    </>
  )
}

// ---------------------------------------------------------------------------
// WikiTree
// ---------------------------------------------------------------------------

export default function WikiTree({ spaceId, currentPageId, onPageSelect }: WikiTreeProps) {
  const { data: tree, isLoading } = useWikiTree(spaceId)
  const createPage = useCreatePage()
  const deletePage = useDeletePage()
  const movePage = useMovePage()

  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [newPageDialog, setNewPageDialog] = useState<{ open: boolean; parentId: string | null }>({
    open: false,
    parentId: null,
  })
  const [newPageTitle, setNewPageTitle] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null)
  const [draggedId, setDraggedId] = useState<string | null>(null)

  const titleInputRef = useRef<HTMLInputElement>(null)

  const toggleExpand = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  // Auto-expand ancestors of current page
  const nodeMap = useMemo(() => {
    const map = new Map<string, WikiTreeNode>()
    function walk(nodes: WikiTreeNode[]) {
      for (const node of nodes) {
        map.set(node.id, node)
        walk(node.children)
      }
    }
    if (tree) walk(tree)
    return map
  }, [tree])

  // Flatten tree to find siblings for move operations
  const findSiblingsAndIndex = useCallback(
    (nodeId: string): { siblings: WikiTreeNode[]; index: number; parentId: string | null } => {
      function search(
        nodes: WikiTreeNode[],
        parentId: string | null,
      ): { siblings: WikiTreeNode[]; index: number; parentId: string | null } | null {
        for (let i = 0; i < nodes.length; i++) {
          if (nodes[i].id === nodeId) {
            return { siblings: nodes, index: i, parentId }
          }
          const childResult = search(nodes[i].children, nodes[i].id)
          if (childResult) return childResult
        }
        return null
      }
      return search(tree ?? [], null) ?? { siblings: [], index: -1, parentId: null }
    },
    [tree],
  )

  const handleCreateChild = useCallback((parentId: string | null) => {
    setNewPageDialog({ open: true, parentId })
    setNewPageTitle('')
  }, [])

  const handleCreateSubmit = useCallback(() => {
    if (!newPageTitle.trim()) return
    createPage.mutate(
      {
        spaceId,
        title: newPageTitle.trim(),
        parentId: newPageDialog.parentId,
      },
      {
        onSuccess: (page) => {
          setNewPageDialog({ open: false, parentId: null })
          setNewPageTitle('')
          onPageSelect(page.id)
          // Expand parent so new child is visible
          if (newPageDialog.parentId) {
            setExpanded((prev) => new Set(prev).add(newPageDialog.parentId!))
          }
        },
      },
    )
  }, [newPageTitle, newPageDialog.parentId, spaceId, createPage, onPageSelect])

  const handleDelete = useCallback((id: string, title: string) => {
    setDeleteTarget({ id, title })
  }, [])

  const confirmDelete = useCallback(() => {
    if (!deleteTarget) return
    deletePage.mutate(
      { pageId: deleteTarget.id, spaceId },
      {
        onSuccess: () => {
          setDeleteTarget(null)
          if (currentPageId === deleteTarget.id) {
            // Select nothing if deleted page was current
          }
        },
      },
    )
  }, [deleteTarget, spaceId, deletePage, currentPageId])

  const handleMoveUp = useCallback(
    (nodeId: string) => {
      const { index, parentId } = findSiblingsAndIndex(nodeId)
      if (index <= 0) return
      movePage.mutate({
        pageId: nodeId,
        spaceId,
        newParentId: parentId,
        newSortOrder: index - 1,
      })
    },
    [findSiblingsAndIndex, spaceId, movePage],
  )

  const handleMoveDown = useCallback(
    (nodeId: string) => {
      const { siblings, index, parentId } = findSiblingsAndIndex(nodeId)
      if (index >= siblings.length - 1) return
      movePage.mutate({
        pageId: nodeId,
        spaceId,
        newParentId: parentId,
        newSortOrder: index + 1,
      })
    },
    [findSiblingsAndIndex, spaceId, movePage],
  )

  // Drag & drop handlers
  const handleDragStart = useCallback((e: DragEvent, nodeId: string) => {
    setDraggedId(nodeId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', nodeId)
  }, [])

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const handleDrop = useCallback(
    (e: DragEvent, targetId: string) => {
      e.preventDefault()
      const sourceId = draggedId
      if (!sourceId || sourceId === targetId) return

      // Move dragged node as child of target
      const targetNode = nodeMap.get(targetId)
      if (!targetNode) return

      movePage.mutate({
        pageId: sourceId,
        spaceId,
        newParentId: targetId,
        newSortOrder: targetNode.children.length,
      })

      // Expand the target so the moved node is visible
      setExpanded((prev) => new Set(prev).add(targetId))
      setDraggedId(null)
    },
    [draggedId, nodeMap, spaceId, movePage],
  )

  // Loading state
  if (isLoading) {
    return (
      <div className="p-2">
        {Array.from({ length: 6 }, (_, i) => (
          <div
            key={i}
            className="ml-2 mb-1 h-5 animate-pulse rounded bg-surface-100"
            style={{ width: `${70 - i * 5}%` }}
          />
        ))}
      </div>
    )
  }

  const pages = tree ?? []

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-surface-200">
        <span className="text-[0.7rem] font-medium uppercase tracking-wider text-text-secondary">
          Pages
        </span>
        <button
          type="button"
          title="New page"
          onClick={() => handleCreateChild(null)}
          className="p-1 rounded hover:bg-surface-100 transition-colors text-text-secondary"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-auto py-1">
        {pages.length === 0 ? (
          <div className="p-4 text-center">
            <p className="text-sm text-text-secondary mb-2">No pages yet</p>
            <button
              type="button"
              onClick={() => handleCreateChild(null)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-surface-300 rounded-[var(--radius-sm)] hover:bg-surface-50 transition-colors text-text-primary"
            >
              <Plus size={16} />
              Create first page
            </button>
          </div>
        ) : (
          pages.map((node, index) => (
            <TreeNode
              key={node.id}
              node={node}
              depth={0}
              spaceId={spaceId}
              currentPageId={currentPageId}
              expanded={expanded}
              toggleExpand={toggleExpand}
              onPageSelect={onPageSelect}
              onCreateChild={handleCreateChild}
              onDelete={handleDelete}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              siblings={pages}
              index={index}
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
            />
          ))
        )}
      </div>

      {/* New page dialog */}
      <Dialog
        open={newPageDialog.open}
        onClose={() => setNewPageDialog({ open: false, parentId: null })}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="w-full max-w-sm rounded-[var(--radius-md)] bg-white dark:bg-surface-800 shadow-xl">
            <DialogTitle className="text-lg font-semibold px-5 pt-5 pb-2 text-text-primary">
              {newPageDialog.parentId ? 'New child page' : 'New page'}
            </DialogTitle>
            <div className="px-5 pb-4">
              <input
                ref={titleInputRef}
                autoFocus
                type="text"
                placeholder="Page title"
                value={newPageTitle}
                onChange={(e) => setNewPageTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateSubmit()
                }}
                className="w-full mt-1 px-3 py-2 text-sm border border-surface-300 rounded-[var(--radius-sm)] bg-white dark:bg-surface-900 text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div className="flex justify-end gap-2 px-5 pb-5">
              <button
                type="button"
                onClick={() => setNewPageDialog({ open: false, parentId: null })}
                className="px-3 py-1.5 text-sm rounded-[var(--radius-sm)] text-text-secondary hover:bg-surface-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateSubmit}
                disabled={!newPageTitle.trim() || createPage.isPending}
                className="px-3 py-1.5 text-sm font-medium rounded-[var(--radius-sm)] bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Create
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="w-full max-w-sm rounded-[var(--radius-md)] bg-white dark:bg-surface-800 shadow-xl">
            <DialogTitle className="text-lg font-semibold px-5 pt-5 pb-2 text-text-primary">
              Delete page
            </DialogTitle>
            <div className="px-5 pb-4">
              <p className="text-sm text-text-secondary">
                Are you sure you want to delete &quot;{deleteTarget?.title}&quot;? This will also delete
                all child pages. This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-end gap-2 px-5 pb-5">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-3 py-1.5 text-sm rounded-[var(--radius-sm)] text-text-secondary hover:bg-surface-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deletePage.isPending}
                className="px-3 py-1.5 text-sm font-medium rounded-[var(--radius-sm)] bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Delete
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  )
}
