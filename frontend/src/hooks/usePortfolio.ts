import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from '@/api/client'
import type { Release } from '@/types/api'

/* ------------------------------------------------------------------ */
/*  Query-key factories                                                */
/* ------------------------------------------------------------------ */

const portfolioKeys = {
  overview: (workspaceId: string) => ['portfolio', 'overview', workspaceId] as const,
  releases: (workspaceId: string) => ['releases', 'list', workspaceId] as const,
  dependencies: (workspaceId: string) =>
    ['portfolio', 'dependencies', workspaceId] as const,
}

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface PortfolioProject {
  id: string
  name: string
  key_prefix: string
  status: 'active' | 'paused' | 'completed' | 'archived'
  rag_status: 'green' | 'amber' | 'red' | 'none'
  lead_id: string | null
  lead_name: string | null
  lead_avatar_url: string | null
  start_date: string | null
  target_date: string | null
  total_issues: number
  completed_issues: number
  overdue_issues: number
  progress_pct: number
  budget_allocated: number | null
  budget_spent: number | null
}

export interface PortfolioOverview {
  projects: PortfolioProject[]
  summary: {
    total_projects: number
    by_rag: Record<string, number>
    by_status: Record<string, number>
    total_budget_allocated: number
    total_budget_spent: number
  }
}

export interface CrossProjectDependency {
  id: string
  source_project_id: string
  source_project_name: string
  source_issue_id: string | null
  source_issue_key: string | null
  target_project_id: string
  target_project_name: string
  target_issue_id: string | null
  target_issue_key: string | null
  dependency_type: string
  status: string
}

export interface ReleaseProject {
  project_id: string
  project_name: string
}

export interface ReleaseWithProjects extends Release {
  projects: ReleaseProject[]
}

export interface CreateReleaseInput {
  workspace_id: string
  name: string
  description?: string | null
  status?: string
  release_date?: string | null
  project_ids?: string[]
}

/* ------------------------------------------------------------------ */
/*  Query hooks                                                        */
/* ------------------------------------------------------------------ */

/** Fetch portfolio overview with project health summaries. */
export function usePortfolioOverview(workspaceId: string | undefined) {
  return useQuery<PortfolioOverview>({
    queryKey: portfolioKeys.overview(workspaceId ?? ''),
    queryFn: async () => {
      const { data } = await client.get('/portfolio/overview', {
        params: { workspace_id: workspaceId },
      })
      return data
    },
    enabled: !!workspaceId,
  })
}

/** Fetch releases for a workspace. */
export function useReleases(workspaceId: string | undefined) {
  return useQuery<ReleaseWithProjects[]>({
    queryKey: portfolioKeys.releases(workspaceId ?? ''),
    queryFn: async () => {
      const { data } = await client.get('/releases', {
        params: { workspace_id: workspaceId },
      })
      return data
    },
    enabled: !!workspaceId,
  })
}

/** Fetch cross-project dependencies for a workspace. */
export function useCrossProjectDependencies(workspaceId: string | undefined) {
  return useQuery<CrossProjectDependency[]>({
    queryKey: portfolioKeys.dependencies(workspaceId ?? ''),
    queryFn: async () => {
      const { data } = await client.get('/portfolio/dependencies', {
        params: { workspace_id: workspaceId },
      })
      return data
    },
    enabled: !!workspaceId,
  })
}

/* ------------------------------------------------------------------ */
/*  Mutation hooks                                                     */
/* ------------------------------------------------------------------ */

/** Create a new release. */
export function useCreateRelease() {
  const qc = useQueryClient()
  return useMutation<Release, Error, CreateReleaseInput>({
    mutationFn: async (body) => {
      const { data } = await client.post('/releases', body)
      return data
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: portfolioKeys.releases(variables.workspace_id) })
    },
  })
}
