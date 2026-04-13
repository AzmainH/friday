import { useQuery, useMutation } from '@tanstack/react-query'
import client from '@/api/client'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ReportPeriod = 'week' | 'month' | 'custom'

export interface ExecReportRequest {
  period?: ReportPeriod
  start_date?: string
  end_date?: string
}

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

const execReportKeys = {
  preview: (projectId: string, period: ReportPeriod) =>
    ['exec-report', 'preview', projectId, period] as const,
}

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

async function downloadPdfBlob(
  url: string,
  body?: ExecReportRequest,
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
  return useMutation<void, Error, ExecReportRequest | undefined>({
    mutationFn: async (body) => {
      const blob = await downloadPdfBlob(
        `/projects/${projectId}/reports-pdf/executive`,
        body,
      )
      triggerBlobDownload(blob, `exec-report-${projectId}.pdf`)
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
    queryKey: execReportKeys.preview(projectId ?? '', period),
    queryFn: async () => {
      const { data } = await client.get(
        `/projects/${projectId}/reports-pdf/executive/preview`,
        { params: { period } },
      )
      return data
    },
    enabled: !!projectId,
  })
}

/**
 * Generate and download a portfolio PDF report for a workspace.
 */
export function useGeneratePortfolioReport(workspaceId: string) {
  return useMutation<void, Error, void>({
    mutationFn: async () => {
      const blob = await downloadPdfBlob(
        `/workspaces/${workspaceId}/reports-pdf/portfolio`,
      )
      triggerBlobDownload(blob, `portfolio-report-${workspaceId}.pdf`)
    },
  })
}
