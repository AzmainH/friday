import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from '@/api/client'
import type { CustomDashboard } from '@/types/api'

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

const dashboardKeys = {
  personal: ['dashboards', 'personal'] as const,
  project: (projectId: string) => ['dashboards', 'project', projectId] as const,
  portfolio: (workspaceId: string) => ['dashboards', 'portfolio', workspaceId] as const,
  custom: ['dashboards', 'custom'] as const,
  detail: (id: string) => ['dashboards', 'detail', id] as const,
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DashboardWidget {
  id: string
  type: string
  title: string
  config: Record<string, unknown>
}

export interface DashboardLayout {
  i: string
  x: number
  y: number
  w: number
  h: number
  minW?: number
  minH?: number
}

export interface DashboardData {
  id: string
  name: string
  scope: string
  scope_id: string | null
  layout: DashboardLayout[]
  widgets: DashboardWidget[]
}

export interface SaveDashboardInput {
  id?: string
  name: string
  scope: string
  scope_id?: string | null
  layout_json: Record<string, unknown>
  widgets_json: Record<string, unknown>[]
}

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

function parseDashboard(raw: CustomDashboard): DashboardData {
  const layoutJson = raw.layout_json ?? {}
  const layout = Array.isArray(layoutJson) ? layoutJson : (layoutJson as Record<string, unknown>).items ?? []
  return {
    id: raw.id,
    name: raw.name,
    scope: raw.scope,
    scope_id: raw.scope_id,
    layout: layout as DashboardLayout[],
    widgets: (raw.widgets_json ?? []) as unknown as DashboardWidget[],
  }
}

async function fetchPersonalDashboard(): Promise<DashboardData> {
  const { data } = await client.get('/dashboards/personal')
  return parseDashboard(data)
}

async function fetchProjectDashboard(projectId: string): Promise<DashboardData> {
  const { data } = await client.get(`/dashboards/project/${projectId}`)
  return parseDashboard(data)
}

async function fetchPortfolioDashboard(workspaceId: string): Promise<DashboardData> {
  const { data } = await client.get(`/dashboards/portfolio/${workspaceId}`)
  return parseDashboard(data)
}

async function fetchCustomDashboards(): Promise<DashboardData[]> {
  const { data } = await client.get('/dashboards')
  const list = Array.isArray(data) ? data : data.data ?? []
  return list.map(parseDashboard)
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

/** Fetch the current user's personal dashboard. */
export function usePersonalDashboard() {
  return useQuery<DashboardData>({
    queryKey: dashboardKeys.personal,
    queryFn: fetchPersonalDashboard,
  })
}

/** Fetch the dashboard for a specific project. */
export function useProjectDashboard(projectId: string | undefined) {
  return useQuery<DashboardData>({
    queryKey: dashboardKeys.project(projectId ?? ''),
    queryFn: () => fetchProjectDashboard(projectId!),
    enabled: Boolean(projectId),
  })
}

/** Fetch the portfolio dashboard for a workspace. */
export function usePortfolioDashboard(workspaceId: string | undefined) {
  return useQuery<DashboardData>({
    queryKey: dashboardKeys.portfolio(workspaceId ?? ''),
    queryFn: () => fetchPortfolioDashboard(workspaceId!),
    enabled: Boolean(workspaceId),
  })
}

/** List all custom dashboards owned by the current user. */
export function useCustomDashboards() {
  return useQuery<DashboardData[]>({
    queryKey: dashboardKeys.custom,
    queryFn: fetchCustomDashboards,
  })
}

/** Create or update a dashboard. */
export function useSaveDashboard() {
  const qc = useQueryClient()

  return useMutation<CustomDashboard, Error, SaveDashboardInput>({
    mutationFn: async (input) => {
      if (input.id) {
        const { id, ...body } = input
        const { data } = await client.patch(`/dashboards/${id}`, body)
        return data
      }
      const { data } = await client.post('/dashboards', input)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dashboards'] })
    },
  })
}

/** Delete a dashboard by id. */
export function useDeleteDashboard() {
  const qc = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      await client.delete(`/dashboards/${id}`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dashboards'] })
    },
  })
}
