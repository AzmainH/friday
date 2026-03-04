import { useQuery } from '@tanstack/react-query'
import client from '@/api/client'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CapacityMember {
  user_id: string
  display_name: string
  email: string
  weekly_capacity_hours: number
  total_capacity_hours: number
}

export interface TeamCapacity {
  members: CapacityMember[]
  weeks: number
  hours_per_week: number
}

export interface ProjectAllocation {
  project_id: string
  allocated_hours: number
  issue_count: number
}

export interface MemberAllocation {
  user_id: string
  total_allocated_hours: number
  projects: ProjectAllocation[]
}

export interface TeamAllocation {
  allocations: MemberAllocation[]
  weeks: number
}

export interface UtilizationMember {
  user_id: string
  display_name: string
  capacity_hours: number
  allocated_hours: number
  available_hours: number
  utilization_percent: number
  status: 'over' | 'optimal' | 'under'
}

export interface UtilizationReport {
  utilization: UtilizationMember[]
  weeks: number
}

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

const resourceKeys = {
  capacity: (wsId: string, weeks: number) =>
    ['resource-planning', 'capacity', wsId, weeks] as const,
  allocation: (wsId: string, weeks: number) =>
    ['resource-planning', 'allocation', wsId, weeks] as const,
  utilization: (wsId: string, weeks: number) =>
    ['resource-planning', 'utilization', wsId, weeks] as const,
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useTeamCapacity(workspaceId: string | undefined, weeks = 4) {
  return useQuery<TeamCapacity>({
    queryKey: resourceKeys.capacity(workspaceId ?? '', weeks),
    queryFn: async () => {
      const { data } = await client.get(
        `/workspaces/${workspaceId}/resource-planning/capacity`,
        { params: { weeks } },
      )
      return data
    },
    enabled: !!workspaceId,
  })
}

export function useTeamAllocation(workspaceId: string | undefined, weeks = 4) {
  return useQuery<TeamAllocation>({
    queryKey: resourceKeys.allocation(workspaceId ?? '', weeks),
    queryFn: async () => {
      const { data } = await client.get(
        `/workspaces/${workspaceId}/resource-planning/allocation`,
        { params: { weeks } },
      )
      return data
    },
    enabled: !!workspaceId,
  })
}

export function useUtilizationReport(workspaceId: string | undefined, weeks = 4) {
  return useQuery<UtilizationReport>({
    queryKey: resourceKeys.utilization(workspaceId ?? '', weeks),
    queryFn: async () => {
      const { data } = await client.get(
        `/workspaces/${workspaceId}/resource-planning/utilization`,
        { params: { weeks } },
      )
      return data
    },
    enabled: !!workspaceId,
  })
}
