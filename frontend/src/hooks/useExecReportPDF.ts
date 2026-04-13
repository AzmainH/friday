import { useQuery, useMutation } from '@tanstack/react-query'
import client from '@/api/client'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ReportPeriod = 'week' | 'month'

export interface ScheduleReportRequest {
  cron_expression: string
  recipients: string[]
}

export interface ScheduleReportResponse {
  status: string
  message: string
}

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

const execReportPDFKeys = {
  preview: (projectId: string, period: ReportPeriod) =>
    ['exec-report-pdf', 'preview', projectId, period] as const,
}

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

async function downloadReportBlob(
  url: string,
  body?: { period?: ReportPeriod },
): Promise<Blob> {
  const { data } = await client.post(url, body ?? {}, {
    responseType: 'blob',
  })
  return data
}

function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

/**
 * Generate and download an executive PDF report for a project.
 * Returns a mutation that triggers PDF generation and browser download.
 */
export function useGenerateExecReport(projectId: string) {
  return useMutation<void, Error, { period?: ReportPeriod } | undefined>({
    mutationFn: async (body) => {
      const blob = await downloadReportBlob(
        `/projects/${projectId}/reports/executive`,
        body,
      )
      const contentType = blob.type
      const ext = contentType === 'application/pdf' ? 'pdf' : 'html'
      triggerBlobDownload(blob, `exec-report-${projectId}.${ext}`)
    },
  })
}

/**
 * Fetch the executive report as HTML for in-browser preview.
 * Returns the raw HTML string to render inside a sandboxed iframe.
 */
export function useExecReportPreview(
  projectId: string | undefined,
  period: ReportPeriod = 'week',
) {
  return useQuery<string>({
    queryKey: execReportPDFKeys.preview(projectId ?? '', period),
    queryFn: async () => {
      const { data } = await client.get(
        `/projects/${projectId}/reports/executive/preview`,
        { params: { period } },
      )
      return data
    },
    enabled: !!projectId,
  })
}

/**
 * Create or update a scheduled report configuration for a project.
 */
export function useScheduleReport(projectId: string) {
  return useMutation<ScheduleReportResponse, Error, ScheduleReportRequest>({
    mutationFn: async (body) => {
      const { data } = await client.post(
        `/projects/${projectId}/reports/schedule`,
        body,
      )
      return data
    },
  })
}
