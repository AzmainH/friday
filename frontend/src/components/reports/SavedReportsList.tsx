import { useState } from 'react'
import { Trash2, Play } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Dialog, DialogFooter } from '@/components/ui/Dialog'
import type { SavedReport, ReportType, ReportConfig } from '@/hooks/useReports'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SavedReportsListProps {
  reports: SavedReport[]
  onRun: (type: ReportType, config: ReportConfig) => void
  onDelete: (id: string) => void
  isDeleting?: boolean
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return iso
  }
}

function typeLabel(type: ReportType): string {
  const labels: Record<ReportType, string> = {
    velocity: 'Velocity',
    burndown: 'Burndown',
    burnup: 'Burn Up',
    cumulative_flow: 'Cumulative Flow',
    cycle_time: 'Cycle Time',
    throughput: 'Throughput',
    workload: 'Workload',
    custom: 'Custom',
  }
  return labels[type] ?? type
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SavedReportsList({
  reports,
  onRun,
  onDelete,
  isDeleting = false,
}: SavedReportsListProps) {
  const [deleteTarget, setDeleteTarget] = useState<SavedReport | null>(null)

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      onDelete(deleteTarget.id)
      setDeleteTarget(null)
    }
  }

  if (reports.length === 0) {
    return (
      <div className="border border-dashed border-surface-200 rounded-[--radius-md] p-8 text-center">
        <p className="text-sm text-text-secondary">
          No saved reports yet. Run a report and save it for quick access.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="border border-surface-200 rounded-[--radius-md] bg-white dark:bg-dark-surface overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold text-text-secondary uppercase">
                Name
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-text-secondary uppercase">
                Type
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-text-secondary uppercase">
                Created
              </th>
              <th className="px-4 py-2 text-right text-xs font-semibold text-text-secondary uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => (
              <tr
                key={report.id}
                className="hover:bg-surface-50 transition-colors"
              >
                <td className="px-4 py-3 border-t border-surface-200 font-medium text-text-primary">
                  {report.name}
                </td>
                <td className="px-4 py-3 border-t border-surface-200">
                  <Badge variant="info" size="sm">
                    {typeLabel(report.report_type)}
                  </Badge>
                </td>
                <td className="px-4 py-3 border-t border-surface-200 text-text-secondary">
                  {formatDate(report.created_at)}
                </td>
                <td className="px-4 py-3 border-t border-surface-200 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      leftIcon={<Play className="h-3.5 w-3.5" />}
                      onClick={() => onRun(report.report_type, report.config_json)}
                    >
                      Run
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                      onClick={() => setDeleteTarget(report)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Delete Saved Report"
        size="sm"
      >
        <p className="text-sm text-text-secondary">
          Are you sure you want to delete{' '}
          <span className="font-semibold text-text-primary">{deleteTarget?.name}</span>? This action
          cannot be undone.
        </p>
        <DialogFooter className="mt-6 border-t-0 px-0">
          <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleConfirmDelete} loading={isDeleting}>
            Delete
          </Button>
        </DialogFooter>
      </Dialog>
    </>
  )
}
