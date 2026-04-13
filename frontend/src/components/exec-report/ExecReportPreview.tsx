import { useState, useRef, useEffect } from 'react'
import { Download, FileText } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Select, type SelectOption } from '@/components/ui/Select'
import {
  useExecReportPreview,
  useGenerateExecReport,
  type ReportPeriod,
} from '@/hooks/useExecReport'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PERIOD_OPTIONS: SelectOption[] = [
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'custom', label: 'Custom Range' },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface ExecReportPreviewProps {
  projectId: string
}

export function ExecReportPreview({ projectId }: ExecReportPreviewProps) {
  const [period, setPeriod] = useState<ReportPeriod>('week')
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

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 px-4 py-3 border-b border-surface-200 bg-surface-50">
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5 text-text-secondary" />
          <span className="text-sm font-semibold text-text-primary">
            Executive Report
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Select
            value={period}
            onChange={(val) => setPeriod(val as ReportPeriod)}
            options={PERIOD_OPTIONS}
            className="w-44"
          />
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
      <div className="flex-1 overflow-auto bg-surface-100 p-6">
        {isPreviewLoading && (
          <div className="flex items-center justify-center h-full">
            <div className="text-sm text-text-secondary">
              Generating preview...
            </div>
          </div>
        )}

        {previewError && (
          <div className="flex items-center justify-center h-full">
            <div className="text-sm text-error">
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
          <div className="mt-4 p-3 rounded-md bg-red-50 dark:bg-red-900/20 text-sm text-error">
            PDF generation failed. Please try again.
          </div>
        )}
      </div>
    </div>
  )
}
