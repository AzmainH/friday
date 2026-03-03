import { useState, useCallback, useMemo } from 'react'
import { Plus, BookOpen, ChevronRight, Search, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Skeleton } from '@/components/ui/Skeleton'
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
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center p-8">
      <BookOpen className="h-16 w-16 text-text-tertiary mb-4" />
      <h2 className="text-xl font-semibold text-text-primary mb-2">
        Welcome to the Wiki
      </h2>
      <p className="text-sm text-text-secondary mb-6 max-w-[480px]">
        Your team knowledge base. Create pages to document processes, decisions, and everything your
        team needs to know. Select a page from the tree on the left, or create a new one.
      </p>
      <button
        type="button"
        onClick={onCreatePage}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-[--radius-sm] bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700 transition-colors"
      >
        <Plus className="h-4 w-4" />
        Create your first page
      </button>
    </div>
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
      <div className="flex h-[calc(100vh-64px)]">
        <div className="w-[250px] border-r border-surface-200 p-4">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} width="80%" height={20} rounded="sm" className="mb-2" />
          ))}
        </div>
        <div className="flex-1 p-8">
          <Skeleton width="40%" height={36} rounded="sm" />
          <Skeleton width="100%" height={300} rounded="sm" className="mt-4" />
        </div>
      </div>
    )
  }

  // No spaces state
  if (!spaces || spaces.length === 0) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)] text-center p-8">
        <div>
          <BookOpen className="h-16 w-16 text-text-tertiary mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-text-primary mb-2">
            No wiki spaces yet
          </h2>
          <p className="text-sm text-text-secondary">
            Wiki spaces will appear here once they are created for this workspace.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Left sidebar */}
      <div className="w-[250px] shrink-0 border-r border-surface-200 flex flex-col bg-white dark:bg-dark-surface">
        {/* Space selector */}
        {spaces.length > 1 && (
          <div className="p-3 border-b border-surface-200">
            <label htmlFor="wiki-space-select" className="sr-only">Space</label>
            <select
              id="wiki-space-select"
              value={spaceId ?? ''}
              onChange={(e) => {
                setSelectedSpaceId(e.target.value)
                setCurrentPageId(null)
              }}
              className="w-full text-sm border border-surface-200 rounded-[--radius-sm] px-3 py-1.5 bg-white dark:bg-dark-surface text-text-primary outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
            >
              {spaces.map((space) => (
                <option key={space.id} value={space.id}>
                  {space.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Tree */}
        {spaceId && (
          <WikiTree
            spaceId={spaceId}
            currentPageId={currentPageId}
            onPageSelect={handlePageSelect}
          />
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-2 border-b border-surface-200 min-h-[48px]">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {/* Breadcrumbs */}
            {breadcrumbs.length > 0 ? (
              <nav aria-label="Breadcrumb" className="flex items-center text-sm">
                <ol className="flex items-center gap-1">
                  <li className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setCurrentPageId(null)}
                      className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-primary-500 hover:underline transition-colors"
                    >
                      <BookOpen className="h-4 w-4" />
                      {selectedSpace?.name ?? 'Wiki'}
                    </button>
                  </li>
                  {breadcrumbs.map((crumb, index) => {
                    const isLast = index === breadcrumbs.length - 1
                    return (
                      <li key={crumb.id} className="flex items-center gap-1">
                        <ChevronRight className="h-3.5 w-3.5 text-text-tertiary shrink-0" aria-hidden="true" />
                        {isLast ? (
                          <span className="text-sm font-semibold text-text-primary truncate" aria-current="page">
                            {crumb.title}
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handlePageSelect(crumb.id)}
                            className="text-sm text-text-secondary hover:text-primary-500 hover:underline transition-colors truncate max-w-[120px]"
                          >
                            {crumb.title}
                          </button>
                        )}
                      </li>
                    )
                  })}
                </ol>
              </nav>
            ) : (
              <div className="flex items-center gap-1.5">
                <BookOpen className="h-4 w-4 text-text-secondary" />
                <span className="text-sm font-semibold text-text-secondary">
                  {selectedSpace?.name ?? 'Wiki'}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowSearch(!showSearch)}
              className="inline-flex items-center justify-center h-8 w-8 rounded-[--radius-sm] text-text-secondary hover:bg-surface-100 transition-colors"
              title="Search"
            >
              {showSearch ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={handleCreateRootPage}
              disabled={!spaceId}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-[--radius-sm] border border-surface-200 text-text-primary hover:bg-surface-50 disabled:opacity-50 disabled:pointer-events-none transition-colors"
            >
              <Plus className="h-4 w-4" />
              New Page
            </button>
          </div>
        </div>

        {/* Search bar (collapsible) */}
        <div
          className={cn(
            'overflow-hidden transition-all duration-200',
            showSearch ? 'max-h-[200px]' : 'max-h-0',
          )}
        >
          <div className="px-6 py-3 border-b border-surface-200">
            {spaceId && (
              <WikiSearch spaceId={spaceId} onPageSelect={handleSearchSelect} />
            )}
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-auto p-6">
          {currentPageId && pageLoading ? (
            <div>
              <Skeleton width="40%" height={40} rounded="sm" />
              <Skeleton width="100%" height={300} rounded="sm" className="mt-4" />
            </div>
          ) : currentPage ? (
            <WikiEditor page={currentPage} onSave={handleSave} />
          ) : (
            <WelcomeScreen onCreatePage={handleCreateRootPage} />
          )}
        </div>
      </div>
    </div>
  )
}
