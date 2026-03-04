import { useState, useEffect, useCallback, useRef, useMemo, Fragment } from 'react'
import { useNavigate } from 'react-router-dom'
import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react'
import {
  Search, Bug, Folder, MessageSquare, FileText, History,
  Filter, Bookmark, BookmarkCheck, X, Star,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { useSearchStore } from '@/stores/searchStore'
import { useGlobalSearch, type SearchResult } from '@/hooks/useGlobalSearch'
import {
  useRecentSearches,
  useSavedSearches,
  type SearchFilters,
} from '@/hooks/useAdvancedSearch'

const ENTITY_TYPE_LABELS: Record<string, string> = {
  issue: 'Issues',
  project: 'Projects',
  comment: 'Comments',
  wiki_page: 'Wiki',
}

const ENTITY_TYPE_ICONS: Record<string, React.ReactNode> = {
  issue: <Bug className="h-4 w-4" />,
  project: <Folder className="h-4 w-4" />,
  comment: <MessageSquare className="h-4 w-4" />,
  wiki_page: <FileText className="h-4 w-4" />,
}

const SECTION_ORDER = ['issue', 'project', 'comment', 'wiki_page']

const TYPE_FILTER_OPTIONS = [
  { key: 'issue', label: 'Issues' },
  { key: 'project', label: 'Projects' },
  { key: 'comment', label: 'Comments' },
  { key: 'wiki_page', label: 'Wiki' },
]

function getEntityUrl(result: SearchResult): string {
  switch (result.entity_type) {
    case 'issue':
      return `/issues/${result.entity_id}`
    case 'project':
      return `/projects/${result.entity_id}`
    case 'comment':
      return `/comments/${result.entity_id}`
    case 'wiki_page':
      return `/wiki/${result.entity_id}`
    default:
      return result.url ?? '/'
  }
}

export default function CommandPalette() {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)

  const isOpen = useSearchStore((s) => s.isOpen)
  const query = useSearchStore((s) => s.query)
  const selectedIndex = useSearchStore((s) => s.selectedIndex)
  const open = useSearchStore((s) => s.open)
  const close = useSearchStore((s) => s.close)
  const setQuery = useSearchStore((s) => s.setQuery)
  const moveUp = useSearchStore((s) => s.moveUp)
  const moveDown = useSearchStore((s) => s.moveDown)
  const reset = useSearchStore((s) => s.reset)

  // Advanced search state
  const [activeTypeFilters, setActiveTypeFilters] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [saveName, setSaveName] = useState('')
  const [showSavedList, setShowSavedList] = useState(false)

  const { recent: recentSearches, addSearch: addRecentSearch } = useRecentSearches()
  const { saved: savedSearches, saveSearch, removeSearch: removeSavedSearch } = useSavedSearches()

  // Pass type filters to the search
  const types = activeTypeFilters.length > 0 ? activeTypeFilters : undefined
  const { grouped, isSearching, total, data: searchData } = useGlobalSearch(query, types)

  // Extract facet counts from the response (API returns total per type)
  const facetCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    if (grouped) {
      for (const [type, results] of Object.entries(grouped)) {
        counts[type] = results.length
      }
    }
    return counts
  }, [grouped])

  // Flatten results for keyboard navigation
  const flatResults = useMemo(() => {
    const items: SearchResult[] = []
    for (const type of SECTION_ORDER) {
      if (grouped[type]) {
        items.push(...grouped[type])
      }
    }
    for (const type of Object.keys(grouped)) {
      if (!SECTION_ORDER.includes(type)) {
        items.push(...grouped[type])
      }
    }
    return items
  }, [grouped])

  // Reset filters when palette closes
  useEffect(() => {
    if (!isOpen) {
      setActiveTypeFilters([])
      setShowFilters(false)
      setShowSaveDialog(false)
      setShowSavedList(false)
    }
  }, [isOpen])

  // Global Cmd+K / Ctrl+K listener
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (isOpen) {
          close()
        } else {
          open()
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, open, close])

  const handleSelect = useCallback(
    (result: SearchResult) => {
      if (query.length >= 2) {
        addRecentSearch(query)
      }
      reset()
      navigate(getEntityUrl(result))
    },
    [query, reset, navigate, addRecentSearch],
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          if (selectedIndex < flatResults.length - 1) {
            moveDown()
          }
          break
        case 'ArrowUp':
          e.preventDefault()
          moveUp()
          break
        case 'Enter':
          e.preventDefault()
          if (flatResults[selectedIndex]) {
            handleSelect(flatResults[selectedIndex])
          }
          break
        case 'Escape':
          e.preventDefault()
          reset()
          break
      }
    },
    [selectedIndex, flatResults, moveUp, moveDown, handleSelect, reset],
  )

  const handleRecentClick = (search: string) => {
    setQuery(search)
  }

  const handleToggleTypeFilter = (type: string) => {
    setActiveTypeFilters((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    )
  }

  const handleSaveSearch = () => {
    if (!saveName.trim() || !query.trim()) return
    const filters: SearchFilters = {}
    if (activeTypeFilters.length > 0) filters.types = activeTypeFilters
    saveSearch(saveName.trim(), query, filters)
    setSaveName('')
    setShowSaveDialog(false)
  }

  const handleLoadSaved = (saved: { query: string; filters: SearchFilters }) => {
    setQuery(saved.query)
    if (saved.filters.types) {
      setActiveTypeFilters(saved.filters.types)
    }
    setShowSavedList(false)
  }

  const showRecents = query.length < 2 && recentSearches.length > 0 && !showSavedList
  const showResults = query.length >= 2

  // Track running index across sections for keyboard navigation
  let runningIndex = 0

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog onClose={reset} className="relative z-50">
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
        </TransitionChild>

        <div className="fixed inset-0 flex justify-center" style={{ paddingTop: '15%' }}>
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <DialogPanel className="w-full max-w-lg rounded-xl border border-surface-200 bg-white shadow-2xl dark:bg-dark-surface dark:border-dark-border overflow-hidden" style={{ maxHeight: '70vh', alignSelf: 'flex-start' }}>
              {/* Search input bar */}
              <div className="flex items-center gap-2 px-4 py-2 border-b border-surface-200 dark:border-dark-border">
                {isSearching ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-surface-300 border-t-primary-500" />
                ) : (
                  <Search className="h-5 w-5 text-text-secondary" />
                )}
                <input
                  ref={inputRef}
                  autoFocus
                  className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-secondary focus:outline-none"
                  placeholder="Search issues, projects, wiki..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <div className="flex items-center gap-1">
                  {/* Filter toggle */}
                  <button
                    onClick={() => setShowFilters((prev) => !prev)}
                    className={cn(
                      'p-1 rounded transition-colors',
                      showFilters || activeTypeFilters.length > 0
                        ? 'text-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'text-text-secondary hover:text-text-primary hover:bg-surface-100',
                    )}
                    title="Toggle filters"
                  >
                    <Filter className="h-4 w-4" />
                  </button>
                  {/* Saved searches toggle */}
                  <button
                    onClick={() => setShowSavedList((prev) => !prev)}
                    className={cn(
                      'p-1 rounded transition-colors',
                      showSavedList
                        ? 'text-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'text-text-secondary hover:text-text-primary hover:bg-surface-100',
                    )}
                    title="Saved searches"
                  >
                    <Bookmark className="h-4 w-4" />
                  </button>
                  <span className="inline-flex items-center rounded border border-surface-300 px-1.5 py-0.5 text-[0.7rem] text-text-secondary dark:border-dark-border">
                    ESC
                  </span>
                </div>
              </div>

              {/* Filter chips bar */}
              {showFilters && (
                <div className="flex items-center gap-2 px-4 py-2 border-b border-surface-200 dark:border-dark-border bg-surface-50 dark:bg-surface-100">
                  <span className="text-xs text-text-secondary font-medium mr-1">Type:</span>
                  {TYPE_FILTER_OPTIONS.map(({ key, label }) => {
                    const isActive = activeTypeFilters.includes(key)
                    const count = facetCounts[key]
                    return (
                      <button
                        key={key}
                        onClick={() => handleToggleTypeFilter(key)}
                        className={cn(
                          'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border cursor-pointer transition-colors',
                          isActive
                            ? 'bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-800'
                            : 'bg-surface-50 text-text-secondary border-surface-200 hover:bg-surface-100 dark:bg-surface-200 dark:border-surface-300',
                        )}
                      >
                        {label}
                        {showResults && count !== undefined && (
                          <span className="ml-1.5 text-[0.65rem] opacity-70">{count}</span>
                        )}
                      </button>
                    )
                  })}
                  {activeTypeFilters.length > 0 && (
                    <button
                      onClick={() => setActiveTypeFilters([])}
                      className="p-0.5 text-text-tertiary hover:text-text-primary rounded transition-colors"
                      title="Clear filters"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              )}

              {/* Content area */}
              <div className="overflow-auto" style={{ maxHeight: 'calc(70vh - 100px)' }}>
                {/* Saved searches list */}
                {showSavedList && (
                  <div className="p-4">
                    <span className="px-1 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                      Saved searches
                    </span>
                    {savedSearches.length > 0 ? (
                      <div className="mt-1 space-y-0.5">
                        {savedSearches.map((saved) => (
                          <div
                            key={saved.id}
                            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-text-primary hover:bg-surface-100 dark:hover:bg-dark-border transition-colors group"
                          >
                            <Star className="h-4 w-4 text-amber-400 flex-shrink-0" />
                            <button
                              className="flex-1 text-left min-w-0"
                              onClick={() => handleLoadSaved(saved)}
                            >
                              <span className="block truncate font-medium">{saved.name}</span>
                              <span className="block truncate text-xs text-text-secondary">
                                {saved.query}
                                {saved.filters.types && saved.filters.types.length > 0 && (
                                  <> &middot; {saved.filters.types.join(', ')}</>
                                )}
                              </span>
                            </button>
                            <button
                              onClick={() => removeSavedSearch(saved.id)}
                              className="p-1 text-text-tertiary hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                              title="Remove saved search"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-text-secondary">
                        No saved searches yet. Search for something and save it.
                      </p>
                    )}
                  </div>
                )}

                {/* Recent searches */}
                {showRecents && (
                  <div className="p-4">
                    <span className="px-1 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                      Recent searches
                    </span>
                    <div className="mt-1 space-y-0.5">
                      {recentSearches.slice(0, 5).map((search) => (
                        <button
                          key={search}
                          onClick={() => handleRecentClick(search)}
                          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-text-primary hover:bg-surface-100 dark:hover:bg-dark-border transition-colors"
                        >
                          <History className="h-4 w-4 text-text-secondary" />
                          <span>{search}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {showResults && total === 0 && !isSearching && (
                  <div className="p-8 text-center">
                    <p className="text-sm text-text-secondary">
                      No results found for &quot;{query}&quot;
                    </p>
                  </div>
                )}

                {showResults && total > 0 && (
                  <div className="py-1">
                    {/* Faceted result counts summary */}
                    {Object.keys(facetCounts).length > 1 && (
                      <div className="flex items-center gap-2 px-4 py-1.5">
                        <span className="text-xs text-text-tertiary">
                          {total} result{total !== 1 ? 's' : ''}
                        </span>
                        <span className="text-xs text-text-tertiary">&middot;</span>
                        {SECTION_ORDER.map((type) => {
                          const count = facetCounts[type]
                          if (!count) return null
                          return (
                            <span key={type} className="text-xs text-text-tertiary">
                              {ENTITY_TYPE_LABELS[type] ?? type}: {count}
                            </span>
                          )
                        })}
                      </div>
                    )}

                    {SECTION_ORDER.map((type) => {
                      const results = grouped[type]
                      if (!results || results.length === 0) return null

                      const sectionStartIndex = runningIndex
                      const section = (
                        <div key={type}>
                          {sectionStartIndex > 0 && (
                            <hr className="border-surface-200 dark:border-dark-border" />
                          )}
                          <span className="flex items-center gap-2 px-3 pt-3 pb-1 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                            {ENTITY_TYPE_LABELS[type] ?? type}
                            <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-surface-100 dark:bg-surface-200 text-text-tertiary text-[0.65rem] font-medium px-1">
                              {results.length}
                            </span>
                          </span>
                          {results.map((result) => {
                            const itemIndex = runningIndex
                            runningIndex++
                            return (
                              <button
                                key={`${result.entity_type}-${result.entity_id}`}
                                onClick={() => handleSelect(result)}
                                className={cn(
                                  'flex w-full items-center gap-2 mx-1 rounded-md px-2 py-1.5 text-left transition-colors',
                                  selectedIndex === itemIndex
                                    ? 'bg-primary-50 dark:bg-primary-900/20'
                                    : 'hover:bg-surface-100 dark:hover:bg-dark-border',
                                )}
                                style={{ width: 'calc(100% - 8px)' }}
                              >
                                <span className="flex-shrink-0 text-text-secondary">
                                  {ENTITY_TYPE_ICONS[result.entity_type] ?? (
                                    <Search className="h-4 w-4" />
                                  )}
                                </span>
                                <span className="flex-1 min-w-0">
                                  <span className="block truncate text-sm text-text-primary">
                                    {result.title}
                                  </span>
                                  {result.subtitle && (
                                    <span className="block truncate text-xs text-text-secondary">
                                      {result.subtitle}
                                    </span>
                                  )}
                                </span>
                                {selectedIndex === itemIndex && (
                                  <span className="inline-flex items-center rounded border border-surface-300 px-1 py-0.5 text-[0.65rem] text-text-secondary dark:border-dark-border ml-1 flex-shrink-0">
                                    ENTER
                                  </span>
                                )}
                              </button>
                            )
                          })}
                        </div>
                      )
                      return section
                    })}

                    {/* Save this search */}
                    {query.length >= 2 && (
                      <div className="border-t border-surface-200 dark:border-dark-border px-3 py-2">
                        {!showSaveDialog ? (
                          <button
                            onClick={() => setShowSaveDialog(true)}
                            className="flex items-center gap-2 text-xs text-text-secondary hover:text-primary-500 transition-colors"
                          >
                            <BookmarkCheck className="h-3.5 w-3.5" />
                            Save this search
                          </button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <input
                              autoFocus
                              className="flex-1 bg-transparent text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none border border-surface-200 rounded px-2 py-1"
                              placeholder="Name this search..."
                              value={saveName}
                              onChange={(e) => setSaveName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  handleSaveSearch()
                                }
                                if (e.key === 'Escape') {
                                  e.stopPropagation()
                                  setShowSaveDialog(false)
                                }
                              }}
                            />
                            <button
                              onClick={handleSaveSearch}
                              disabled={!saveName.trim()}
                              className="text-xs text-primary-500 hover:text-primary-700 font-medium disabled:opacity-50"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setShowSaveDialog(false)}
                              className="text-xs text-text-tertiary hover:text-text-primary"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {!showRecents && !showResults && !showSavedList && (
                  <div className="p-8 text-center">
                    <p className="text-sm text-text-secondary">
                      Start typing to search...
                    </p>
                  </div>
                )}
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  )
}
