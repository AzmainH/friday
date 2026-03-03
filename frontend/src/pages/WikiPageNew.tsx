import { useState, useCallback, useMemo } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Breadcrumbs from '@mui/material/Breadcrumbs'
import Link from '@mui/material/Link'
import Skeleton from '@mui/material/Skeleton'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Collapse from '@mui/material/Collapse'
import AddIcon from '@mui/icons-material/Add'
import ArticleIcon from '@mui/icons-material/Article'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import SearchIcon from '@mui/icons-material/Search'
import CloseIcon from '@mui/icons-material/Close'
import WikiTree from '@/components/wiki/WikiTree'
import WikiEditor from '@/components/wiki/WikiEditor'
import WikiSearch from '@/components/wiki/WikiSearch'
import { useWikiSpaces, useWikiPage, useWikiTree, useCreatePage } from '@/hooks/useWiki'
import { useOrgStore } from '@/stores/orgStore'
import type { WikiPage } from '@/types/api'
import type { WikiTreeNode } from '@/hooks/useWiki'

// ---------------------------------------------------------------------------
// Breadcrumb builder: find path from root to a node
// ---------------------------------------------------------------------------

function findBreadcrumbPath(
  nodes: WikiTreeNode[],
  targetId: string,
  path: { id: string; title: string }[] = [],
): { id: string; title: string }[] | null {
  for (const node of nodes) {
    const currentPath = [...path, { id: node.id, title: node.title }]
    if (node.id === targetId) return currentPath
    const childResult = findBreadcrumbPath(node.children, targetId, currentPath)
    if (childResult) return childResult
  }
  return null
}

// ---------------------------------------------------------------------------
// Welcome screen
// ---------------------------------------------------------------------------

function WelcomeScreen({ onCreatePage }: { onCreatePage: () => void }) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        minHeight: 400,
        textAlign: 'center',
        p: 4,
      }}
    >
      <MenuBookIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
      <Typography variant="h5" gutterBottom fontWeight={600}>
        Welcome to the Wiki
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 480 }}>
        Your team knowledge base. Create pages to document processes, decisions, and everything your
        team needs to know. Select a page from the tree on the left, or create a new one.
      </Typography>
      <Button variant="contained" startIcon={<AddIcon />} onClick={onCreatePage}>
        Create your first page
      </Button>
    </Box>
  )
}

// ---------------------------------------------------------------------------
// WikiPageNew (main layout)
// ---------------------------------------------------------------------------

