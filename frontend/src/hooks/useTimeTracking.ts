import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from '@/api/client'
import type { TimeEntry } from '@/types/api'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WeeklyTimesheetRow {
  issue_id: string
  issue_key: string
  issue_summary: string
  entries: Record<string, number> // key = ISO date string (YYYY-MM-DD), value = hours
  total: number
}

export interface WeeklyTimesheet {
  user_id: string
  week_start: string
  rows: WeeklyTimesheetRow[]
  daily_totals: Record<string, number>
  grand_total: number
}

export interface LogTimeInput {
  issue_id: string
  hours: number
  date: string
  description?: string | null
}

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

const timeKeys = {
  entries: (issueId: string) => ['timeEntries', issueId] as const,
  weekly: (userId: string, weekStart: string) =>
    ['timesheet', userId, weekStart] as const,
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export function useTimeEntries(issueId: string) {
  return useQuery<TimeEntry[]>({
    queryKey: timeKeys.entries(issueId),
    queryFn: async () => {
      const { data } = await client.get(`/issues/${issueId}/time-entries`)
      return data
    },
    enabled: !!issueId,
  })
}

export function useWeeklyTimesheet(userId: string, weekStart: string) {
  return useQuery<WeeklyTimesheet>({
    queryKey: timeKeys.weekly(userId, weekStart),
    queryFn: async () => {
      const { data } = await client.get('/time/weekly', {
        params: { user_id: userId, week_start: weekStart },
      })
      return data
    },
    enabled: !!userId && !!weekStart,
  })
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export function useLogTime() {
  const qc = useQueryClient()
  return useMutation<TimeEntry, Error, LogTimeInput>({
    mutationFn: async (input) => {
      const { issue_id, ...body } = input
      const { data } = await client.post(`/issues/${issue_id}/time-entries`, body)
      return data
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: timeKeys.entries(data.issue_id) })
      // Invalidate all weekly timesheets since we don't know the exact week key here
      qc.invalidateQueries({ queryKey: ['timesheet'] })
    },
  })
}
