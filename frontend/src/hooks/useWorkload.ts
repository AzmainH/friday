import { useQuery } from '@tanstack/react-query'
import client from '@/api/client'

// ---- Types ----

export interface WorkloadEntry {
  user_id: string
  display_name: string
  avatar_url: string | null
  weekly_hours: WeeklyHours[]
  total_hours: number
  capacity_hours_per_week: number
}

export interface WeeklyHours {
  week_start: string // ISO date string for the Monday of the week
  allocated_hours: number
  capacity_hours: number
}

export interface WorkloadData {
  entries: WorkloadEntry[]
  weeks: string[] // ordered list of week_start dates
}

// ---- Query keys ----

const workloadKeys = {
  all: (projectId: string) => ['workload', projectId] as const,
}

// ---- Hooks ----

/**
 * Fetch workload data for a project.
 * Aggregates estimated_hours by assignee by week, computed from issues.
 */
export function useWorkload(projectId: string) {
  return useQuery<WorkloadData>({
    queryKey: workloadKeys.all(projectId),
    queryFn: async () => {
      const { data } = await client.get(`/projects/${projectId}/workload`)
      return data
    },
    enabled: !!projectId,
  })
}

// ---- Utility helpers ----

/** Determine overallocation status for a given hours value relative to capacity */
export function getAllocationLevel(
  allocated: number,
  capacity: number,
): 'under' | 'normal' | 'over' {
  if (capacity <= 0) return allocated > 0 ? 'over' : 'normal'
  const ratio = allocated / capacity
  if (ratio <= 0.7) return 'under'
  if (ratio <= 1.0) return 'normal'
  return 'over'
}

/** Get heatmap color based on allocation ratio */
export function getHeatmapColor(allocated: number, capacity: number): string {
  if (capacity <= 0) return allocated > 0 ? '#f44336' : '#e0e0e0'
  const ratio = allocated / capacity
  if (ratio === 0) return '#e0e0e0'
  if (ratio <= 0.5) return '#c8e6c9' // light green
  if (ratio <= 0.7) return '#a5d6a7' // green
  if (ratio <= 0.9) return '#81c784' // medium green
  if (ratio <= 1.0) return '#66bb6a' // solid green
  if (ratio <= 1.2) return '#ffb74d' // amber
  return '#f44336' // red (over-allocated)
}