export default function WikiPageNew() {
  const currentWorkspaceId = useOrgStore((s) => s.currentWorkspaceId)
  const { data: spaces, isLoading: spacesLoading } = useWikiSpaces(currentWorkspaceId)

  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null)
  const [currentPageId, setCurrentPageId] = useState<string | null>(null)
  const [showSearch, setShowSearch] = useState(false)

  const createPage = useCreatePage()

  // Auto-select first space
  const spaceId = selectedSpaceId ?? spaces?.[0]?.id ?? null
  const selectedSpace = spaces?.find((s) => s.id === spaceId) ?? null

  const { data: currentPage, isLoading: pageLoading } = useWikiPage(currentPageId)
  const { data: tree } = useWikiTree(spaceId)

  // Build breadcrumbs
  const breadcrumbs = useMemo(() => {
    if (!currentPageId || !tree) return []
    return findBreadcrumbPath(tree, currentPageId) ?? []
  }, [currentPageId, tree])

  const handlePageSelect = useCallback((pageId: string) => {
    setCurrentPageId(pageId)
    setShowSearch(false)
  }, [])

  const handleSave = useCallback((_updatedPage: WikiPage) => {
    // Page saved successfully - WikiEditor handles status display
  }, [])

  const handleCreateRootPage = useCallback(() => {
    if (!spaceId) return
    createPage.mutate(
      { spaceId, title: 'Untitled page', parentId: null },
      {
        onSuccess: (page) => {
          setCurrentPageId(page.id)
        },
      },
    )
  }, [spaceId, createPage])

  const handleSearchSelect = useCallback((pageId: string) => {
    setCurrentPageId(pageId)
    setShowSearch(false)
  }, [])

  // Loading state
  if (spacesLoading) {
    return (
      <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)' }}>
        <Box sx={{ width: 250, borderRight: '1px solid', borderColor: 'divider', p: 2 }}>
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} variant="text" width="80%" height={24} sx={{ mb: 1 }} />
          ))}
        </Box>
        <Box sx={{ flex: 1, p: 4 }}>
          <Skeleton variant="text" width="40%" height={40} />
          <Skeleton variant="rectangular" width="100%" height={300} sx={{ mt: 2, borderRadius: 1 }} />
        </Box>
      </Box>
    )
  }

  // No spaces state
  if (!spaces || spaces.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: 'calc(100vh - 64px)',
          textAlign: 'center',
          p: 4,
        }}
      >
        <Box>
          <MenuBookIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h5" gutterBottom fontWeight={600}>
            No wiki spaces yet
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Wiki spaces will appear here once they are created for this workspace.
          </Typography>
        </Box>
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)' }}>
      {/* Left sidebar */}
      <Box
        sx={{
          width: 250,
          flexShrink: 0,
          borderRight: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: 'background.default',
        }}
      >
        {/* Space selector */}
        {spaces.length > 1 && (
          <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
            <FormControl fullWidth size="small">
              <InputLabel id="wiki-space-select-label">Space</InputLabel>
              <Select
                labelId="wiki-space-select-label"
                value={spaceId ?? ''}
                label="Space"
                onChange={(e) => {
                  setSelectedSpaceId(e.target.value)
                  setCurrentPageId(null)
                }}
              >
                {spaces.map((space) => (
                  <MenuItem key={space.id} value={space.id}>
                    {space.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        )}

        {/* Tree */}
        {spaceId && (
          <WikiTree
            spaceId={spaceId}
            currentPageId={currentPageId}
            onPageSelect={handlePageSelect}
          />
        )}
      </Box>

      {/* Main content */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top bar */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 3,
            py: 1,
            borderBottom: '1px solid',
            borderColor: 'divider',
            minHeight: 48,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, flex: 1 }}>
            {/* Breadcrumbs */}
            {breadcrumbs.length > 0 ? (
              <Breadcrumbs
                separator={<NavigateNextIcon sx={{ fontSize: 16 }} />}
                sx={{ '& .MuiBreadcrumbs-li': { minWidth: 0 } }}
              >
                <Link
                  component="button"
                  variant="body2"
                  underline="hover"
                  color="text.secondary"
                  onClick={() => setCurrentPageId(null)}
                  sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                >
                  <MenuBookIcon sx={{ fontSize: 16 }} />
                  {selectedSpace?.name ?? 'Wiki'}
                </Link>
                {breadcrumbs.map((crumb, index) => {
                  const isLast = index === breadcrumbs.length - 1
                  return isLast ? (
                    <Typography
                      key={crumb.id}
                      variant="body2"
                      color="text.primary"
                      fontWeight={600}
                      noWrap
                    >
                      {crumb.title}
                    </Typography>
                  ) : (
                    <Link
                      key={crumb.id}
                      component="button"
                      variant="body2"
                      underline="hover"
                      color="text.secondary"
                      onClick={() => handlePageSelect(crumb.id)}
                      sx={{ maxWidth: 120 }}
                      noWrap
                    >
                      {crumb.title}
                    </Link>
                  )
                })}
              </Breadcrumbs>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <MenuBookIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary" fontWeight={600}>
                  {selectedSpace?.name ?? 'Wiki'}
                </Typography>
              </Box>
            )}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Tooltip title="Search">
              <IconButton size="small" onClick={() => setShowSearch(!showSearch)}>
                {showSearch ? <CloseIcon fontSize="small" /> : <SearchIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
            <Button
              size="small"
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleCreateRootPage}
              disabled={!spaceId}
            >
              New Page
            </Button>
          </Box>
        </Box>

        {/* Search bar (collapsible) */}
        <Collapse in={showSearch} timeout="auto">
          <Box sx={{ px: 3, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
            {spaceId && (
              <WikiSearch spaceId={spaceId} onPageSelect={handleSearchSelect} />
            )}
          </Box>
        </Collapse>

        {/* Content area */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
          {currentPageId && pageLoading ? (
            <Box>
              <Skeleton variant="text" width="40%" height={48} />
              <Skeleton variant="rectangular" width="100%" height={300} sx={{ mt: 2, borderRadius: 1 }} />
            </Box>
          ) : currentPage ? (
            <WikiEditor page={currentPage} onSave={handleSave} />
          ) : (
            <WelcomeScreen onCreatePage={handleCreateRootPage} />
          )}
        </Box>
      </Box>
    </Box>
  )
}
