import { useState } from 'react'
import { Search, FileText } from 'lucide-react'
import { useWikiSearch } from '@/hooks/useWiki'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface WikiSearchProps {
  spaceId: string
  onPageSelect?: (pageId: string) => void
}

// ---------------------------------------------------------------------------
// WikiSearch
// ---------------------------------------------------------------------------

export default function WikiSearch({ spaceId, onPageSelect }: WikiSearchProps) {
  const [query, setQuery] = useState('')
  const { data: results, isLoading, isFetching } = useWikiSearch(spaceId, query)

  const searchResults = results ?? []
  const hasQuery = query.trim().length >= 2
  const showResults = hasQuery

  return (
    <div className="flex flex-col gap-2">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary pointer-events-none" />
        <input
          type="text"
          className="w-full pl-9 pr-9 py-2 text-sm bg-white dark:bg-dark-surface border border-surface-200 rounded-[--radius-sm] outline-none placeholder:text-text-tertiary focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
          placeholder="Search wiki pages..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {isFetching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="animate-spin h-4 w-4 border-2 border-primary-500 border-t-transparent rounded-full" />
          </div>
        )}
      </div>

      {/* Results */}
      {showResults && (
        <div className="bg-white dark:bg-dark-surface border border-surface-200 rounded-[--radius-sm] overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center p-6">
              <div className="animate-spin h-5 w-5 border-2 border-primary-500 border-t-transparent rounded-full" />
            </div>
          ) : searchResults.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-sm text-text-secondary">
                No results found for &quot;{query}&quot;
              </p>
            </div>
          ) : (
            <>
              <div className="px-3 py-1.5 border-b border-surface-200">
                <span className="text-xs text-text-secondary">
                  {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
                </span>
              </div>
              <div>
                {searchResults.map((result) => (
                  <div
                    key={result.page_id}
                    role="button"
                    tabIndex={0}
                    onClick={() => onPageSelect?.(result.page_id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        onPageSelect?.(result.page_id)
                      }
                    }}
                    className="px-3 py-2 cursor-pointer hover:bg-surface-50 border-b border-surface-200 last:border-b-0 flex items-center gap-3"
                  >
                    <FileText className="h-4 w-4 text-text-secondary shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-text-primary truncate">
                          {result.title}
                        </span>
                        {result.relevance >= 0.8 && (
                          <span className="px-1.5 py-0.5 text-[10px] font-medium border border-primary-500 text-primary-600 rounded-full shrink-0">
                            Best match
                          </span>
                        )}
                      </div>
                      {result.snippet && (
                        <span
                          className="text-xs text-text-secondary line-clamp-2 [&_mark]:bg-warning/30 [&_mark]:rounded-sm [&_mark]:px-0.5"
                          dangerouslySetInnerHTML={{ __html: result.snippet }}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
