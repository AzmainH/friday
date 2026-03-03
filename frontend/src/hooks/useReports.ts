import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from '@/api/client'

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

const reportKeys = {
  saved: ['reports', 'saved'] as const,
  detail: (id: string) => ['reports', 'detail', id] as const,
  run: (type: string, config: Record<string, unknown>) =>
    ['reports', 'run', type, config] as const,
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ReportType =
  | 'velocity'
  | 'burndown'
  | 'burnup'
  | 'cumulative_flow'
  | 'cycle_time'
  | 'throughput'
  | 'workload'
  | 'custom'

export interface ReportConfig {
  project_id?: string
  workspace_id?: string
  date_from?: string
  date_to?: string
  group_by?: string
  sprint_id?: string
  [key: string]: unknown
}

export interface SavedReport {
  id: string
  owner_id: string
  name: string
  report_type: ReportType
  config_json: ReportConfig
  created_at: string
  updated_at: string
}

export interface ReportDataPoint {
  label: string
  value: number
  [key: string]: unknown
}

export interface ReportResult {
  report_type: ReportType
  title: string
  data: ReportDataPoint[]
  series?: { name: string; data: ReportDataPoint[] }[]
  summary?: Record<string, unknown>
}

export interface CreateReportInput {
  name: string
  report_type: ReportType
  config_json: ReportConfig
}

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

async function fetchSavedReports(): Promise<SavedReport[]> {
  const { data } = await client.get('/reports')
  return Array.isArray(data) ? data : data.data ?? []
}

async function runReport(
  type: ReportType,
  config: ReportConfig,
): Promise<ReportResult> {
  const { data } = await client.post('/reports/run', {
    report_type: type,
    config,
  })
  return data
}

async function createReport(input: CreateReportInput): Promise<SavedReport> {
  const { data } = await client.post('/reports', input)
  return data
}

async function deleteReport(id: string): Promise<void> {
  await client.delete(`/reports/${id}`)
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

/** List all saved reports for the current user. */
export function useSavedReports() {
  return useQuery<SavedReport[]>({
    queryKey: reportKeys.saved,
    queryFn: fetchSavedReports,
  })
}

/** Run a report with the given type and configuration. */
export function useRunReport(
  type: ReportType | undefined,
  config: ReportConfig | undefined,
) {
  return useQuery<ReportResult>({
    queryKey: reportKeys.run(type ?? '', config ?? {}),
    queryFn: () => runReport(type!, config!),
    enabled: Boolean(type) && Boolean(config),
  })
}

/** Create (save) a new report. */
export function useCreateReport() {
  const qc = useQueryClient()

  return useMutation<SavedReport, Error, CreateReportInput>({
    mutationFn: createReport,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: reportKeys.saved })
    },
  })
}

/** Delete a saved report by id. */
export function useDeleteReport() {
  const qc = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: deleteReport,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: reportKeys.saved })
    },
  })
}
