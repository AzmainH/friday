import { useEffect, useCallback, useRef, useMemo, Fragment } from 'react'
import { useNavigate } from 'react-router-dom'
import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react'
import { Search, Bug, Folder, MessageSquare, FileText, History } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useSearchStore } from '@/stores/searchStore'
import { useGlobalSearch, type SearchResult } from '@/hooks/useGlobalSearch'

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

function getRecentSearches(): string[] {
  try {
    const stored = localStorage.getItem('friday-recent-searches')
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function addRecentSearch(query: string) {
  try {
    const recent = getRecentSearches().filter((s) => s !== query)
    recent.unshift(query)
    localStorage.setItem('friday-recent-searches', JSON.stringify(recent.slice(0, 5)))
  } catch {
    // ignore storage errors
  }
}

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

  const { grouped, isSearching, total } = useGlobalSearch(query)

  // Flatten results for keyboard navigation
  const flatResults = useMemo(() => {
    const items: SearchResult[] = []
    for (const type of SECTION_ORDER) {
      if (grouped[type]) {
        items.push(...grouped[type])
      }
    }
    // Include any types not in SECTION_ORDER
    for (const type of Object.keys(grouped)) {
      if (!SECTION_ORDER.includes(type)) {
        items.push(...grouped[type])
      }
    }
    return items
  }, [grouped])

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
    [query, reset, navigate],
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

  const recentSearches = getRecentSearches()
  const showRecents = query.length < 2 && recentSearches.length > 0
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
            <DialogPanel className="w-full max-w-lg rounded-xl border border-surface-200 bg-white shadow-2xl dark:bg-dark-surface dark:border-dark-border overflow-hidden" style={{ maxHeight: '60vh', alignSelf: 'flex-start' }}>
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
                <span className="inline-flex items-center rounded border border-surface-300 px-1.5 py-0.5 text-[0.7rem] text-text-secondary dark:border-dark-border">
                  ESC
                </span>
              </div>

              {/* Content area */}
              <div className="overflow-auto" style={{ maxHeight: 'calc(60vh - 48px)' }}>
                {showRecents && (
                  <div className="p-4">
                    <span className="px-1 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                      Recent searches
                    </span>
                    <div className="mt-1 space-y-0.5">
                      {recentSearches.map((search) => (
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
                    {SECTION_ORDER.map((type) => {
                      const results = grouped[type]
                      if (!results || results.length === 0) return null

                      const sectionStartIndex = runningIndex
                      const section = (
                        <div key={type}>
                          {sectionStartIndex > 0 && (
                            <hr className="border-surface-200 dark:border-dark-border" />
                          )}
                          <span className="block px-3 pt-3 pb-1 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                            {ENTITY_TYPE_LABELS[type] ?? type}
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
                  </div>
                )}

                {!showRecents && !showResults && (
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
