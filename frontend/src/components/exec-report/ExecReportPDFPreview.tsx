import { useState, useRef, useEffect } from 'react'
import { Download, Printer, FileText } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import {
  useExecReportPreview,
  useGenerateExecReport,
  type ReportPeriod,
} from '@/hooks/useExecReportPDF'

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface ExecReportPDFPreviewProps {
  projectId: string
  defaultPeriod?: ReportPeriod
}

export function ExecReportPDFPreview({
  projectId,
  defaultPeriod = 'week',
}: ExecReportPDFPreviewProps) {
  const [period, setPeriod] = useState<ReportPeriod>(defaultPeriod)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const {
    data: htmlContent,
    isLoading: isPreviewLoading,
    error: previewError,
  } = useExecReportPreview(projectId, period)

  const generatePdf = useGenerateExecReport(projectId)

  // Write HTML content to sandboxed iframe
  useEffect(() => {
    if (htmlContent && iframeRef.current) {
      const doc = iframeRef.current.contentDocument
      if (doc) {
        doc.open()
        doc.write(htmlContent)
        doc.close()
      }
    }
  }, [htmlContent])

  const handleDownload = () => {
    generatePdf.mutate({ period })
  }

  const handlePrint = () => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.print()
    }
  }

  return (
    <div className="flex flex-col h-full bg-surface-50 dark:bg-surface-900">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 px-4 py-3 border-b border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800">
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5 text-text-secondary" />
          <span className="text-sm font-semibold text-text-primary">
            Executive Report
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Period selector */}
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as ReportPeriod)}
            className="text-sm rounded-md border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 px-3 py-1.5 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>

          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Printer className="h-4 w-4" />}
            onClick={handlePrint}
            disabled={!htmlContent}
          >
            Print
          </Button>

          <Button
            variant="primary"
            size="sm"
            leftIcon={<Download className="h-4 w-4" />}
            loading={generatePdf.isPending}
            onClick={handleDownload}
          >
            Download PDF
          </Button>
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 overflow-auto p-6">
        {isPreviewLoading && (
          <div className="flex items-center justify-center h-full">
            <div className="text-sm text-text-secondary">
              Generating preview...
            </div>
          </div>
        )}

        {previewError && (
          <div className="flex items-center justify-center h-full">
            <div className="text-sm text-red-500 dark:text-red-400">
              Failed to load report preview. Please try again.
            </div>
          </div>
        )}

        {htmlContent && (
          <div className="mx-auto max-w-[210mm] bg-white shadow-lg rounded-lg overflow-hidden">
            <iframe
              ref={iframeRef}
              title="Executive Report Preview"
              sandbox="allow-same-origin"
              className="w-full border-0"
              style={{ minHeight: '1200px' }}
            />
          </div>
        )}

        {generatePdf.isError && (
          <div className="mt-4 p-3 rounded-md bg-red-50 dark:bg-red-900/20 text-sm text-red-600 dark:text-red-400">
            PDF generation failed. Please try again.
          </div>
        )}
      </div>
    </div>
  )
}
