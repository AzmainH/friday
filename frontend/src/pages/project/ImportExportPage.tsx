import { useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react'
import { ArrowUpDown, Download, Upload, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Button } from '@/components/ui/Button'
import { useQuery } from '@tanstack/react-query'
import client from '@/api/client'
import { useStartExport, useTaskProgress } from '@/hooks/useImportExport'
import CSVImportWizard from '@/components/import/CSVImportWizard'
import { formatDateTime } from '@/utils/formatters'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ImportExportHistoryEntry {
  id: string
  type: 'import' | 'export'
  format: string
  status: string
  row_count: number | null
  created_at: string
  download_url: string | null
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

function useImportExportHistory(projectId: string) {
  return useQuery<ImportExportHistoryEntry[]>({
    queryKey: ['import-export-history', projectId],
    queryFn: async () => {
      const { data } = await client.get(`/projects/${projectId}/import-export/history`)
      return data.data ?? data
    },
    enabled: !!projectId,
  })
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ImportExportPage() {
  const { projectId = '' } = useParams<{ projectId: string }>()
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv')
  const [exportTaskId, setExportTaskId] = useState<string | null>(null)

  const exportMutation = useStartExport()
  const { task: exportTask, isPolling: exportPolling } = useTaskProgress(exportTaskId)
  const { data: history } = useImportExportHistory(projectId)

  const handleStartExport = useCallback(() => {
    exportMutation.mutate(
      { project_id: projectId, format: exportFormat },
      {
        onSuccess: (data) => {
          setExportTaskId(data.task_id)
        },
      },
    )
  }, [projectId, exportFormat, exportMutation])

  const handleDownload = useCallback(() => {
    if (exportTask?.download_url) {
      window.open(exportTask.download_url, '_blank')
    }
  }, [exportTask])

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <ArrowUpDown className="h-6 w-6 text-primary-500" />
        <h1 className="text-xl font-semibold text-text-primary">
          Import &amp; Export
        </h1>
      </div>

      {/* Tabs */}
      <TabGroup>
        <TabList className="flex gap-1 border-b border-surface-200 mb-6">
          <Tab className={({ selected }) => cn(
            'flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors focus:outline-none',
            selected
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-text-secondary hover:text-text-primary hover:border-surface-300',
          )}>
            <Upload className="h-4 w-4" />
            Import
          </Tab>
          <Tab className={({ selected }) => cn(
            'flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors focus:outline-none',
            selected
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-text-secondary hover:text-text-primary hover:border-surface-300',
          )}>
            <Download className="h-4 w-4" />
            Export
          </Tab>
        </TabList>

        <TabPanels>
          {/* Import tab */}
          <TabPanel>
            <CSVImportWizard projectId={projectId} />
          </TabPanel>

          {/* Export tab */}
          <TabPanel>
            <div className="border border-surface-200 rounded-[--radius-md] bg-white dark:bg-dark-surface mb-6">
              <div className="p-4">
                <h3 className="text-base font-semibold text-text-primary mb-2">
                  Export Issues
                </h3>
                <p className="text-sm text-text-secondary mb-6">
                  Download all issues from this project in your preferred format.
                </p>

                <div className="flex gap-4 items-end mb-6">
                  <div className="min-w-[160px]">
                    <label className="block text-sm font-medium text-text-secondary mb-1">Format</label>
                    <select
                      value={exportFormat}
                      onChange={(e) => setExportFormat(e.target.value as 'csv' | 'json')}
                      className="w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 dark:bg-dark-surface dark:border-dark-border"
                    >
                      <option value="csv">CSV</option>
                      <option value="json">JSON</option>
                    </select>
                  </div>

                  <Button
                    variant="primary"
                    leftIcon={<Download className="h-4 w-4" />}
                    onClick={handleStartExport}
                    disabled={exportMutation.isPending || exportPolling}
                  >
                    {exportPolling ? 'Exporting...' : 'Start Export'}
                  </Button>
                </div>

                {/* Export progress */}
                {exportPolling && (
                  <div className="mb-4">
                    <div className="h-2 bg-surface-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-500 rounded-full transition-all"
                        style={{ width: exportTask?.progress ? `${exportTask.progress}%` : '30%' }}
                      />
                    </div>
                    <p className="text-xs text-text-secondary mt-1">Processing...</p>
                  </div>
                )}

                {/* Export result */}
                {!exportPolling && exportTask?.status === 'completed' && (
                  <div className="mb-4 flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                    <CheckCircle className="h-5 w-5 flex-shrink-0" />
                    <span className="flex-1">Export complete! {exportTask.processed_rows} issues exported.</span>
                    {exportTask.download_url && (
                      <Button size="sm" variant="ghost" onClick={handleDownload}>
                        Download
                      </Button>
                    )}
                  </div>
                )}

                {!exportPolling && exportTask?.status === 'failed' && (
                  <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    Export failed. Please try again.
                  </div>
                )}
              </div>
            </div>
          </TabPanel>
        </TabPanels>
      </TabGroup>

      {/* History */}
      {history && history.length > 0 && (
        <div className="border border-surface-200 rounded-[--radius-md] bg-white dark:bg-dark-surface">
          <div className="p-4">
            <h3 className="text-base font-semibold text-text-primary mb-4">
              History
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-text-secondary uppercase">Date</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-text-secondary uppercase">Type</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-text-secondary uppercase">Format</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-text-secondary uppercase">Status</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-text-secondary uppercase">Rows</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-text-secondary uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((entry) => (
                    <tr key={entry.id} className="hover:bg-surface-50 transition-colors">
                      <td className="px-4 py-2 border-t border-surface-200">{formatDateTime(entry.created_at)}</td>
                      <td className="px-4 py-2 border-t border-surface-200">
                        <span
                          className={cn(
                            'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
                            entry.type === 'import'
                              ? 'bg-primary-50 border-primary-200 text-primary-700'
                              : 'bg-blue-50 border-blue-200 text-blue-700',
                          )}
                        >
                          {entry.type}
                        </span>
                      </td>
                      <td className="px-4 py-2 border-t border-surface-200">
                        <span className="text-sm uppercase">{entry.format}</span>
                      </td>
                      <td className="px-4 py-2 border-t border-surface-200">
                        <span
                          className={cn(
                            'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
                            entry.status === 'completed' && 'bg-green-50 border-green-200 text-green-700',
                            entry.status === 'failed' && 'bg-red-50 border-red-200 text-red-700',
                            entry.status !== 'completed' && entry.status !== 'failed' && 'bg-amber-50 border-amber-200 text-amber-700',
                          )}
                        >
                          {entry.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 border-t border-surface-200">{entry.row_count ?? '\u2014'}</td>
                      <td className="px-4 py-2 border-t border-surface-200">
                        {entry.download_url && (
                          <a
                            href={entry.download_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium"
                          >
                            <Download className="h-3.5 w-3.5" />
                            Download
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
