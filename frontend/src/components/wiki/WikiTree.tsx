import { useState, useCallback, useMemo, type DragEvent } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Button from '@mui/material/Button'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Skeleton from '@mui/material/Skeleton'
import Collapse from '@mui/material/Collapse'
import Tooltip from '@mui/material/Tooltip'
import TextField from '@mui/material/TextField'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import ArticleIcon from '@mui/icons-material/Article'
import AddIcon from '@mui/icons-material/Add'
import PostAddIcon from '@mui/icons-material/PostAdd'
import DeleteIcon from '@mui/icons-material/Delete'
import DragIndicatorIcon from '@mui/icons-material/DragIndicator'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import MoreVertIcon from '@mui/icons-material/MoreVert'
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
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null)
  const hasChildren = node.children.length > 0
  const isExpanded = expanded.has(node.id)
  const isSelected = node.id === currentPageId

  return (
    <>
      <Box
        draggable
        onDragStart={(e) => onDragStart(e, node.id)}
        onDragOver={onDragOver}
        onDrop={(e) => onDrop(e, node.id)}
        onClick={() => onPageSelect(node.id)}
        onContextMenu={(e) => {
          e.preventDefault()
          setMenuAnchor(e.currentTarget as HTMLElement)
        }}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          pl: 1 + depth * 2,
          pr: 0.5,
          py: 0.5,
          cursor: 'pointer',
          borderRadius: 1,
          bgcolor: isSelected ? 'action.selected' : 'transparent',
          '&:hover': {
            bgcolor: isSelected ? 'action.selected' : 'action.hover',
          },
          '&:hover .tree-actions': {
            opacity: 1,
          },
          userSelect: 'none',
        }}
      >
        <DragIndicatorIcon
          sx={{ fontSize: 16, color: 'text.disabled', cursor: 'grab', flexShrink: 0 }}
        />

        {hasChildren ? (
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation()
              toggleExpand(node.id)
            }}
            sx={{ p: 0.25 }}
          >
            {isExpanded ? (
              <ExpandMoreIcon sx={{ fontSize: 18 }} />
            ) : (
              <ChevronRightIcon sx={{ fontSize: 18 }} />
            )}
          </IconButton>
        ) : (
          <Box sx={{ width: 26 }} />
        )}

        <ArticleIcon sx={{ fontSize: 18, color: 'text.secondary', flexShrink: 0 }} />

        <Typography
          variant="body2"
          noWrap
          sx={{
            flex: 1,
            fontWeight: isSelected ? 600 : 400,
            color: isSelected ? 'primary.main' : 'text.primary',
          }}
        >
          {node.title}
        </Typography>

        <Box
          className="tree-actions"
          sx={{ opacity: 0, display: 'flex', transition: 'opacity 0.15s' }}
        >
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation()
              setMenuAnchor(e.currentTarget)
            }}
            sx={{ p: 0.25 }}
          >
            <MoreVertIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>

        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={() => setMenuAnchor(null)}
          onClick={(e) => e.stopPropagation()}
        >
          <MenuItem
            onClick={() => {
              setMenuAnchor(null)
              onCreateChild(node.id)
            }}
          >
            <ListItemIcon>
              <PostAddIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>New child page</ListItemText>
          </MenuItem>
          {index > 0 && (
            <MenuItem
              onClick={() => {
                setMenuAnchor(null)
                onMoveUp(node.id)
              }}
            >
              <ListItemIcon>
                <ArrowUpwardIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Move up</ListItemText>
            </MenuItem>
          )}
          {index < siblings.length - 1 && (
            <MenuItem
              onClick={() => {
                setMenuAnchor(null)
                onMoveDown(node.id)
              }}
            >
              <ListItemIcon>
                <ArrowDownwardIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Move down</ListItemText>
            </MenuItem>
          )}
          <MenuItem
            onClick={() => {
              setMenuAnchor(null)
              onDelete(node.id, node.title)
            }}
            sx={{ color: 'error.main' }}
          >
            <ListItemIcon>
              <DeleteIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Delete</ListItemText>
          </MenuItem>
        </Menu>
      </Box>

      {hasChildren && (
        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
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
        </Collapse>
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
      const { siblings, index, parentId } = findSiblingsAndIndex(nodeId)
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
      <Box sx={{ p: 1 }}>
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} variant="text" width={`${70 - i * 5}%`} height={28} sx={{ ml: 1 }} />
        ))}
      </Box>
    )
  }

  const pages = tree ?? []

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 1.5,
          py: 1,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography variant="subtitle2" color="text.secondary" sx={{ textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: 1 }}>
          Pages
        </Typography>
        <Tooltip title="New page">
          <IconButton size="small" onClick={() => handleCreateChild(null)}>
            <AddIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Tree */}
      <Box sx={{ flex: 1, overflow: 'auto', py: 0.5 }}>
        {pages.length === 0 ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              No pages yet
            </Typography>
            <Button
              size="small"
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => handleCreateChild(null)}
            >
              Create first page
            </Button>
          </Box>
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
      </Box>

      {/* New page dialog */}
      <Dialog
        open={newPageDialog.open}
        onClose={() => setNewPageDialog({ open: false, parentId: null })}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          {newPageDialog.parentId ? 'New child page' : 'New page'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            size="small"
            label="Page title"
            value={newPageTitle}
            onChange={(e) => setNewPageTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateSubmit()
            }}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewPageDialog({ open: false, parentId: null })} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleCreateSubmit}
            variant="contained"
            disabled={!newPageTitle.trim() || createPage.isPending}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete page</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Are you sure you want to delete &quot;{deleteTarget?.title}&quot;? This will also delete
            all child pages. This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={confirmDelete}
            variant="contained"
            color="error"
            disabled={deletePage.isPending}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
