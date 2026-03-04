import { useState, useEffect, useCallback, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import client from '@/api/client'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SearchFilters {
  types?: string[]      // 'issue', 'project', 'comment', 'wiki_page'
  project_id?: string
  assignee_id?: string
  status?: string
  date_from?: string
  date_to?: string
  priority?: string
}

export interface AdvancedSearchResult {
  entity_type: string
  entity_id: string
  title: string
  subtitle: string | null
  url: string | null
  project_name?: string | null
  issue_key?: string | null
}

export interface AdvancedSearchResponse {
  results: AdvancedSearchResult[]
  total: number
  facets?: Record<string, number>
}

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

const searchKeys = {
  results: (query: string, filters: SearchFilters) =>
    ['advanced-search', query, filters] as const,
}

// ---------------------------------------------------------------------------
// Main advanced search hook
// ---------------------------------------------------------------------------

export function useAdvancedSearch(query: string, filters: SearchFilters = {}) {
  const [debouncedQuery, setDebouncedQuery] = useState(query)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  const enabled = debouncedQuery.length >= 2

  const searchQuery = useQuery<AdvancedSearchResponse>({
    queryKey: searchKeys.results(debouncedQuery, filters),
    queryFn: async () => {
      const params: Record<string, string> = { q: debouncedQuery }
      if (filters.types && filters.types.length > 0) {
        params.types = filters.types.join(',')
      }
      if (filters.project_id) params.project_id = filters.project_id
      if (filters.assignee_id) params.assignee_id = filters.assignee_id
      if (filters.status) params.status = filters.status
      if (filters.priority) params.priority = filters.priority
      params.limit = '50'

      const { data } = await client.get('/search', { params })
      return data
    },
    enabled,
    staleTime: 10_000,
  })

  // Group results by entity type
  const grouped: Record<string, AdvancedSearchResult[]> = useMemo(() => {
    const g: Record<string, AdvancedSearchResult[]> = {}
    if (searchQuery.data?.results) {
      for (const result of searchQuery.data.results) {
        const type = result.entity_type
        if (!g[type]) g[type] = []
        g[type].push(result)
      }
    }
    return g
  }, [searchQuery.data])

  return {
    ...searchQuery,
    grouped,
    total: searchQuery.data?.total ?? 0,
    facets: searchQuery.data?.facets ?? {},
    isSearching: searchQuery.isFetching && enabled,
  }
}

// ---------------------------------------------------------------------------
// Recent searches (localStorage)
// ---------------------------------------------------------------------------

const RECENT_KEY = 'friday-recent-searches'
const MAX_RECENT = 10

export function useRecentSearches() {
  const [recent, setRecent] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(RECENT_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  const addSearch = useCallback((query: string) => {
    const trimmed = query.trim()
    if (!trimmed) return
    setRecent((prev) => {
      const filtered = prev.filter((s) => s !== trimmed)
      const updated = [trimmed, ...filtered].slice(0, MAX_RECENT)
      try {
        localStorage.setItem(RECENT_KEY, JSON.stringify(updated))
      } catch {
        // ignore storage errors
      }
      return updated
    })
  }, [])

  const removeSearch = useCallback((query: string) => {
    setRecent((prev) => {
      const updated = prev.filter((s) => s !== query)
      try {
        localStorage.setItem(RECENT_KEY, JSON.stringify(updated))
      } catch {
        // ignore
      }
      return updated
    })
  }, [])

  const clearAll = useCallback(() => {
    setRecent([])
    try {
      localStorage.removeItem(RECENT_KEY)
    } catch {
      // ignore
    }
  }, [])

  return { recent, addSearch, removeSearch, clearAll }
}

// ---------------------------------------------------------------------------
// Saved searches (localStorage)
// ---------------------------------------------------------------------------

const SAVED_KEY = 'friday-saved-searches'

export interface SavedSearch {
  id: string
  name: string
  query: string
  filters: SearchFilters
  created_at: string
}

export function useSavedSearches() {
  const [saved, setSaved] = useState<SavedSearch[]>(() => {
    try {
      const stored = localStorage.getItem(SAVED_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  const saveSearch = useCallback(
    (name: string, query: string, filters: SearchFilters) => {
      const newEntry: SavedSearch = {
        id: crypto.randomUUID(),
        name,
        query,
        filters,
        created_at: new Date().toISOString(),
      }
      setSaved((prev) => {
        const updated = [newEntry, ...prev]
        try {
          localStorage.setItem(SAVED_KEY, JSON.stringify(updated))
        } catch {
          // ignore
        }
        return updated
      })
    },
    [],
  )

  const removeSearch = useCallback((id: string) => {
    setSaved((prev) => {
      const updated = prev.filter((s) => s.id !== id)
      try {
        localStorage.setItem(SAVED_KEY, JSON.stringify(updated))
      } catch {
        // ignore
      }
      return updated
    })
  }, [])

  return { saved, saveSearch, removeSearch }
}
