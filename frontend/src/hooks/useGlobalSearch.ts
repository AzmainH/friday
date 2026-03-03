import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import client from '@/api/client'

export interface SearchResult {
  entity_type: string
  entity_id: string
  title: string
  subtitle: string | null
  url: string | null
}

interface SearchResponse {
  results: SearchResult[]
  total: number
}

interface GroupedResults {
  [entityType: string]: SearchResult[]
}

export function useGlobalSearch(query: string, types?: string[]) {
  const [debouncedQuery, setDebouncedQuery] = useState(query)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  const enabled = debouncedQuery.length >= 2

  const searchQuery = useQuery<SearchResponse>({
    queryKey: ['global-search', debouncedQuery, types],
    queryFn: async () => {
      const params: Record<string, string> = { q: debouncedQuery }
      if (types && types.length > 0) {
        params.types = types.join(',')
      }
      const { data } = await client.get('/search', { params })
      return data
    },
    enabled,
    staleTime: 10_000,
  })

  const grouped: GroupedResults = {}
  if (searchQuery.data?.results) {
    for (const result of searchQuery.data.results) {
      const type = result.entity_type
      if (!grouped[type]) {
        grouped[type] = []
      }
      grouped[type].push(result)
    }
  }

  return {
    ...searchQuery,
    grouped,
    total: searchQuery.data?.total ?? 0,
    isSearching: searchQuery.isFetching && enabled,
  }
}
