import { useCallback } from 'react'
import { Dialog, DialogFooter } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { useCompleteSprint } from '@/hooks/useSprints'
import type { SprintBurndown } from '@/hooks/useSprints'

interface SprintCompleteDialogProps {
  open: boolean
  onClose: () => void
  sprintId: string
  sprintName: string
  burndown: SprintBurndown | undefined
}

export default function SprintCompleteDialog({
  open,
  onClose,
  sprintId,
  sprintName,
  burndown,
}: SprintCompleteDialogProps) {
  const completeSprint = useCompleteSprint()

  const handleComplete = useCallback(async () => {
    await completeSprint.mutateAsync(sprintId)
    onClose()
  }, [sprintId, completeSprint, onClose])

  const completedIssues = burndown?.completed_issues ?? 0
  const totalIssues = burndown?.total_issues ?? 0
  const remainingIssues = totalIssues - completedIssues
  const completedPoints = burndown?.completed_points ?? 0

  return (
    <Dialog open={open} onClose={() => onClose()} title="Complete Sprint" size="md">
      <div className="space-y-4">
        <p className="text-sm text-text-secondary">
          You are about to complete <span className="font-semibold text-text-primary">{sprintName}</span>.
        </p>

        <div className="grid grid-cols-3 gap-4">
          <div className="border border-surface-200 rounded-[--radius-md] bg-surface-50 dark:bg-dark-surface p-3 text-center">
            <p className="text-2xl font-bold text-text-primary">{totalIssues}</p>
            <p className="text-xs text-text-secondary mt-1">Total Issues</p>
          </div>
          <div className="border border-surface-200 rounded-[--radius-md] bg-green-50 dark:bg-green-900/20 p-3 text-center">
            <p className="text-2xl font-bold text-green-700 dark:text-green-400">{completedIssues}</p>
            <p className="text-xs text-text-secondary mt-1">Completed</p>
          </div>
          <div className="border border-surface-200 rounded-[--radius-md] bg-amber-50 dark:bg-amber-900/20 p-3 text-center">
            <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">{remainingIssues}</p>
            <p className="text-xs text-text-secondary mt-1">Remaining</p>
          </div>
        </div>

        <div className="border border-surface-200 rounded-[--radius-md] bg-white dark:bg-dark-surface p-4">
          <p className="text-sm text-text-secondary">Velocity (completed story points)</p>
          <p className="text-3xl font-bold text-primary-600 dark:text-primary-400 mt-1">
            {completedPoints}
          </p>
        </div>

        {remainingIssues > 0 && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-sm text-amber-700 dark:text-amber-400">
            {remainingIssues} incomplete issue{remainingIssues !== 1 ? 's' : ''} will be moved back to the backlog.
          </div>
        )}
      </div>

      <DialogFooter className="mt-6 border-t-0 px-0">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={handleComplete}
          disabled={completeSprint.isPending}
          loading={completeSprint.isPending}
        >
          Complete Sprint
        </Button>
      </DialogFooter>
    </Dialog>
  )
}
