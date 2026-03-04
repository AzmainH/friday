import { useQuery } from '@tanstack/react-query'
import client from '@/api/client'
import type { PortfolioOverview } from '@/hooks/usePortfolio'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RiskExposureSummary {
  total_risks: number
  high_critical: number
  by_status: Record<string, number>
  by_category: Record<string, number>
}

export interface UpcomingMilestone {
  id: string
  project_id: string
  project_name: string
  name: string
  due_date: string | null
  status: string
  progress_pct: number
}

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

const execKeys = {
  portfolio: (wsId: string) => ['executive', 'portfolio', wsId] as const,
  milestones: (wsId: string) => ['executive', 'milestones', wsId] as const,
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

/** Fetch portfolio overview for executive dashboard. */
export function useExecutivePortfolio(workspaceId: string | undefined) {
  return useQuery<PortfolioOverview>({
    queryKey: execKeys.portfolio(workspaceId ?? ''),
    queryFn: async () => {
      const { data: raw } = await client.get('/portfolio/overview', {
        params: { workspace_id: workspaceId },
      })
      const rawProjects: Record<string, unknown>[] = Array.isArray(raw?.projects)
        ? raw.projects
        : []

      const projects = rawProjects.map((p: Record<string, unknown>) => ({
        id: (p.project_id ?? p.id ?? '') as string,
        name: (p.name ?? '') as string,
        key_prefix: (p.key_prefix ?? '') as string,
        status: (p.status ?? 'active') as 'active' | 'paused' | 'completed' | 'archived',
        rag_status: (p.rag_status ?? 'none') as 'green' | 'amber' | 'red' | 'none',
        lead_id: (p.lead_id ?? null) as string | null,
        lead_name: (p.lead_name ?? null) as string | null,
        lead_avatar_url: (p.lead_avatar_url ?? null) as string | null,
        start_date: (p.start_date ?? null) as string | null,
        target_date: (p.target_date ?? null) as string | null,
        total_issues: (p.total_issues ?? p.issue_count ?? 0) as number,
        completed_issues: (p.completed_issues ?? 0) as number,
        overdue_issues: (p.overdue_issues ?? p.overdue_count ?? 0) as number,
        progress_pct: (p.progress_pct ?? 0) as number,
        budget_allocated: (p.budget_allocated ?? null) as number | null,
        budget_spent: (p.budget_spent ?? null) as number | null,
      }))

      const by_rag: Record<string, number> = { green: 0, amber: 0, red: 0, none: 0 }
      const by_status: Record<string, number> = {}
      for (const p of projects) {
        by_rag[p.rag_status] = (by_rag[p.rag_status] ?? 0) + 1
        by_status[p.status] = (by_status[p.status] ?? 0) + 1
      }

      return {
        projects,
        summary: {
          total_projects: projects.length,
          by_rag,
          by_status,
          total_budget_allocated: (raw?.total_budget ?? 0) as number,
          total_budget_spent: (raw?.total_spent ?? 0) as number,
        },
      }
    },
    enabled: !!workspaceId,
  })
}

/** Fetch upcoming milestones across workspace projects. */
export function useUpcomingMilestones(workspaceId: string | undefined) {
  return useQuery<UpcomingMilestone[]>({
    queryKey: execKeys.milestones(workspaceId ?? ''),
    queryFn: async () => {
      const { data } = await client.get('/milestones', {
        params: { workspace_id: workspaceId, limit: 20 },
      })
      const list = data?.data ?? data ?? []
      return list as UpcomingMilestone[]
    },
    enabled: !!workspaceId,
  })
}
